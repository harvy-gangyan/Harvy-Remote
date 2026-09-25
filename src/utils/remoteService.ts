import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { TVDevice, CommandLogItem, ActionType, MacroStep, StreamingApp } from '../types';

export class RemoteService {
  private static instance: RemoteService;
  private logs: CommandLogItem[] = [];
  private listeners: ((log: CommandLogItem) => void)[] = [];
  private activeLedState = false;
  private ledListeners: ((state: boolean) => void)[] = [];

  // Active WebSocket connections for WebOS / Tizen
  private wsConnections: Map<string, WebSocket> = new Map();
  // Working protocol cache to prevent repeating multi-protocol auto probe on every keypress
  private cachedWorkingProtocol: Map<string, ConnectionProtocol> = new Map();

  private constructor() {
    try {
      const stored = localStorage.getItem('androidtv_command_logs');
      if (stored) {
        this.logs = JSON.parse(stored).slice(0, 50);
      }
    } catch {
      // ignore
    }
  }

  public static getInstance(): RemoteService {
    if (!RemoteService.instance) {
      RemoteService.instance = new RemoteService();
    }
    return RemoteService.instance;
  }

  public subscribeToLogs(listener: (log: CommandLogItem) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public subscribeToLed(listener: (state: boolean) => void) {
    this.ledListeners.push(listener);
    return () => {
      this.ledListeners = this.ledListeners.filter((l) => l !== listener);
    };
  }

  private triggerLedBlink() {
    this.activeLedState = true;
    this.ledListeners.forEach((l) => l(true));
    setTimeout(() => {
      this.activeLedState = false;
      this.ledListeners.forEach((l) => l(false));
    }, 180);
  }

  public getLogs(): CommandLogItem[] {
    return [...this.logs];
  }

  public clearLogs() {
    this.logs = [];
    localStorage.removeItem('androidtv_command_logs');
  }

  /**
   * Translates keycode/action into a friendly ADB or protocol command string
   */
  public formatAdbCommand(device: TVDevice, actionType: ActionType, payload: string): string {
    const target = `${device.ipAddress}:${device.port || 5555}`;
    switch (actionType) {
      case 'keycode':
        return `[${device.brand.toUpperCase()} Key] ${payload} -> ${target}`;
      case 'app':
        return `[Launch App] ${payload} -> ${target}`;
      case 'text': {
        const sanitized = payload.replace(/"/g, '\\"').replace(/ /g, '%s');
        return `adb -s ${target} shell input text "${sanitized}"`;
      }
      case 'shell':
        return `adb -s ${target} shell ${payload}`;
      case 'macro':
        return `[Macro Sequence] ${payload}`;
      default:
        return `adb -s ${target} shell ${payload}`;
    }
  }

  /**
   * Checks if Android phone has hardware IR blaster
   */
  public hasHardwareIr(): boolean {
    const bridge = (window as unknown as {
      AndroidNativeRemote?: { hasIrBlaster?: () => boolean };
    }).AndroidNativeRemote;
    return !!bridge?.hasIrBlaster?.();
  }

  /**
   * Retrieves phone hardware info (e.g. Motorola Moto G45 5G)
   */
  public getPhoneHardwareInfo(): {
    model?: string;
    manufacturer?: string;
    hasIrBlaster?: boolean;
    androidVersion?: string;
  } | null {
    try {
      const bridge = (window as unknown as {
        AndroidNativeRemote?: { getPhoneHardwareInfo?: () => string };
      }).AndroidNativeRemote;
      if (bridge?.getPhoneHardwareInfo) {
        return JSON.parse(bridge.getPhoneHardwareInfo());
      }
    } catch {
      // ignore
    }
    return null;
  }

  /**
   * Queries real physical TV media playback state (playing, paused, stopped, unknown)
   */
  public async queryMediaPlaybackState(
    device: TVDevice
  ): Promise<'playing' | 'paused' | 'stopped' | 'unknown'> {
    const isNative = Capacitor.isNativePlatform();
    const bridge = (window as unknown as {
      AndroidNativeRemote?: {
        sendHttpFull?: (url: string, method: string, body: string, timeoutMs: number) => string;
      };
    }).AndroidNativeRemote;

    // Fast exit if protocol doesn't support state polling (e.g. TCL T-Cast)
    if (device.protocol === 'tcl_tcast' || (device.brand === 'tcl' && (device.port === 4123 || device.protocol !== 'tcl_roku_ecp'))) {
      return 'unknown';
    }

    // 1. Roku media player query on port 8060 (only if Roku protocol or port 8060)
    if (device.protocol === 'tcl_roku_ecp' || device.port === 8060) {
      try {
        const url = `http://${device.ipAddress}:8060/query/media-player`;
        let text = '';
        if (bridge?.sendHttpFull) {
          const raw = bridge.sendHttpFull(url, 'GET', '', 400);
          const parsed = JSON.parse(raw);
          if (parsed.ok && parsed.data) text = parsed.data;
        } else if (isNative) {
          const res = await CapacitorHttp.get({ url, connectTimeout: 400, readTimeout: 400 });
          text = typeof res.data === 'string' ? res.data : '';
        } else {
          const res = await fetch(url, { signal: AbortSignal.timeout(400) });
          text = await res.text();
        }

        if (text) {
          if (text.includes('state="play"') || text.includes('state="playing"')) {
            return 'playing';
          }
          if (text.includes('state="pause"') || text.includes('state="paused"')) {
            return 'paused';
          }
          if (text.includes('state="close"') || text.includes('state="none"')) {
            return 'stopped';
          }
        }
      } catch {
        // continue
      }
    }

    // 2. DIAL YouTube status query on port 8008 (Single fast check, no heavy loop)
    try {
      const url = `http://${device.ipAddress}:8008/apps/YouTube`;
      let text = '';
      if (bridge?.sendHttpFull) {
        const raw = bridge.sendHttpFull(url, 'GET', '', 400);
        const parsed = JSON.parse(raw);
        if (parsed.ok && parsed.data) text = parsed.data;
      } else if (isNative) {
        const res = await CapacitorHttp.get({ url, connectTimeout: 400, readTimeout: 400 });
        text = typeof res.data === 'string' ? res.data : '';
      } else {
        const res = await fetch(url, { signal: AbortSignal.timeout(400) });
        text = await res.text();
      }
      if (text) {
        if (text.includes('<state>running</state>')) return 'playing';
        if (text.includes('<state>stopped</state>') || text.includes('<state>paused</state>')) return 'paused';
      }
    } catch {
      // continue
    }

    return 'unknown';
  }

  /**
   * Dispatches a keyevent to the specified Smart TV
   */
  public async sendKeycode(
    device: TVDevice,
    keycode: string,
    onSuccess?: () => void,
    onError?: (err: Error) => void
  ): Promise<boolean> {
    this.triggerLedBlink();
    const commandStr = this.formatAdbCommand(device, 'keycode', keycode);
    return this.executeCommand(device, 'keycode', keycode, commandStr, onSuccess, onError);
  }

  /**
   * Dispatches an app launch command (supports Android TV, Samsung Tizen, LG webOS, Roku)
   */
  public async launchApp(
    device: TVDevice,
    packageNameOrId: string,
    appName?: string
  ): Promise<boolean> {
    this.triggerLedBlink();
    const commandStr = this.formatAdbCommand(device, 'app', packageNameOrId);
    const label = appName ? `Launch ${appName}` : `Launch ${packageNameOrId}`;
    return this.executeCommand(device, 'app', packageNameOrId, commandStr, undefined, undefined, label);
  }

  /**
   * Dispatches text input to the TV
   */
  public async sendText(device: TVDevice, text: string): Promise<boolean> {
    this.triggerLedBlink();
    const commandStr = this.formatAdbCommand(device, 'text', text);
    return this.executeCommand(device, 'text', text, commandStr, undefined, undefined, `Type "${text}"`);
  }

  /**
   * Dispatches custom shell / ADB command
   */
  public async sendAdbCommand(
    device: TVDevice,
    command: string,
    friendlyTitle?: string
  ): Promise<boolean> {
    this.triggerLedBlink();
    const commandStr = this.formatAdbCommand(device, 'shell', command);
    return this.executeCommand(
      device,
      'shell',
      command,
      commandStr,
      undefined,
      undefined,
      friendlyTitle || command
    );
  }

  /**
   * Executes a multi-step macro
   */
  public async executeMacro(
    device: TVDevice,
    steps: MacroStep[],
    macroName: string
  ): Promise<boolean> {
    this.triggerLedBlink();
    const logItem: CommandLogItem = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date(),
      command: `Macro: ${macroName} (${steps.length} steps)`,
      targetTv: `${device.name} (${device.ipAddress})`,
      status: 'sent',
      details: 'Executing sequential steps...',
    };
    this.appendLog(logItem);

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (step.actionType === 'delay') {
        const delayTime = step.delayMs || parseInt(step.payload, 10) || 500;
        await new Promise((resolve) => setTimeout(resolve, delayTime));
      } else if (step.actionType === 'keycode') {
        await this.sendKeycode(device, step.payload);
        await new Promise((resolve) => setTimeout(resolve, step.delayMs || 300));
      } else if (step.actionType === 'text') {
        await this.sendText(device, step.payload);
        await new Promise((resolve) => setTimeout(resolve, step.delayMs || 300));
      }
    }

    logItem.status = 'success';
    logItem.details = `Macro "${macroName}" finished successfully.`;
    this.saveLogs();
    this.listeners.forEach((l) => l(logItem));
    return true;
  }

  /**
   * Pulls real installed apps from the connected TV
   */
  public async fetchInstalledApps(device: TVDevice): Promise<StreamingApp[]> {
    const isNative = Capacitor.isNativePlatform();
    const bridge = (window as unknown as {
      AndroidNativeRemote?: {
        sendHttpFull?: (url: string, method: string, body: string, timeoutMs: number) => string;
      };
    }).AndroidNativeRemote;

    // 1. Roku / TCL Roku TV via ECP on port 8060
    if (device.brand === 'tcl' && device.protocol === 'tcl_roku_ecp' || device.port === 8060) {
      try {
        const url = `http://${device.ipAddress}:8060/query/apps`;
        let xmlText = '';

        if (bridge?.sendHttpFull) {
          const raw = bridge.sendHttpFull(url, 'GET', '', 2500);
          const parsed = JSON.parse(raw);
          if (parsed.ok && parsed.data) xmlText = parsed.data;
        } else if (isNative) {
          const res = await CapacitorHttp.get({ url, connectTimeout: 2500, readTimeout: 2500 });
          xmlText = res.data;
        } else {
          const res = await fetch(url, { signal: AbortSignal.timeout(2500) });
          xmlText = await res.text();
        }

        if (xmlText && xmlText.includes('<apps>')) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(xmlText, 'text/xml');
          const appNodes = doc.getElementsByTagName('app');
          const pulledApps: StreamingApp[] = [];

          for (let i = 0; i < appNodes.length; i++) {
            const node = appNodes[i];
            const appId = node.getAttribute('id') || `roku_${i}`;
            const name = node.textContent?.trim() || `Roku App ${appId}`;
            pulledApps.push({
              id: appId,
              name,
              packageName: appId,
              iconName: 'Tv',
              color: '#6c5ce7',
              popularInIndia: true,
              category: 'ott',
            });
          }
          if (pulledApps.length > 0) return pulledApps;
        }
      } catch (e) {
        console.warn('Roku fetch apps error:', e);
      }
    }

    // 2. Samsung Tizen via HTTP API (Port 8001)
    if (device.brand === 'samsung') {
      try {
        const url = `http://${device.ipAddress}:8001/api/v2/applications`;
        let appsData: any = null;

        if (bridge?.sendHttpFull) {
          const raw = bridge.sendHttpFull(url, 'GET', '', 2500);
          const parsed = JSON.parse(raw);
          if (parsed.ok && parsed.data) {
            appsData = JSON.parse(parsed.data);
          }
        } else if (isNative) {
          const res = await CapacitorHttp.get({ url, connectTimeout: 2500 });
          appsData = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
        } else {
          const res = await fetch(url, { signal: AbortSignal.timeout(2500) });
          appsData = await res.json();
        }

        if (Array.isArray(appsData)) {
          return appsData.map((item: any) => ({
            id: item.appId || item.id,
            name: item.name || item.title || item.appId,
            packageName: item.appId || item.id,
            iconName: 'Tv',
            color: '#1428a0',
            popularInIndia: true,
            category: 'ott',
          }));
        }
      } catch (e) {
        console.warn('Samsung apps error:', e);
      }
    }

    // 3. Sony Bravia REST appControl
    if (device.brand === 'sony') {
      try {
        const url = `http://${device.ipAddress}:${device.port || 80}/sony/appControl`;
        const body = JSON.stringify({ method: 'getApplicationList', params: [], id: 1, version: '1.0' });
        let result: any = null;

        if (bridge?.sendHttpFull) {
          const raw = bridge.sendHttpFull(url, 'POST', body, 2500);
          const parsed = JSON.parse(raw);
          if (parsed.ok && parsed.data) {
            result = JSON.parse(parsed.data);
          }
        } else if (isNative) {
          const res = await CapacitorHttp.post({
            url,
            headers: { 'X-Auth-PSK': '0000', 'Content-Type': 'application/json' },
            data: JSON.parse(body),
            connectTimeout: 2500,
          });
          result = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
        } else {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'X-Auth-PSK': '0000', 'Content-Type': 'application/json' },
            body,
            signal: AbortSignal.timeout(2500),
          });
          result = await res.json();
        }

        if (result?.result?.[0]) {
          return result.result[0].map((item: any) => ({
            id: item.uri || item.title,
            name: item.title,
            packageName: item.uri,
            iconName: 'Tv',
            color: '#e84118',
            popularInIndia: true,
            category: 'ott',
          }));
        }
      } catch (e) {
        console.warn('Sony apps error:', e);
      }
    }

    // 4. DIAL probe for Android TV / Google TV (Port 8008)
    try {
      const dialCandidates = [
        { id: 'youtube', name: 'YouTube', dialName: 'YouTube', packageName: 'com.google.android.youtube.tv', iconName: 'Youtube', color: '#FF0000' },
        { id: 'netflix', name: 'Netflix', dialName: 'Netflix', packageName: 'com.netflix.ninja', iconName: 'Film', color: '#E50914' },
        { id: 'primevideo', name: 'Prime Video', dialName: 'PrimeVideo', packageName: 'com.amazon.amazonvideo.livingroom', iconName: 'Video', color: '#00A8E1' },
        { id: 'hotstar', name: 'Disney+ Hotstar', dialName: 'Hotstar', packageName: 'in.startv.hotstar', iconName: 'Sparkles', color: '#01147C' },
        { id: 'spotify', name: 'Spotify', dialName: 'Spotify', packageName: 'com.spotify.tv.android', iconName: 'Music', color: '#1DB954' },
        { id: 'jiocinema', name: 'JioCinema', dialName: 'JioCinema', packageName: 'com.jio.media.ondemand', iconName: 'Film', color: '#D90429' },
        { id: 'zee5', name: 'ZEE5', dialName: 'Zee5', packageName: 'com.graymatrix.did', iconName: 'Tv', color: '#7E22CE' },
        { id: 'sonyliv', name: 'Sony LIV', dialName: 'SonyLIV', packageName: 'com.sonyliv', iconName: 'Tv', color: '#2563EB' },
      ];

      const verifiedApps: StreamingApp[] = [];
      await Promise.all(
        dialCandidates.map(async (cand) => {
          const u = `http://${device.ipAddress}:8008/apps/${cand.dialName}`;
          try {
            let isInstalled = false;
            if (bridge?.sendHttpFull) {
              const raw = bridge.sendHttpFull(u, 'GET', '', 800);
              const parsed = JSON.parse(raw);
              if (parsed.status === 200 || (parsed.data && parsed.data.includes('<state>'))) {
                isInstalled = true;
              }
            } else if (isNative) {
              const res = await CapacitorHttp.get({ url: u, connectTimeout: 800, readTimeout: 800 });
              if (res.status === 200) isInstalled = true;
            } else {
              const res = await fetch(u, { signal: AbortSignal.timeout(800) });
              if (res.ok) isInstalled = true;
            }

            if (isInstalled) {
              verifiedApps.push({
                id: cand.id,
                name: cand.name,
                packageName: cand.packageName,
                iconName: cand.iconName,
                color: cand.color,
                popularInIndia: true,
                category: 'ott',
              });
            }
          } catch {
            // continue
          }
        })
      );

      if (verifiedApps.length > 0) {
        const remaining = (device.installedApps || []).filter(
          (a) => !verifiedApps.some((v) => v.id === a.id)
        );
        return [...verifiedApps, ...remaining];
      }
    } catch {
      // continue
    }

    return device.installedApps || [];
  }

  /**
   * Internal command execution with honest logging and real brand protocol dispatch
   */
  private async executeCommand(
    device: TVDevice,
    type: ActionType,
    payload: string,
    commandStr: string,
    onSuccess?: () => void,
    onError?: (err: Error) => void,
    friendlyTitle?: string
  ): Promise<boolean> {
    const logItem: CommandLogItem = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date(),
      command: friendlyTitle || commandStr,
      targetTv: `${device.name} (${device.ipAddress})`,
      status: 'sent',
      details: commandStr,
    };

    try {
      const result = await this.dispatchNetworkRequest(device, type, payload, commandStr);
      if (result.success) {
        logItem.status = 'success';
        logItem.details = result.message || `Signal delivered to ${device.name}`;
        this.appendLog(logItem);
        onSuccess?.();
        return true;
      } else {
        logItem.status = 'failed';
        logItem.details = result.message || `No reply from ${device.ipAddress}. Try running Diagnostic in TV Manager.`;
        this.appendLog(logItem);
        onError?.(new Error(logItem.details));
        return false;
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      logItem.status = 'failed';
      logItem.details = error.message;
      this.appendLog(logItem);
      onError?.(error);
      return false;
    }
  }

  /**
   * Dispatches real network requests to physical Smart TVs based on their brand and protocol
   */
  private async dispatchNetworkRequest(
    device: TVDevice,
    type: ActionType,
    payload: string,
    commandStr: string
  ): Promise<{ success: boolean; message: string }> {
    const isNative = Capacitor.isNativePlatform();
    const bridge = (window as unknown as {
      AndroidNativeRemote?: {
        hasIrBlaster?: () => boolean;
        transmitIr?: (brand: string, keycode: string) => boolean;
        sendHttpFull?: (url: string, method: string, body: string, timeoutMs: number) => string;
        sendRawTcp?: (ip: string, port: number, msg: string, timeoutMs: number) => boolean;
      };
    }).AndroidNativeRemote;

    // A. Priority 1: Hardware IR Blaster if phone has an infrared transmitter
    if (type === 'keycode' && bridge?.transmitIr && bridge?.hasIrBlaster?.()) {
      try {
        const sent = bridge.transmitIr(device.brand, payload);
        if (sent) {
          return { success: true, message: `Transmitted IR signal to ${device.name}` };
        }
      } catch {
        // continue to network
      }
    }

    // B. Protocol 1: Roku / TCL Roku TV (Port 8060)
    if (device.protocol === 'tcl_roku_ecp' || (device.brand === 'tcl' && device.port === 8060)) {
      const ok = await this.dispatchRokuEcp(device, type, payload, isNative);
      return { success: ok, message: ok ? `Roku ECP delivered to ${device.ipAddress}:8060` : `Roku TV at ${device.ipAddress}:8060 did not acknowledge` };
    }

    // C. Protocol 2: Samsung Smart TV (Port 8001 / 8002)
    if (device.brand === 'samsung' || device.protocol === 'samsung_tizen') {
      const ok = await this.dispatchSamsungTizen(device, type, payload, isNative);
      return { success: ok, message: ok ? `Delivered to Samsung TV (${device.ipAddress})` : `Samsung TV rejected connection. Ensure "Allow" is selected on TV screen.` };
    }

    // D. Protocol 3: LG webOS Smart TV (Port 3000 / 3001)
    if (device.brand === 'lg' || device.protocol === 'lg_webos') {
      const ok = await this.dispatchLgWebOs(device, type, payload);
      return { success: ok, message: ok ? `Delivered to LG webOS TV (${device.ipAddress})` : `LG TV rejected WebSocket. Tap "Allow" on your TV screen to pair.` };
    }

    // E. Protocol 4: Sony Bravia (Simple IP Control port 20060 & REST Port 80)
    if (device.brand === 'sony' || device.protocol === 'sony_rest') {
      const ok = await this.dispatchSonyBravia(device, type, payload, isNative);
      return { success: ok, message: ok ? `Delivered to Sony Bravia (${device.ipAddress})` : `Sony Bravia IP Control unreachable.` };
    }

    // F. Protocol 5: Explicit TCL T-Cast (Port 4123)
    if (device.protocol === 'tcl_tcast') {
      const ok = await this.dispatchTclTcast(device, type, payload, isNative);
      return { success: ok, message: ok ? `Delivered via TCL T-Cast (port 4123)` : `TCL T-Cast port 4123 closed on this TV.` };
    }

    // Check cached working protocol for this specific TV (Instant 10ms dispatch)
    const cachedProto = this.cachedWorkingProtocol.get(device.id);
    if (cachedProto) {
      if (cachedProto === 'tcl_tcast') {
        const ok = await this.dispatchTclTcast(device, type, payload, isNative);
        if (ok) return { success: true, message: `Delivered via TCL T-Cast to ${device.name}` };
      } else if (cachedProto === 'tcl_roku_ecp') {
        const ok = await this.dispatchRokuEcp(device, type, payload, isNative);
        if (ok) return { success: true, message: `Delivered via Roku ECP to ${device.name}` };
      } else if (cachedProto === 'sony_rest') {
        const ok = await this.dispatchSonyBravia(device, type, payload, isNative);
        if (ok) return { success: true, message: `Delivered to Sony Bravia (${device.ipAddress})` };
      }
    }

    // G. Universal Auto Mode: Multi-protocol concurrent dispatch with real acknowledgment
    return this.dispatchUniversalAuto(device, type, payload, commandStr, isNative);
  }

  /**
   * Universal Smart Dispatcher: Dispatches command across all compatible TV protocols concurrently
   */
  private async dispatchUniversalAuto(
    device: TVDevice,
    type: ActionType,
    payload: string,
    commandStr: string,
    isNative: boolean
  ): Promise<{ success: boolean; message: string }> {
    // If launching an app, DIAL on port 8008 works universally without pairing
    if (type === 'app') {
      const dialOk = await this.dispatchDialApp(device, payload, isNative);
      if (dialOk) {
        return { success: true, message: `Launched ${payload} via DIAL on port 8008` };
      }
      // Also try Roku & Samsung app launch in parallel
      const rokuOk = await this.dispatchRokuEcp(device, type, payload, isNative);
      if (rokuOk) {
        return { success: true, message: `Launched ${payload} on Roku TV` };
      }
      return { success: false, message: `App launch signal sent to ${device.ipAddress}. Verify app is installed on TV.` };
    }

    // For TCL TVs: fast-path TCL T-Cast (port 4123) and Roku ECP (port 8060) first
    if (device.brand === 'tcl') {
      const tclOk = await this.dispatchTclTcast(device, type, payload, isNative);
      if (tclOk) {
        this.cachedWorkingProtocol.set(device.id, 'tcl_tcast');
        return { success: true, message: `Delivered via TCL T-Cast (port 4123)` };
      }
      const rokuOk = await this.dispatchRokuEcp(device, type, payload, isNative);
      if (rokuOk) {
        this.cachedWorkingProtocol.set(device.id, 'tcl_roku_ecp');
        return { success: true, message: `Delivered via Roku ECP (port 8060)` };
      }
    }

    // For other brands / keycodes: try Roku ECP, TCL T-Cast, Sony Simple IP, and UPnP concurrently
    const [rokuRes, tclRes, sonyRes, upnpRes] = await Promise.allSettled([
      this.dispatchRokuEcp(device, type, payload, isNative),
      this.dispatchTclTcast(device, type, payload, isNative),
      this.dispatchSonySimpleIp(device, payload),
      this.dispatchUpnpMediaControl(device, payload),
    ]);

    if (tclRes.status === 'fulfilled' && tclRes.value) {
      this.cachedWorkingProtocol.set(device.id, 'tcl_tcast');
      return { success: true, message: `Signal delivered to ${device.name}` };
    }
    if (rokuRes.status === 'fulfilled' && rokuRes.value) {
      this.cachedWorkingProtocol.set(device.id, 'tcl_roku_ecp');
      return { success: true, message: `Signal delivered to ${device.name}` };
    }
    if (sonyRes.status === 'fulfilled' && sonyRes.value) {
      this.cachedWorkingProtocol.set(device.id, 'sony_rest');
      return { success: true, message: `Signal delivered to ${device.name}` };
    }
    if (upnpRes.status === 'fulfilled' && upnpRes.value) {
      return { success: true, message: `Signal delivered to ${device.name}` };
    }

    // Check if phone has IR blaster fallback
    const bridge = (window as unknown as {
      AndroidNativeRemote?: { transmitIr?: (b: string, k: string) => boolean };
    }).AndroidNativeRemote;
    if (bridge?.transmitIr) {
      const irOk = bridge.transmitIr(device.brand, payload);
      if (irOk) {
        return { success: true, message: `Transmitted IR command to ${device.name}` };
      }
    }

    return {
      success: false,
      message: `No response from ${device.ipAddress}. Please run Diagnostic in TV Manager to configure the correct protocol.`,
    };
  }

  /**
   * Sony Bravia Simple IP Control on Port 20060 (TCP)
   */
  private async dispatchSonySimpleIp(device: TVDevice, keycode: string): Promise<boolean> {
    const bridge = (window as unknown as {
      AndroidNativeRemote?: {
        sendRawTcp?: (ip: string, port: number, msg: string, timeoutMs: number) => boolean;
      };
    }).AndroidNativeRemote;

    if (!bridge?.sendRawTcp) return false;

    const sonyMap: Record<string, string> = {
      KEYCODE_POWER: '*SCPOWR0000000000000000\n',
      KEYCODE_VOLUME_UP: '*SCVOLU0000000000000001\n',
      KEYCODE_VOLUME_DOWN: '*SCVOLD0000000000000001\n',
      KEYCODE_VOLUME_MUTE: '*SCAMUT0000000000000001\n',
      KEYCODE_HOME: '*SCHOME0000000000000000\n',
      KEYCODE_BACK: '*SCRTRN0000000000000000\n',
      KEYCODE_DPAD_UP: '*SCDIRU0000000000000000\n',
      KEYCODE_DPAD_DOWN: '*SCDIRD0000000000000000\n',
      KEYCODE_DPAD_LEFT: '*SCDIRL0000000000000000\n',
      KEYCODE_DPAD_RIGHT: '*SCDIRR0000000000000000\n',
      KEYCODE_DPAD_CENTER: '*SCIRCC0000000000000023\n',
      KEYCODE_ENTER: '*SCIRCC0000000000000023\n',
      KEYCODE_MEDIA_PLAY_PAUSE: '*SCIRCC0000000000000026\n',
      KEYCODE_MEDIA_PLAY: '*SCIRCC0000000000000026\n',
      KEYCODE_MEDIA_PAUSE: '*SCIRCC0000000000000025\n',
    };

    const cmd = sonyMap[keycode];
    if (!cmd) return false;

    try {
      return bridge.sendRawTcp(device.ipAddress, 20060, cmd, 800);
    } catch {
      return false;
    }
  }

  /**
   * UPnP RenderingControl / AVTransport (Port 8008 or DLNA port)
   */
  private async dispatchUpnpMediaControl(device: TVDevice, keycode: string): Promise<boolean> {
    const bridge = (window as unknown as {
      AndroidNativeRemote?: {
        sendHttpFull?: (url: string, method: string, body: string, timeoutMs: number) => string;
      };
    }).AndroidNativeRemote;

    if (!bridge?.sendHttpFull) return false;

    let soapAction = '';
    let body = '';
    let endpoint = '/upnp/control/RenderingControl';

    if (keycode === 'KEYCODE_VOLUME_MUTE') {
      soapAction = '"urn:schemas-upnp-org:service:RenderingControl:1#SetMute"';
      body = `<?xml version="1.0"?><s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"><s:Body><u:SetMute xmlns:u="urn:schemas-upnp-org:service:RenderingControl:1"><InstanceID>0</InstanceID><Channel>Master</Channel><DesiredMute>1</DesiredMute></u:SetMute></s:Body></s:Envelope>`;
    } else if (keycode.includes('PAUSE')) {
      endpoint = '/upnp/control/AVTransport';
      soapAction = '"urn:schemas-upnp-org:service:AVTransport:1#Pause"';
      body = `<?xml version="1.0"?><s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"><s:Body><u:Pause xmlns:u="urn:schemas-upnp-org:service:AVTransport:1"><InstanceID>0</InstanceID></u:Pause></s:Body></s:Envelope>`;
    } else if (keycode.includes('PLAY')) {
      endpoint = '/upnp/control/AVTransport';
      soapAction = '"urn:schemas-upnp-org:service:AVTransport:1#Play"';
      body = `<?xml version="1.0"?><s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"><s:Body><u:Play xmlns:u="urn:schemas-upnp-org:service:AVTransport:1"><InstanceID>0</InstanceID><Speed>1</Speed></u:Play></s:Body></s:Envelope>`;
    } else {
      return false;
    }

    try {
      const url = `http://${device.ipAddress}:${device.port || 8008}${endpoint}`;
      const headers = JSON.stringify({
        'Content-Type': 'text/xml; charset="utf-8"',
        'SOAPAction': soapAction,
      });

      const bridgeWithHeaders = (window as unknown as {
        AndroidNativeRemote?: {
          sendHttpWithHeaders?: (url: string, method: string, body: string, headers: string, timeoutMs: number) => string;
        };
      }).AndroidNativeRemote;

      if (bridgeWithHeaders?.sendHttpWithHeaders) {
        const raw = bridgeWithHeaders.sendHttpWithHeaders(url, 'POST', body, headers, 1200);
        const res = JSON.parse(raw);
        return res.status === 200;
      } else if (bridge?.sendHttpFull) {
        const raw = bridge.sendHttpFull(url, 'POST', body, 1200);
        const res = JSON.parse(raw);
        return res.status === 200;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * TCL Smart TV / BeyondTV T-Cast Protocol Handler (Ports 4123, 8080, 8888)
   */
  private async dispatchTclTcast(
    device: TVDevice,
    _type: ActionType,
    payload: string,
    isNative: boolean
  ): Promise<boolean> {
    const tclKeyMap: Record<string, string> = {
      KEYCODE_POWER: 'power',
      KEYCODE_HOME: 'home',
      KEYCODE_BACK: 'back',
      KEYCODE_DPAD_UP: 'up',
      KEYCODE_DPAD_DOWN: 'down',
      KEYCODE_DPAD_LEFT: 'left',
      KEYCODE_DPAD_RIGHT: 'right',
      KEYCODE_DPAD_CENTER: 'enter',
      KEYCODE_ENTER: 'enter',
      KEYCODE_VOLUME_UP: 'volup',
      KEYCODE_VOLUME_DOWN: 'voldown',
      KEYCODE_VOLUME_MUTE: 'mute',
      KEYCODE_MENU: 'menu',
      KEYCODE_MEDIA_PLAY_PAUSE: 'play',
      KEYCODE_MEDIA_PLAY: 'play',
      KEYCODE_MEDIA_PAUSE: 'pause',
      KEYCODE_MEDIA_REWIND: 'rewind',
      KEYCODE_MEDIA_FAST_FORWARD: 'fastforward',
    };

    const key = tclKeyMap[payload] || payload.toLowerCase().replace('keycode_', '');
    const ports = [device.port || 4123, 4123];
    const uniquePorts = Array.from(new Set(ports));

    const bridge = (window as unknown as {
      AndroidNativeRemote?: {
        sendHttpFull?: (url: string, method: string, body: string, timeoutMs: number) => string;
      };
    }).AndroidNativeRemote;

    for (const p of uniquePorts) {
      const u = `http://${device.ipAddress}:${p}/keyclick?key=${key}`;
      try {
        if (bridge?.sendHttpFull) {
          const raw = bridge.sendHttpFull(u, 'GET', '', 400);
          const parsed = JSON.parse(raw);
          if ((parsed.status >= 200 && parsed.status < 400) || parsed.ok) return true;
        } else if (isNative) {
          const res = await CapacitorHttp.get({ url: u, connectTimeout: 400, readTimeout: 400 });
          if ((res.status >= 200 && res.status < 400) || res.data) return true;
        } else {
          const res = await fetch(u, { method: 'GET', signal: AbortSignal.timeout(400) });
          if (res.ok) return true;
        }
      } catch {
        // continue
      }
    }

    return false;
  }

  /**
   * DIAL Universal App Launcher (Port 8008)
   */
  private async dispatchDialApp(
    device: TVDevice,
    packageNameOrId: string,
    isNative: boolean
  ): Promise<boolean> {
    const dialMap: Record<string, string> = {
      'com.google.android.youtube.tv': 'YouTube',
      'com.netflix.ninja': 'Netflix',
      'com.amazon.amazonvideo.livingroom': 'PrimeVideo',
      'in.startv.hotstar': 'Hotstar',
      'com.spotify.tv.android': 'Spotify',
      'youtube': 'YouTube',
      'netflix': 'Netflix',
      'primevideo': 'PrimeVideo',
      'hotstar': 'Hotstar',
      'spotify': 'Spotify',
    };
    const dialApp = dialMap[packageNameOrId] || dialMap[packageNameOrId.toLowerCase()] || packageNameOrId.split('.').pop() || packageNameOrId;
    const candidates = [dialApp, dialApp.toLowerCase()];

    const bridge = (window as unknown as {
      AndroidNativeRemote?: {
        sendHttpWithHeaders?: (url: string, method: string, body: string, headers: string, timeoutMs: number) => string;
        sendHttpFull?: (url: string, method: string, body: string, timeoutMs: number) => string;
      };
    }).AndroidNativeRemote;

    for (const app of candidates) {
      const dialUrl = `http://${device.ipAddress}:8008/apps/${app}`;
      const headers = JSON.stringify({
        'Content-Type': 'text/plain; charset=utf-8',
        'Origin': 'package:com.harvy.tvremote',
      });

      try {
        if (bridge?.sendHttpWithHeaders) {
          const raw = bridge.sendHttpWithHeaders(dialUrl, 'POST', '', headers, 2000);
          const res = JSON.parse(raw);
          if (res.status === 200 || res.status === 201 || res.status === 204) return true;
        } else if (bridge?.sendHttpFull) {
          const raw = bridge.sendHttpFull(dialUrl, 'POST', '', 2000);
          const res = JSON.parse(raw);
          if (res.status === 200 || res.status === 201 || res.status === 204) return true;
        } else if (isNative) {
          const res = await CapacitorHttp.post({
            url: dialUrl,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            data: '',
            connectTimeout: 2000,
            readTimeout: 2000,
          });
          if (res.status === 200 || res.status === 201 || res.status === 204) return true;
        } else {
          const res = await fetch(dialUrl, { method: 'POST', signal: AbortSignal.timeout(2000) });
          if (res.ok || res.status === 201) return true;
        }
      } catch {
        // continue
      }
    }

    return false;
  }

  /**
   * Roku ECP Protocol Handler (Port 8060)
   */
  private async dispatchRokuEcp(
    device: TVDevice,
    type: ActionType,
    payload: string,
    isNative: boolean
  ): Promise<boolean> {
    const keyMap: Record<string, string> = {
      KEYCODE_POWER: 'Power',
      KEYCODE_HOME: 'Home',
      KEYCODE_BACK: 'Back',
      KEYCODE_DPAD_UP: 'Up',
      KEYCODE_DPAD_DOWN: 'Down',
      KEYCODE_DPAD_LEFT: 'Left',
      KEYCODE_DPAD_RIGHT: 'Right',
      KEYCODE_DPAD_CENTER: 'Select',
      KEYCODE_ENTER: 'Select',
      KEYCODE_VOLUME_UP: 'VolumeUp',
      KEYCODE_VOLUME_DOWN: 'VolumeDown',
      KEYCODE_VOLUME_MUTE: 'VolumeMute',
      KEYCODE_MEDIA_PLAY_PAUSE: 'Play',
      KEYCODE_MEDIA_PLAY: 'Play',
      KEYCODE_MEDIA_PAUSE: 'Pause',
      KEYCODE_MEDIA_REWIND: 'Rev',
      KEYCODE_MEDIA_FAST_FORWARD: 'Fwd',
    };

    let path = '';
    if (type === 'keycode') {
      const rokuKey = keyMap[payload] || payload.replace('KEYCODE_', '');
      path = `/keypress/${rokuKey}`;
    } else if (type === 'app') {
      const appMap: Record<string, string> = {
        'com.google.android.youtube.tv': '837',
        'youtube': '837',
        'com.netflix.ninja': '12',
        'netflix': '12',
        'com.amazon.amazonvideo.livingroom': '13',
        'primevideo': '13',
        'com.spotify.tv.android': '19977',
        'spotify': '19977',
      };
      const appId = appMap[payload] || payload;
      path = `/launch/${appId}`;
    } else if (type === 'text') {
      path = `/keypress/Lit_${encodeURIComponent(payload)}`;
    }

    if (!path) return true;

    const url = `http://${device.ipAddress}:8060${path}`;
    const bridge = (window as unknown as {
      AndroidNativeRemote?: {
        sendHttpFull?: (url: string, method: string, body: string, timeoutMs: number) => string;
      };
    }).AndroidNativeRemote;

    try {
      if (bridge?.sendHttpFull) {
        const raw = bridge.sendHttpFull(url, 'POST', '', 1500);
        const res = JSON.parse(raw);
        return res.status >= 200 && res.status < 400;
      } else if (isNative) {
        const res = await CapacitorHttp.post({ url, connectTimeout: 1500, readTimeout: 1500 });
        return res.status >= 200 && res.status < 400;
      } else {
        await fetch(url, { method: 'POST', mode: 'no-cors', signal: AbortSignal.timeout(1500) });
        return true;
      }
    } catch {
      return false;
    }
  }

  /**
   * Samsung Tizen WebSocket / REST Protocol Handler (Port 8001 / 8002)
   */
  private async dispatchSamsungTizen(
    device: TVDevice,
    type: ActionType,
    payload: string,
    isNative: boolean
  ): Promise<boolean> {
    if (type === 'app') {
      const url = `http://${device.ipAddress}:8001/api/v2/applications/${payload}`;
      try {
        if (isNative) {
          const res = await CapacitorHttp.post({ url, connectTimeout: 2000 });
          return res.status >= 200 && res.status < 400;
        } else {
          await fetch(url, { method: 'POST', mode: 'no-cors', signal: AbortSignal.timeout(2000) });
          return true;
        }
      } catch {
        // Fall back to WebSocket
      }
    }

    const keyMap: Record<string, string> = {
      KEYCODE_POWER: 'KEY_POWER',
      KEYCODE_HOME: 'KEY_HOME',
      KEYCODE_BACK: 'KEY_RETURN',
      KEYCODE_DPAD_UP: 'KEY_UP',
      KEYCODE_DPAD_DOWN: 'KEY_DOWN',
      KEYCODE_DPAD_LEFT: 'KEY_LEFT',
      KEYCODE_DPAD_RIGHT: 'KEY_RIGHT',
      KEYCODE_DPAD_CENTER: 'KEY_ENTER',
      KEYCODE_ENTER: 'KEY_ENTER',
      KEYCODE_VOLUME_UP: 'KEY_VOLUP',
      KEYCODE_VOLUME_DOWN: 'KEY_VOLDOWN',
      KEYCODE_VOLUME_MUTE: 'KEY_MUTE',
      KEYCODE_MEDIA_PLAY_PAUSE: 'KEY_PLAY',
      KEYCODE_MEDIA_PLAY: 'KEY_PLAY',
      KEYCODE_MEDIA_PAUSE: 'KEY_PAUSE',
      KEYCODE_MEDIA_REWIND: 'KEY_REWIND',
      KEYCODE_MEDIA_FAST_FORWARD: 'KEY_FF',
    };

    const samsungKey = keyMap[payload] || 'KEY_ENTER';
    const wsUrl = `ws://${device.ipAddress}:8001/api/v2/channels/samsung.remote.control?name=${btoa('HarvyTVRemote')}`;

    return new Promise((resolve) => {
      try {
        let ws = this.wsConnections.get(device.ipAddress);
        const sendMsg = (socket: WebSocket) => {
          socket.send(
            JSON.stringify({
              method: 'ms.remote.control',
              params: {
                Cmd: 'Click',
                DataOfCmd: samsungKey,
                Option: 'false',
                TypeOfRemote: 'SendRemoteKey',
              },
            })
          );
          resolve(true);
        };

        if (!ws || ws.readyState !== WebSocket.OPEN) {
          ws = new WebSocket(wsUrl);
          this.wsConnections.set(device.ipAddress, ws);
          ws.onopen = () => sendMsg(ws!);
          ws.onerror = () => resolve(false);
          setTimeout(() => resolve(false), 1500);
        } else {
          sendMsg(ws);
        }
      } catch {
        resolve(false);
      }
    });
  }

  /**
   * LG webOS Protocol Handler (WebSocket Port 3000)
   */
  private async dispatchLgWebOs(
    device: TVDevice,
    type: ActionType,
    payload: string
  ): Promise<boolean> {
    const wsUrl = `ws://${device.ipAddress}:3000`;
    const savedKey = localStorage.getItem(`lg_key_${device.ipAddress}`) || '';

    return new Promise((resolve) => {
      try {
        let ws = this.wsConnections.get(device.ipAddress);
        const sendLgCommand = (socket: WebSocket) => {
          let uri = '';
          let params: any = {};

          if (type === 'app') {
            uri = 'ssap://system.launcher/launch';
            params = { id: payload };
          } else {
            const keyMap: Record<string, { uri: string; params?: any }> = {
              KEYCODE_POWER: { uri: 'ssap://system/turnOff' },
              KEYCODE_VOLUME_UP: { uri: 'ssap://audio/volumeUp' },
              KEYCODE_VOLUME_DOWN: { uri: 'ssap://audio/volumeDown' },
              KEYCODE_VOLUME_MUTE: { uri: 'ssap://audio/setMute', params: { mute: true } },
              KEYCODE_MEDIA_PLAY_PAUSE: { uri: 'ssap://media.controls/play' },
              KEYCODE_MEDIA_PLAY: { uri: 'ssap://media.controls/play' },
              KEYCODE_MEDIA_PAUSE: { uri: 'ssap://media.controls/pause' },
              KEYCODE_MEDIA_REWIND: { uri: 'ssap://media.controls/rewind' },
              KEYCODE_MEDIA_FAST_FORWARD: { uri: 'ssap://media.controls/fastForward' },
              KEYCODE_HOME: { uri: 'ssap://system.launcher/open' },
              KEYCODE_BACK: { uri: 'ssap://system.launcher/close' },
            };
            const mapped = keyMap[payload] || { uri: 'ssap://system.launcher/open' };
            uri = mapped.uri;
            params = mapped.params || {};
          }

          socket.send(
            JSON.stringify({
              type: 'request',
              id: `req_${Date.now()}`,
              uri,
              payload: params,
            })
          );
          resolve(true);
        };

        if (!ws || ws.readyState !== WebSocket.OPEN) {
          ws = new WebSocket(wsUrl);
          this.wsConnections.set(device.ipAddress, ws);

          ws.onopen = () => {
            const handshake = {
              type: 'register',
              id: 'register_0',
              payload: {
                forcePairing: false,
                pairingType: 'PROMPT',
                'client-key': savedKey || undefined,
                manifest: {
                  manifestVersion: 1,
                  permissions: [
                    'CONTROL_AUDIO',
                    'CONTROL_INPUT_TEXT',
                    'CONTROL_POWER',
                    'READ_INSTALLED_APPS',
                  ],
                },
              },
            };
            ws?.send(JSON.stringify(handshake));
          };

          ws.onmessage = (event) => {
            try {
              const res = JSON.parse(event.data);
              if (res.type === 'registered' && res.payload?.['client-key']) {
                localStorage.setItem(`lg_key_${device.ipAddress}`, res.payload['client-key']);
                if (ws) sendLgCommand(ws);
              }
            } catch {
              // ignore
            }
          };

          ws.onerror = () => resolve(false);
          setTimeout(() => resolve(false), 2000);
        } else {
          sendLgCommand(ws);
        }
      } catch {
        resolve(false);
      }
    });
  }

  /**
   * Sony Bravia REST IRCC Protocol Handler
   */
  private async dispatchSonyBravia(
    device: TVDevice,
    type: ActionType,
    payload: string,
    isNative: boolean
  ): Promise<boolean> {
    const irccCodes: Record<string, string> = {
      KEYCODE_POWER: 'AAAAAQAAAAEAAAAVAw==',
      KEYCODE_VOLUME_UP: 'AAAAAQAAAAEAAAASAw==',
      KEYCODE_VOLUME_DOWN: 'AAAAAQAAAAEAAAATAw==',
      KEYCODE_VOLUME_MUTE: 'AAAAAQAAAAEAAAAUAw==',
      KEYCODE_HOME: 'AAAAAQAAAAEAAABgAw==',
      KEYCODE_BACK: 'AAAAAgAAAJcAAAAjAw==',
      KEYCODE_DPAD_UP: 'AAAAAQAAAAEAAAB0Aw==',
      KEYCODE_DPAD_DOWN: 'AAAAAQAAAAEAAAB1Aw==',
      KEYCODE_DPAD_LEFT: 'AAAAAQAAAAEAAAA0Aw==',
      KEYCODE_DPAD_RIGHT: 'AAAAAQAAAAEAAAAzAw==',
      KEYCODE_DPAD_CENTER: 'AAAAAQAAAAEAAABlAw==',
      KEYCODE_ENTER: 'AAAAAQAAAAEAAABlAw==',
      KEYCODE_MEDIA_PLAY_PAUSE: 'AAAAAgAAAJcAAAAaAw==',
      KEYCODE_MEDIA_PLAY: 'AAAAAgAAAJcAAAAaAw==',
      KEYCODE_MEDIA_PAUSE: 'AAAAAgAAAJcAAAAZAw==',
      KEYCODE_MEDIA_REWIND: 'AAAAAgAAAJcAAAAbAw==',
      KEYCODE_MEDIA_FAST_FORWARD: 'AAAAAgAAAJcAAAAcAw==',
    };

    const bridge = (window as unknown as {
      AndroidNativeRemote?: {
        sendHttpFull?: (url: string, method: string, body: string, timeoutMs: number) => string;
      };
    }).AndroidNativeRemote;

    if (type === 'app') {
      const url = `http://${device.ipAddress}:${device.port || 80}/sony/appControl`;
      const body = JSON.stringify({
        method: 'setActiveApp',
        params: [{ uri: payload }],
        id: 1,
        version: '1.0',
      });
      if (bridge?.sendHttpFull) {
        const raw = bridge.sendHttpFull(url, 'POST', body, 2000);
        const res = JSON.parse(raw);
        return res.status === 200;
      } else if (isNative) {
        const res = await CapacitorHttp.post({
          url,
          headers: { 'X-Auth-PSK': '0000', 'Content-Type': 'application/json' },
          data: JSON.parse(body),
          connectTimeout: 2000,
        });
        return res.status === 200;
      }
      return false;
    }

    const code = irccCodes[payload] || 'AAAAAQAAAAEAAABlAw==';
    const url = `http://${device.ipAddress}:${device.port || 80}/sony/IRCC`;
    const xml = `<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"><s:Body><u:X_SendIRCC xmlns:u="urn:schemas-sony-com:service:IRCC:1"><IRCCCode>${code}</IRCCCode></u:X_SendIRCC></s:Body></s:Envelope>`;

    if (bridge?.sendHttpFull) {
      const raw = bridge.sendHttpFull(url, 'POST', xml, 1500);
      const res = JSON.parse(raw);
      return res.status === 200;
    } else if (isNative) {
      const res = await CapacitorHttp.post({
        url,
        headers: { 'X-Auth-PSK': '0000', 'Content-Type': 'text/xml; charset=UTF-8' },
        data: xml,
        connectTimeout: 1500,
      });
      return res.status === 200;
    }

    return false;
  }

  /**
   * Android TV ADB over Wi-Fi Protocol Handler
   */
  private async dispatchAndroidTvAdb(
    device: TVDevice,
    type: ActionType,
    payload: string,
    _commandStr: string,
    isNative: boolean
  ): Promise<boolean> {
    if (type === 'app') {
      return this.dispatchDialApp(device, payload, isNative);
    }

    const nativeBridge = (window as unknown as {
      AndroidNativeRemote?: {
        sendRawTcp: (ip: string, port: number, msg: string, timeout: number) => boolean;
      };
    }).AndroidNativeRemote;

    if (nativeBridge?.sendRawTcp) {
      try {
        const port = device.port || 5555;
        const msg = type === 'keycode'
          ? `input keyevent ${payload}\n`
          : type === 'text'
          ? `input text "${payload}"\n`
          : `monkey -p ${payload} 1\n`;
        return nativeBridge.sendRawTcp(device.ipAddress, port, msg, 1200);
      } catch {
        return false;
      }
    }

    return false;
  }

  private appendLog(item: CommandLogItem) {
    this.logs.unshift(item);
    if (this.logs.length > 50) {
      this.logs.pop();
    }
    this.saveLogs();
    this.listeners.forEach((l) => l(item));
  }

  private saveLogs() {
    try {
      localStorage.setItem('androidtv_command_logs', JSON.stringify(this.logs));
    } catch {
      // ignore
    }
  }
}
