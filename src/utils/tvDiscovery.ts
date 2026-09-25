import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { TVBrand, TVDevice, ConnectionProtocol } from '../types';
import { getDefaultAppsForBrand, getDefaultShortcutsForBrand } from '../data/defaultTVs';

export interface DiscoveredTV {
  ip: string;
  name: string;
  brand: TVBrand;
  model?: string;
  port: number;
  protocol: ConnectionProtocol;
  responseTimeMs: number;
  source: 'mdns' | 'subnet_scan' | 'ssdp' | 'diagnostic';
  openPorts?: number[];
}

export interface ScanProgress {
  currentIp: string;
  scannedCount: number;
  totalCount: number;
  isScanning: boolean;
  statusText: string;
}

export interface TVDiagnosticResult {
  ip: string;
  dialOpen: boolean; // Port 8008
  rokuOpen: boolean; // Port 8060
  samsungOpen: boolean; // Port 8001 / 8002
  lgOpen: boolean; // Port 3000 / 3001
  tclOpen: boolean; // Port 4123 / 8080
  androidTvRemoteOpen: boolean; // Port 6466 / 6467
  adbOpen: boolean; // Port 5555
  sonyOpen: boolean; // Port 80
  detectedBrand?: TVBrand;
  recommendedProtocol: ConnectionProtocol;
  recommendedPort: number;
  details: string;
}

export const isNativeApp = (): boolean => Capacitor.isNativePlatform();

/**
  * Gets native bridge if running inside Android APK
  */
const getNativeBridge = () => {
  return (window as unknown as {
    AndroidNativeRemote?: {
      getWifiSubnet?: () => string;
      isPortOpen?: (ip: string, port: number, timeoutMs: number) => boolean;
      sendHttp?: (url: string, method: string, body: string, timeoutMs: number) => boolean;
      pingIp?: (ip: string, timeoutMs: number) => boolean;
      scanSubnetFast?: (subnetBase: string, startIp: number, endIp: number, timeoutMs: number) => string;
    };
  }).AndroidNativeRemote;
};

/**
 * Automatically detects the phone's current Wi-Fi subnet.
 */
export const getDetectedSubnet = (): string => {
  const bridge = getNativeBridge();
  if (bridge?.getWifiSubnet) {
    try {
      const subnet = bridge.getWifiSubnet();
      if (subnet && subnet.length > 5) return subnet;
    } catch {
      // ignore
    }
  }
  return '192.168.1.';
};

/**
 * Checks if a specific TCP port is open on an IP.
 */
export const checkPortOpen = async (ip: string, port: number, timeoutMs: number = 600): Promise<boolean> => {
  const bridge = getNativeBridge();
  if (bridge?.isPortOpen) {
    try {
      return bridge.isPortOpen(ip, port, timeoutMs);
    } catch {
      // continue to http probe
    }
  }

  // HTTP probe fallback
  try {
    const isNative = Capacitor.isNativePlatform();
    const url = `http://${ip}:${port}/`;
    if (isNative) {
      const res = await CapacitorHttp.get({
        url,
        connectTimeout: timeoutMs,
        readTimeout: timeoutMs,
      });
      return res.status > 0;
    } else {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      await fetch(url, { method: 'HEAD', mode: 'no-cors', signal: controller.signal });
      clearTimeout(timeoutId);
      return true;
    }
  } catch {
    return false;
  }
};

/**
 * Probes a specific IP address for known Smart TV service endpoints.
 */
export const probeTVDevice = async (
  ip: string,
  timeoutMs: number = 800
): Promise<DiscoveredTV | null> => {
  const startTime = Date.now();
  const isNative = Capacitor.isNativePlatform();

  // Test 1: DIAL Protocol (Port 8008) - Used by Android TV, TCL, Google TV, Sony, Fire TV
  try {
    const dialUrl = `http://${ip}:8008/ssdp/device-desc.xml`;
    let xmlData = '';

    if (isNative) {
      const res = await CapacitorHttp.get({
        url: dialUrl,
        connectTimeout: timeoutMs,
        readTimeout: timeoutMs,
      });
      if (res.status === 200 && res.data) {
        xmlData = typeof res.data === 'string' ? res.data : '';
      }
    } else {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(dialUrl, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        xmlData = await res.text();
      }
    }

    if (xmlData) {
      let friendlyName = `Smart TV (${ip})`;
      let manufacturer = '';
      let modelName = 'Smart TV';

      const nameMatch = xmlData.match(/<friendlyName>(.*?)<\/friendlyName>/);
      if (nameMatch && nameMatch[1]) friendlyName = nameMatch[1];

      const manMatch = xmlData.match(/<manufacturer>(.*?)<\/manufacturer>/);
      if (manMatch && manMatch[1]) manufacturer = manMatch[1].toLowerCase();

      const modelMatch = xmlData.match(/<modelName>(.*?)<\/modelName>/);
      if (modelMatch && modelMatch[1]) modelName = modelMatch[1];

      let brand: TVBrand = 'generic';
      let protocol: ConnectionProtocol = 'auto';

      if (manufacturer.includes('samsung')) {
        brand = 'samsung';
        protocol = 'samsung_tizen';
      } else if (manufacturer.includes('lg')) {
        brand = 'lg';
        protocol = 'lg_webos';
      } else if (manufacturer.includes('sony')) {
        brand = 'sony';
        protocol = 'sony_rest';
      } else if (manufacturer.includes('tcl') || friendlyName.toLowerCase().includes('tcl')) {
        brand = 'tcl';
        protocol = 'tcl_tcast';
      } else if (manufacturer.includes('xiaomi') || manufacturer.includes('mi')) {
        brand = 'xiaomi';
        protocol = 'auto';
      } else if (manufacturer.includes('oneplus')) {
        brand = 'oneplus';
        protocol = 'auto';
      } else if (manufacturer.includes('realme')) {
        brand = 'realme';
        protocol = 'auto';
      } else if (manufacturer.includes('motorola')) {
        brand = 'motorola';
        protocol = 'auto';
      } else if (manufacturer.includes('hisense')) {
        brand = 'hisense';
        protocol = 'auto';
      } else if (manufacturer.includes('google') || manufacturer.includes('chromecast')) {
        brand = 'chromecast';
        protocol = 'auto';
      }

      return {
        ip,
        name: friendlyName,
        brand,
        model: modelName,
        port: brand === 'tcl' ? 4123 : (brand === 'samsung' ? 8001 : (brand === 'lg' ? 3000 : 8008)),
        protocol,
        responseTimeMs: Date.now() - startTime,
        source: 'subnet_scan',
      };
    }
  } catch {
    // Continue
  }

  // Test 1B: DIAL Netflix quick ping (Port 8008)
  try {
    const netflixUrl = `http://${ip}:8008/apps/Netflix`;
    let isDialAlive = false;
    if (isNative) {
      const res = await CapacitorHttp.get({
        url: netflixUrl,
        connectTimeout: timeoutMs,
        readTimeout: timeoutMs,
      });
      isDialAlive = res.status === 200 || res.status === 404 || res.status === 405;
    } else {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      await fetch(netflixUrl, { method: 'HEAD', mode: 'no-cors', signal: controller.signal });
      clearTimeout(timeoutId);
      isDialAlive = true;
    }

    if (isDialAlive) {
      // Rapid check for Roku, Samsung, LG, Sony, or T-Cast
      const [isRoku, isSamsung, isLg, isSony, isTcast] = await Promise.all([
        checkPortOpen(ip, 8060, 400),
        checkPortOpen(ip, 8001, 400),
        checkPortOpen(ip, 3000, 400),
        checkPortOpen(ip, 80, 400),
        checkPortOpen(ip, 4123, 400),
      ]);

      if (isRoku) {
        return {
          ip,
          name: `Roku TV (${ip})`,
          brand: 'tcl',
          model: 'Roku OS',
          port: 8060,
          protocol: 'tcl_roku_ecp',
          responseTimeMs: Date.now() - startTime,
          source: 'subnet_scan',
        };
      }
      if (isSamsung) {
        return {
          ip,
          name: `Samsung Smart TV (${ip})`,
          brand: 'samsung',
          model: 'Samsung Tizen TV',
          port: 8001,
          protocol: 'samsung_tizen',
          responseTimeMs: Date.now() - startTime,
          source: 'subnet_scan',
        };
      }
      if (isLg) {
        return {
          ip,
          name: `LG webOS TV (${ip})`,
          brand: 'lg',
          model: 'LG webOS TV',
          port: 3000,
          protocol: 'lg_webos',
          responseTimeMs: Date.now() - startTime,
          source: 'subnet_scan',
        };
      }
      if (isSony) {
        return {
          ip,
          name: `Sony Bravia TV (${ip})`,
          brand: 'sony',
          model: 'Sony Bravia Google TV',
          port: 80,
          protocol: 'sony_rest',
          responseTimeMs: Date.now() - startTime,
          source: 'subnet_scan',
        };
      }
      if (isTcast) {
        return {
          ip,
          name: `TCL Smart TV (${ip})`,
          brand: 'tcl',
          model: 'TCL TV+ Android TV',
          port: 4123,
          protocol: 'tcl_tcast',
          responseTimeMs: Date.now() - startTime,
          source: 'subnet_scan',
        };
      }

      return {
        ip,
        name: `Smart TV / Android TV (${ip})`,
        brand: 'generic',
        model: 'Android TV / Google TV',
        port: 8008,
        protocol: 'auto',
        responseTimeMs: Date.now() - startTime,
        source: 'subnet_scan',
      };
    }
  } catch {
    // Continue
  }

  // Test 2: TCL T-Cast / MagiConnect endpoint (Port 4123)
  try {
    const tcastOpen = await checkPortOpen(ip, 4123, timeoutMs);
    if (tcastOpen) {
      return {
        ip,
        name: `TCL Smart TV (${ip})`,
        brand: 'tcl',
        model: 'TCL TV+ Android TV',
        port: 4123,
        protocol: 'tcl_tcast',
        responseTimeMs: Date.now() - startTime,
        source: 'subnet_scan',
      };
    }
  } catch {
    // Continue
  }

  // Test 3: Roku TV Discovery Endpoint (Port 8060)
  try {
    const url = `http://${ip}:8060/query/device-info`;
    if (isNative) {
      const res = await CapacitorHttp.get({
        url,
        connectTimeout: timeoutMs,
        readTimeout: timeoutMs,
      });
      if (res.status === 200 && res.data) {
        let name = `Roku / TCL TV (${ip})`;
        if (typeof res.data === 'string' && res.data.includes('<user-given-name>')) {
          const match = res.data.match(/<user-given-name>(.*?)<\/user-given-name>/);
          if (match && match[1]) name = match[1];
        }
        return {
          ip,
          name,
          brand: 'tcl',
          model: 'Roku OS / TCL',
          port: 8060,
          protocol: 'tcl_roku_ecp',
          responseTimeMs: Date.now() - startTime,
          source: 'subnet_scan',
        };
      }
    } else {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      await fetch(url, { method: 'GET', mode: 'no-cors', signal: controller.signal });
      clearTimeout(timeoutId);
      const elapsed = Date.now() - startTime;
      if (elapsed < timeoutMs - 50) {
        return {
          ip,
          name: `Roku / TCL TV (${ip})`,
          brand: 'tcl',
          port: 8060,
          protocol: 'tcl_roku_ecp',
          responseTimeMs: elapsed,
          source: 'subnet_scan',
        };
      }
    }
  } catch {
    // Continue
  }

  // Test 4: Samsung Smart TV Tizen API (Port 8001 / 8002)
  try {
    const url = `http://${ip}:8001/api/v2/`;
    if (isNative) {
      const res = await CapacitorHttp.get({
        url,
        connectTimeout: timeoutMs,
        readTimeout: timeoutMs,
      });
      if (res.status === 200 && res.data) {
        const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
        const name = data?.device?.name || `Samsung Smart TV (${ip})`;
        const model = data?.device?.modelName || 'Samsung Tizen TV';
        return {
          ip,
          name,
          brand: 'samsung',
          model,
          port: 8002,
          protocol: 'samsung_tizen',
          responseTimeMs: Date.now() - startTime,
          source: 'subnet_scan',
        };
      }
    } else {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, { method: 'GET', mode: 'cors', signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        return {
          ip,
          name: data?.device?.name || `Samsung TV (${ip})`,
          brand: 'samsung',
          model: data?.device?.modelName || 'Samsung Tizen TV',
          port: 8002,
          protocol: 'samsung_tizen',
          responseTimeMs: Date.now() - startTime,
          source: 'subnet_scan',
        };
      }
    }
  } catch {
    // Continue
  }

  // Test 5: LG webOS Smart TV (Port 3000 / 3001)
  try {
    const lgOpen = await checkPortOpen(ip, 3000, timeoutMs);
    if (lgOpen) {
      return {
        ip,
        name: `LG webOS TV (${ip})`,
        brand: 'lg',
        model: 'LG webOS Smart TV',
        port: 3000,
        protocol: 'lg_webos',
        responseTimeMs: Date.now() - startTime,
        source: 'subnet_scan',
      };
    }
  } catch {
    // Continue
  }

  // Test 6: Sony Bravia IP Control (Port 80)
  try {
    const url = `http://${ip}:80/sony/system`;
    if (isNative) {
      const res = await CapacitorHttp.get({
        url,
        connectTimeout: timeoutMs,
        readTimeout: timeoutMs,
      });
      if (res.status === 200 || res.status === 403 || res.status === 401) {
        return {
          ip,
          name: `Sony Bravia TV (${ip})`,
          brand: 'sony',
          model: 'Bravia XR Series',
          port: 80,
          protocol: 'sony_rest',
          responseTimeMs: Date.now() - startTime,
          source: 'subnet_scan',
        };
      }
    }
  } catch {
    // Continue
  }

  // Test 7: Android TV Remote v2 (Port 6466 / 6467)
  try {
    const atvOpen = await checkPortOpen(ip, 6467, timeoutMs);
    if (atvOpen) {
      return {
        ip,
        name: `Google TV / Android TV (${ip})`,
        brand: 'tcl',
        model: 'Google TV Remote v2',
        port: 6466,
        protocol: 'androidtv_v2',
        responseTimeMs: Date.now() - startTime,
        source: 'subnet_scan',
      };
    }
  } catch {
    // Continue
  }

  return null;
};

/**
 * Runs a thorough connection diagnostic against any TV IP to find exactly what works.
 */
export const runTVDiagnostic = async (ip: string): Promise<TVDiagnosticResult> => {
  const isNative = Capacitor.isNativePlatform();

  // Test all smart TV ports concurrently
  const [
    dialRes,
    rokuRes,
    samsungRes,
    lgRes,
    tclRes,
    androidTvRemoteRes,
    adbRes,
    sonyRes,
  ] = await Promise.all([
    checkPortOpen(ip, 8008, 1000), // DIAL (Cast / YouTube / Netflix)
    checkPortOpen(ip, 8060, 1000), // Roku ECP
    checkPortOpen(ip, 8001, 1000), // Samsung Tizen
    checkPortOpen(ip, 3000, 1000), // LG webOS
    checkPortOpen(ip, 4123, 1000), // TCL T-Cast
    checkPortOpen(ip, 6467, 1000), // Android TV Remote Pairing
    checkPortOpen(ip, 5555, 1000), // ADB
    checkPortOpen(ip, 80, 1000),   // Sony
  ]);

  let recommendedProtocol: ConnectionProtocol = 'auto';
  let recommendedPort = 4123;
  let detectedBrand: TVBrand = 'tcl';
  let details = '';

  if (rokuRes) {
    recommendedProtocol = 'tcl_roku_ecp';
    recommendedPort = 8060;
    detectedBrand = 'tcl';
    details = 'Roku OS detected on port 8060! Direct HTTP keypress works with zero pairing.';
  } else if (tclRes) {
    recommendedProtocol = 'tcl_tcast';
    recommendedPort = 4123;
    detectedBrand = 'tcl';
    details = 'TCL TV+ / MagiConnect server detected on port 4123! Instant remote key control.';
  } else if (samsungRes) {
    recommendedProtocol = 'samsung_tizen';
    recommendedPort = 8001;
    detectedBrand = 'samsung';
    details = 'Samsung Tizen WebSocket detected on port 8001! Pair by allowing connection on TV screen.';
  } else if (lgRes) {
    recommendedProtocol = 'lg_webos';
    recommendedPort = 3000;
    detectedBrand = 'lg';
    details = 'LG webOS WebSocket detected on port 3000! Pair by allowing prompt on TV.';
  } else if (sonyRes) {
    recommendedProtocol = 'sony_rest';
    recommendedPort = 80;
    detectedBrand = 'sony';
    details = 'Sony Bravia Simple IP Control detected on port 80.';
  } else if (androidTvRemoteRes) {
    recommendedProtocol = 'androidtv_v2';
    recommendedPort = 6466;
    detectedBrand = 'generic';
    details = 'Google TV / Android TV Remote v2 detected on port 6466/6467.';
  } else if (dialRes) {
    recommendedProtocol = 'auto';
    recommendedPort = 8008;
    detectedBrand = 'generic';
    details = 'Android TV / Google TV DIAL service active on port 8008. Channels, apps, and media controls ready.';
  } else {
    recommendedProtocol = 'auto';
    recommendedPort = 8008;
    detectedBrand = 'generic';
    details = 'IP reachable over Wi-Fi. Multi-protocol auto-fallback will send signals through available paths.';
  }

  return {
    ip,
    dialOpen: dialRes,
    rokuOpen: rokuRes,
    samsungOpen: samsungRes,
    lgOpen: lgRes,
    tclOpen: tclRes,
    androidTvRemoteOpen: androidTvRemoteRes,
    adbOpen: adbRes,
    sonyOpen: sonyRes,
    detectedBrand,
    recommendedProtocol,
    recommendedPort,
    details,
  };
};

/**
 * Scans a range of IPs concurrently on the local subnet.
 * High-performance batching scans 16 IPs at a time.
 */
export const scanSubnetForTVs = async (
  subnetBase: string = '192.168.1.',
  startRange: number = 1,
  endRange: number = 254,
  onProgress?: (progress: ScanProgress) => void,
  onDeviceFound?: (device: DiscoveredTV) => void,
  isAborted?: () => boolean
): Promise<DiscoveredTV[]> => {
  const foundDevices: DiscoveredTV[] = [];
  const cleanBase = subnetBase.endsWith('.') ? subnetBase : `${subnetBase}.`;
  const total = Math.max(1, endRange - startRange + 1);

  const bridge = getNativeBridge();

  // PATH 1: Ultra-fast native Android multi-threaded scanner (Runs in Java thread pool)
  if (bridge?.scanSubnetFast) {
    const chunkSize = 50;
    let scanned = 0;

    for (let curStart = startRange; curStart <= endRange; curStart += chunkSize) {
      if (isAborted?.()) break;
      const curEnd = Math.min(curStart + chunkSize - 1, endRange);
      onProgress?.({
        currentIp: `${cleanBase}${curStart}`,
        scannedCount: scanned,
        totalCount: total,
        isScanning: true,
        statusText: `Scanning ${cleanBase}${curStart}-${curEnd}...`,
      });

      try {
        const rawJson = bridge.scanSubnetFast(cleanBase, curStart, curEnd, 180);
        const parsed = JSON.parse(rawJson || '[]');

        if (Array.isArray(parsed) && parsed.length > 0) {
          for (const item of parsed) {
            const ip = item.ip;
            const openPort = item.openPort;

            // Deep probe only this confirmed live TV device
            const detailed = await probeTVDevice(ip, 600);
            const device: DiscoveredTV = detailed || {
              ip,
              name: `Smart TV (${ip})`,
              brand: openPort === 4123 ? 'tcl' : openPort === 8060 ? 'tcl' : openPort === 8001 ? 'samsung' : openPort === 3000 ? 'lg' : openPort === 80 ? 'sony' : 'generic',
              port: openPort,
              protocol: openPort === 4123 ? 'tcl_tcast' : openPort === 8060 ? 'tcl_roku_ecp' : openPort === 8001 ? 'samsung_tizen' : openPort === 3000 ? 'lg_webos' : openPort === 80 ? 'sony_rest' : 'auto',
              responseTimeMs: 30,
              source: 'subnet_scan',
              openPorts: [openPort],
            };

            if (!foundDevices.some((d) => d.ip === device.ip)) {
              foundDevices.push(device);
              onDeviceFound?.(device);
            }
          }
        }
      } catch (err) {
        console.warn('Native fast scan chunk error:', err);
      }

      scanned += (curEnd - curStart + 1);
      onProgress?.({
        currentIp: `${cleanBase}${curEnd}`,
        scannedCount: scanned,
        totalCount: total,
        isScanning: true,
        statusText: `Checked ${scanned} of ${total} addresses (${foundDevices.length} TV found)...`,
      });
    }

    onProgress?.({
      currentIp: '',
      scannedCount: total,
      totalCount: total,
      isScanning: false,
      statusText: `Scan complete! Discovered ${foundDevices.length} TV(s).`,
    });

    return foundDevices;
  }

  // PATH 2: Web / Browser Fallback with fast pre-filtering (non-blocking)
  let scanned = 0;
  const batchSize = 10;
  const ipList: string[] = [];
  for (let i = startRange; i <= endRange; i++) {
    ipList.push(`${cleanBase}${i}`);
  }

  for (let i = 0; i < ipList.length; i += batchSize) {
    if (isAborted?.()) break;
    const batch = ipList.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (ip) => {
        onProgress?.({
          currentIp: ip,
          scannedCount: scanned,
          totalCount: total,
          isScanning: true,
          statusText: `Scanning ${ip}...`,
        });

        // Quick pre-check on port 8008 or 8060 before full probe
        const hasOpenPort = await checkPortOpen(ip, 8008, 300) || await checkPortOpen(ip, 8060, 300);
        if (hasOpenPort) {
          const detected = await probeTVDevice(ip, 500);
          if (detected && !foundDevices.some((d) => d.ip === detected.ip)) {
            foundDevices.push(detected);
            onDeviceFound?.(detected);
          }
        }
        scanned++;
      })
    );

    onProgress?.({
      currentIp: batch[batch.length - 1] || '',
      scannedCount: scanned,
      totalCount: total,
      isScanning: true,
      statusText: `Checked ${scanned} of ${total} addresses...`,
    });
  }

  onProgress?.({
    currentIp: '',
    scannedCount: total,
    totalCount: total,
    isScanning: false,
    statusText: `Scan complete. Found ${foundDevices.length} TV(s).`,
  });

  return foundDevices;
};

/**
 * Converts a DiscoveredTV into a persistent TVDevice with brand-tailored apps.
 */
export const convertDiscoveredToTVDevice = (tv: DiscoveredTV): TVDevice => {
  return {
    id: `tv-${tv.brand}-${Date.now()}`,
    name: tv.name,
    brand: tv.brand,
    model: tv.model || `${tv.brand.toUpperCase()} Smart TV`,
    ipAddress: tv.ip,
    port: tv.port,
    protocol: tv.protocol,
    location: 'Discovered TV',
    isDefault: false,
    lastConnected: new Date().toISOString(),
    installedApps: getDefaultAppsForBrand(tv.brand),
    quickShortcuts: getDefaultShortcutsForBrand(tv.brand),
  };
};
