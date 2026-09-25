import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Tv,
  Check,
  Trash2,
  Wifi,
  Search,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Radio,
  Zap,
  CheckCircle2,
  Loader2,
  Activity,
  CheckCircle,
  XCircle,
  Volume2,
  Home,
  Film,
  Play,
  Settings as SettingsIcon,
} from 'lucide-react';
import { TVDevice, TVBrand, ConnectionProtocol } from '../types';
import { BRAND_CONFIGS } from '../data/defaultTVs';
import {
  scanSubnetForTVs,
  DiscoveredTV,
  ScanProgress,
  convertDiscoveredToTVDevice,
  isNativeApp,
  getDetectedSubnet,
  runTVDiagnostic,
  TVDiagnosticResult,
} from '../utils/tvDiscovery';
import { RemoteService } from '../utils/remoteService';

interface TVManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: TVDevice[];
  activeDeviceId: string;
  onSelectDevice: (device: TVDevice) => void;
  onAddDevice: (device: TVDevice) => void;
  onUpdateDevice: (device: TVDevice) => void;
  onDeleteDevice: (id: string) => void;
  initialTab?: 'saved' | 'scan' | 'manual' | 'diagnostic';
}

export const TVManagerModal: React.FC<TVManagerModalProps> = ({
  isOpen,
  onClose,
  devices,
  activeDeviceId,
  onSelectDevice,
  onAddDevice,
  onUpdateDevice,
  onDeleteDevice,
  initialTab = 'saved',
}) => {
  const [activeTab, setActiveTab] = useState<'saved' | 'scan' | 'manual' | 'diagnostic'>(initialTab);
  const [selectedBrandGuide, setSelectedBrandGuide] = useState<TVBrand | null>(null);

  const activeDevice = devices.find((d) => d.id === activeDeviceId) || devices[0];

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Network Scanner state
  const [subnetBase, setSubnetBase] = useState(getDetectedSubnet());
  const [scanRangeEnd, setScanRangeEnd] = useState(254);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);
  const [discoveredTVs, setDiscoveredTVs] = useState<DiscoveredTV[]>([]);
  const [addedDiscoveredIps, setAddedDiscoveredIps] = useState<string[]>([]);

  // New TV form state
  const [name, setName] = useState('');
  const [brand, setBrand] = useState<TVBrand>('tcl');
  const [model, setModel] = useState('');
  const [ipAddress, setIpAddress] = useState('192.168.1.66');
  const [port, setPort] = useState(4123);
  const [protocol, setProtocol] = useState<ConnectionProtocol>('auto');
  const [location, setLocation] = useState('Living Room');

  // Diagnostic state
  const [diagIp, setDiagIp] = useState(activeDevice?.ipAddress || '192.168.1.66');
  const [diagLoading, setDiagLoading] = useState(false);
  const [diagResult, setDiagResult] = useState<TVDiagnosticResult | null>(null);
  const [diagFeedback, setDiagFeedback] = useState<string | null>(null);

  const isScanAbortedRef = useRef(false);

  if (!isOpen) return null;

  const handleStartScan = async () => {
    setIsScanning(true);
    isScanAbortedRef.current = false;
    setDiscoveredTVs([]);
    try {
      await scanSubnetForTVs(
        subnetBase,
        1,
        scanRangeEnd,
        (progress) => {
          setScanProgress(progress);
        },
        (found) => {
          setDiscoveredTVs((prev) => {
            if (prev.some((t) => t.ip === found.ip)) return prev;
            return [...prev, found];
          });
        },
        () => isScanAbortedRef.current
      );
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleStopScan = () => {
    isScanAbortedRef.current = true;
    setIsScanning(false);
    setScanProgress((prev) => (prev ? { ...prev, isScanning: false, statusText: 'Scan stopped by user.' } : null));
  };

  const handleAddDiscoveredTV = (tv: DiscoveredTV) => {
    const newDevice = convertDiscoveredToTVDevice(tv);
    onAddDevice(newDevice);
    onSelectDevice(newDevice);
    setAddedDiscoveredIps((prev) => [...prev, tv.ip]);
  };

  const handleBrandChange = (newBrand: TVBrand) => {
    setBrand(newBrand);
    const config = BRAND_CONFIGS[newBrand];
    if (config) {
      setPort(config.defaultPort);
      if (newBrand === 'sony') {
        setProtocol('sony_rest');
      } else if (newBrand === 'samsung') {
        setProtocol('samsung_tizen');
      } else if (newBrand === 'lg') {
        setProtocol('lg_webos');
      } else {
        setProtocol('auto');
      }
    }
  };

  const handleSaveNewTV = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !ipAddress.trim()) return;

    const newTV: TVDevice = {
      id: `tv-${brand}-${Date.now()}`,
      name: name.trim(),
      brand,
      model: model.trim() || undefined,
      ipAddress: ipAddress.trim(),
      port: Number(port) || 4123,
      protocol,
      location: location.trim() || undefined,
      isDefault: devices.length === 0,
      lastConnected: new Date().toISOString(),
    };

    onAddDevice(newTV);
    onSelectDevice(newTV);
    setActiveTab('saved');
    // Reset form
    setName('');
    setModel('');
    setIpAddress('192.168.1.66');
  };

  const handleRunDiagnostic = async (targetIp?: string) => {
    const ip = targetIp || diagIp;
    if (!ip.trim()) return;
    setDiagLoading(true);
    setDiagFeedback(null);
    try {
      const result = await runTVDiagnostic(ip.trim());
      setDiagResult(result);
    } catch (e: any) {
      setDiagFeedback(`Diagnostic error: ${e?.message || 'Failed'}`);
    } finally {
      setDiagLoading(false);
    }
  };

  const handleTestKey = async (keycode: string, label: string) => {
    const service = RemoteService.getInstance();
    const tempDevice: TVDevice = {
      id: 'test-device',
      name: 'Diagnostic TV',
      brand: diagResult?.detectedBrand || 'tcl',
      ipAddress: diagIp.trim(),
      port: diagResult?.recommendedPort || 4123,
      protocol: diagResult?.recommendedProtocol || 'auto',
      isDefault: false,
    };

    setDiagFeedback(`Sending ${label} signal to ${diagIp}...`);
    try {
      await service.sendKeycode(tempDevice, keycode);
      setDiagFeedback(`Sent ${label}! Check if TV responded.`);
    } catch {
      setDiagFeedback(`Error sending ${label}`);
    }
  };

  const handleTestApp = async (appPkg: string, appName: string) => {
    const service = RemoteService.getInstance();
    const tempDevice: TVDevice = {
      id: 'test-device',
      name: 'Diagnostic TV',
      brand: diagResult?.detectedBrand || 'tcl',
      ipAddress: diagIp.trim(),
      port: diagResult?.recommendedPort || 4123,
      protocol: diagResult?.recommendedProtocol || 'auto',
      isDefault: false,
    };

    setDiagFeedback(`Launching ${appName} via DIAL on ${diagIp}:8008...`);
    try {
      await service.launchApp(tempDevice, appPkg, appName);
      setDiagFeedback(`Dispatched launch for ${appName}!`);
    } catch {
      setDiagFeedback(`Failed to launch ${appName}`);
    }
  };

  const handleApplyRecommendedProtocol = () => {
    if (!diagResult) return;
    if (activeDevice && activeDevice.ipAddress === diagIp.trim()) {
      const updated: TVDevice = {
        ...activeDevice,
        protocol: diagResult.recommendedProtocol,
        port: diagResult.recommendedPort,
        brand: diagResult.detectedBrand || activeDevice.brand,
      };
      onUpdateDevice(updated);
      onSelectDevice(updated);
      setDiagFeedback(`Updated active TV to ${diagResult.recommendedProtocol} on port ${diagResult.recommendedPort}!`);
    } else {
      // Create new device entry
      const newDev: TVDevice = {
        id: `tv-${diagResult.detectedBrand || 'tcl'}-${Date.now()}`,
        name: `Smart TV (${diagIp.trim()})`,
        brand: diagResult.detectedBrand || 'tcl',
        ipAddress: diagIp.trim(),
        port: diagResult.recommendedPort,
        protocol: diagResult.recommendedProtocol,
        isDefault: devices.length === 0,
        lastConnected: new Date().toISOString(),
      };
      onAddDevice(newDev);
      onSelectDevice(newDev);
      setDiagFeedback(`Added and connected TV with ${diagResult.recommendedProtocol}!`);
    }
  };

  const currentBrandInfo = BRAND_CONFIGS[brand];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in overflow-hidden">
      <div className="w-full max-w-full sm:max-w-xl rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] box-border">
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30 flex-shrink-0">
              <Tv className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate">Smart TV Manager & Scanner</h3>
              <p className="text-[10.5px] text-slate-400 truncate">
                Wi-Fi remote for TCL, Samsung, LG, Sony, Roku & Google TV
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer flex-shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation - 2x2 grid on mobile phones, 4 cols on tablets */}
        <div className="px-2.5 sm:px-4 pt-2.5 pb-1.5 bg-slate-950/60 border-b border-slate-800/80 flex-shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('saved')}
              className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'saved'
                  ? 'bg-slate-800 text-white shadow-md border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Tv className="w-3.5 h-3.5 text-cyan-400" />
              <span>Saved ({devices.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('scan')}
              className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer relative ${
                activeTab === 'scan'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-cyan-400 bg-cyan-950/30 hover:bg-cyan-950/50 border border-cyan-500/30'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${activeTab === 'scan' ? '' : 'animate-pulse'}`} />
              <span>Auto-Scan</span>
              <span className={`px-1 py-0.2 rounded text-[8px] font-mono uppercase ${
                activeTab === 'scan' ? 'bg-slate-950 text-cyan-300' : 'bg-cyan-400 text-slate-950'
              }`}>
                Live
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('diagnostic')}
              className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'diagnostic'
                  ? 'bg-indigo-600 text-white shadow-md border border-indigo-500'
                  : 'text-indigo-300 hover:text-white bg-indigo-950/30 border border-indigo-500/30'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              <span>Diagnostic</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'manual'
                  ? 'bg-slate-800 text-white shadow-md border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Manual Add</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 max-w-full overflow-x-hidden">
          {/* TAB 1: SAVED TVS */}
          {activeTab === 'saved' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Configured TVs ({devices.length})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('scan')}
                    className="px-2.5 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 hover:bg-cyan-500/25 transition-all"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>Auto-Scan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('manual')}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 hover:bg-cyan-400 transition-all shadow-md shadow-cyan-500/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add TV</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {devices.map((device) => {
                  const isActive = device.id === activeDeviceId;
                  const brandConfig = BRAND_CONFIGS[device.brand];

                  return (
                    <div
                      key={device.id}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                        isActive
                          ? 'bg-cyan-950/30 border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                          : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'
                      }`}
                    >
                      <div
                        onClick={() => onSelectDevice(device)}
                        className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            isActive
                              ? 'bg-cyan-500 text-slate-950 font-bold'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          <Tv className="w-4 h-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                              {device.name}
                            </h4>
                            {isActive && (
                              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-semibold">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                            <span className="text-cyan-300">{device.ipAddress}</span>
                            <span>•</span>
                            <span className="text-slate-300 capitalize">{brandConfig?.name || device.brand}</span>
                            <span>•</span>
                            <span className="text-slate-500 font-sans uppercase text-[9px]">{device.protocol}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setDiagIp(device.ipAddress);
                            setActiveTab('diagnostic');
                            handleRunDiagnostic(device.ipAddress);
                          }}
                          title="Run Port & Protocol Diagnostic"
                          className="px-2 py-1 rounded-lg bg-indigo-950/50 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Activity className="w-3 h-3" />
                          <span>Diagnose</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedBrandGuide(device.brand)}
                          title="Brand Setup Guide"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50 transition-colors cursor-pointer"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                        </button>
                        {devices.length > 1 && (
                          <button
                            type="button"
                            onClick={() => onDeleteDevice(device.id)}
                            title="Delete TV"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700/50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: AUTO-SCAN (1 to 254) */}
          {activeTab === 'scan' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
                    <Radio className={`w-4 h-4 text-cyan-400 ${isScanning ? 'animate-pulse' : ''}`} />
                    <span>Universal Local Wi-Fi TV Radar</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                    Full Subnet Probe (1–254)
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Sweeps your Wi-Fi router for TCL BeyondTV/Android, Samsung Tizen, LG webOS, Roku, and Google TV devices.
                </p>

                {/* Subnet selector buttons */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Your Router Subnet Range:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {['192.168.1.', '192.168.0.', '192.168.29.', '192.168.31.'].map((sub) => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => setSubnetBase(sub)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-mono transition-colors cursor-pointer ${
                          subnetBase === sub
                            ? 'bg-cyan-500 text-slate-950 font-bold'
                            : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                        }`}
                      >
                        {sub}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subnet input & range presets */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={subnetBase}
                      onChange={(e) => setSubnetBase(e.target.value)}
                      placeholder="e.g. 192.168.1."
                      disabled={isScanning}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    {isScanning ? (
                      <button
                        type="button"
                        onClick={handleStopScan}
                        className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-rose-600/30 cursor-pointer animate-pulse"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Stop Scan</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleStartScan}
                        className="w-full py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>Scan 1–{scanRangeEnd}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Range presets */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                  <span>Range limit: 1 to {scanRangeEnd}</span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      disabled={isScanning}
                      onClick={() => setScanRangeEnd(50)}
                      className={`px-2 py-0.5 rounded cursor-pointer ${scanRangeEnd === 50 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                    >
                      Quick (1–50)
                    </button>
                    <button
                      type="button"
                      disabled={isScanning}
                      onClick={() => setScanRangeEnd(100)}
                      className={`px-2 py-0.5 rounded cursor-pointer ${scanRangeEnd === 100 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                    >
                      Fast (1–100)
                    </button>
                    <button
                      type="button"
                      disabled={isScanning}
                      onClick={() => setScanRangeEnd(254)}
                      className={`px-2 py-0.5 rounded cursor-pointer ${scanRangeEnd === 254 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                    >
                      Full (1–254)
                    </button>
                  </div>
                </div>

                {/* Live Progress Bar */}
                {scanProgress && isScanning && (
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>{scanProgress.statusText}</span>
                      <span>
                        {Math.round((scanProgress.scannedCount / scanProgress.totalCount) * 100)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-cyan-400 transition-all duration-150"
                        style={{
                          width: `${(scanProgress.scannedCount / scanProgress.totalCount) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Discovered TVs List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Discovered TVs ({discoveredTVs.length})
                  </span>
                  {discoveredTVs.length > 0 && (
                    <span className="text-[10px] text-emerald-400 font-medium">
                      Tap Connect to use right away
                    </span>
                  )}
                </div>

                {discoveredTVs.length === 0 && !isScanning && (
                  <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-800 text-center space-y-2">
                    <Tv className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400">
                      No TVs found yet. Make sure your phone and TV are on the same Wi-Fi.
                    </p>
                    <div className="flex justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleStartScan}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-xs font-bold"
                      >
                        Start Scan Now
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDiagIp('192.168.1.66');
                          setActiveTab('diagnostic');
                          handleRunDiagnostic('192.168.1.66');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 text-xs font-bold"
                      >
                        Test 192.168.1.66 Direct
                      </button>
                    </div>
                  </div>
                )}

                {discoveredTVs.map((tv) => {
                  const isAdded =
                    addedDiscoveredIps.includes(tv.ip) ||
                    devices.some((d) => d.ipAddress === tv.ip);

                  return (
                    <div
                      key={tv.ip}
                      className="p-3 rounded-xl bg-slate-800/80 border border-emerald-500/40 flex items-center justify-between shadow-lg shadow-emerald-950/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex items-center justify-center">
                          <Tv className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white">{tv.name}</h4>
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-mono">
                              {tv.responseTimeMs}ms
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                            <span className="text-cyan-300">{tv.ip}</span>
                            <span>•</span>
                            <span className="text-slate-300 capitalize">{tv.brand}</span>
                            <span>•</span>
                            <span className="text-slate-500">Port {tv.port}</span>
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddDiscoveredTV(tv)}
                        disabled={isAdded}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isAdded
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Connected</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5" />
                            <span>Connect TV</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: DIAGNOSTIC & PROTOCOL RESOLVER */}
          {activeTab === 'diagnostic' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
                    <Activity className="w-4 h-4 text-indigo-400" />
                    <span>TV Protocol & Port Diagnostic Analyzer</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                    Deep Probe
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Probes every Smart TV port (DIAL 8008, TCL T-Cast 4123, Roku 8060, Android TV Remote 6467, Samsung 8001, LG 3000, Sony 80, ADB 5555) to detect the exact working protocol.
                </p>

                {/* Target IP Input */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="col-span-2">
                    <label className="text-[10px] text-slate-400 block mb-1 font-semibold uppercase">
                      Target TV IP Address:
                    </label>
                    <input
                      type="text"
                      value={diagIp}
                      onChange={(e) => setDiagIp(e.target.value)}
                      placeholder="192.168.1.66"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => handleRunDiagnostic()}
                      disabled={diagLoading}
                      className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
                    >
                      {diagLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Testing...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5" />
                          <span>Run Diagnostic</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {diagFeedback && (
                  <div className="p-2.5 rounded-xl bg-indigo-900/30 border border-indigo-500/40 text-xs text-indigo-200 font-mono">
                    {diagFeedback}
                  </div>
                )}
              </div>

              {/* Diagnostic Results Card */}
              {diagResult && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Diagnostic Breakdown for {diagResult.ip}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">
                      Recommended: {diagResult.recommendedProtocol}
                    </span>
                  </div>

                  {/* Ports Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      diagResult.dialOpen ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}>
                      <div>
                        <span className="font-bold block text-[11px]">Port 8008</span>
                        <span className="text-[9px]">DIAL / Netflix</span>
                      </div>
                      {diagResult.dialOpen ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-slate-600" />}
                    </div>

                    <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      diagResult.tclOpen ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}>
                      <div>
                        <span className="font-bold block text-[11px]">Port 4123</span>
                        <span className="text-[9px]">TCL T-Cast</span>
                      </div>
                      {diagResult.tclOpen ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-slate-600" />}
                    </div>

                    <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      diagResult.rokuOpen ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}>
                      <div>
                        <span className="font-bold block text-[11px]">Port 8060</span>
                        <span className="text-[9px]">Roku ECP</span>
                      </div>
                      {diagResult.rokuOpen ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-slate-600" />}
                    </div>

                    <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      diagResult.androidTvRemoteOpen ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}>
                      <div>
                        <span className="font-bold block text-[11px]">Port 6467</span>
                        <span className="text-[9px]">Google TV v2</span>
                      </div>
                      {diagResult.androidTvRemoteOpen ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-slate-600" />}
                    </div>

                    <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      diagResult.samsungOpen ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}>
                      <div>
                        <span className="font-bold block text-[11px]">Port 8001</span>
                        <span className="text-[9px]">Samsung Tizen</span>
                      </div>
                      {diagResult.samsungOpen ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-slate-600" />}
                    </div>

                    <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      diagResult.lgOpen ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}>
                      <div>
                        <span className="font-bold block text-[11px]">Port 3000</span>
                        <span className="text-[9px]">LG webOS</span>
                      </div>
                      {diagResult.lgOpen ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-slate-600" />}
                    </div>

                    <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      diagResult.sonyOpen ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}>
                      <div>
                        <span className="font-bold block text-[11px]">Port 80</span>
                        <span className="text-[9px]">Sony Simple IP</span>
                      </div>
                      {diagResult.sonyOpen ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-slate-600" />}
                    </div>

                    <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      diagResult.adbOpen ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}>
                      <div>
                        <span className="font-bold block text-[11px]">Port 5555</span>
                        <span className="text-[9px]">ADB Debugging</span>
                      </div>
                      {diagResult.adbOpen ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-slate-600" />}
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                    💡 <span className="font-bold text-white">Insight:</span> {diagResult.details}
                  </p>

                  {/* Live Interactive Test Row */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Live Command Test on {diagIp}:
                    </span>
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => handleTestKey('KEYCODE_VOLUME_UP', 'Volume +')}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex flex-col items-center gap-1 border border-slate-700 cursor-pointer"
                      >
                        <Volume2 className="w-4 h-4 text-cyan-400" />
                        <span className="text-[10px]">Vol +</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleTestKey('KEYCODE_HOME', 'Home')}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex flex-col items-center gap-1 border border-slate-700 cursor-pointer"
                      >
                        <Home className="w-4 h-4 text-amber-400" />
                        <span className="text-[10px]">Home</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleTestKey('KEYCODE_DPAD_CENTER', 'OK / Select')}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex flex-col items-center gap-1 border border-slate-700 cursor-pointer"
                      >
                        <Play className="w-4 h-4 text-emerald-400" />
                        <span className="text-[10px]">OK / Select</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleTestApp('com.netflix.ninja', 'Netflix')}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex flex-col items-center gap-1 border border-slate-700 cursor-pointer"
                      >
                        <Film className="w-4 h-4 text-rose-400" />
                        <span className="text-[10px]">Netflix</span>
                      </button>
                    </div>
                  </div>

                  {/* Apply Best Protocol Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleApplyRecommendedProtocol}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Apply {diagResult.recommendedProtocol.toUpperCase()} to this TV</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MANUAL ADD TV FORM */}
          {activeTab === 'manual' && (
            <form onSubmit={handleSaveNewTV} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                  Add TV Device Manually
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('saved')}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {/* TV Brand Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Brand
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {(Object.keys(BRAND_CONFIGS) as TVBrand[]).map((b) => {
                    const cfg = BRAND_CONFIGS[b];
                    const isSelected = brand === b;
                    return (
                      <button
                        key={b}
                        type="button"
                        onClick={() => handleBrandChange(b)}
                        className={`p-2 rounded-xl border text-xs text-left transition-all ${
                          isSelected
                            ? 'bg-cyan-500/20 border-cyan-400 text-white font-bold shadow-md shadow-cyan-500/20'
                            : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="block truncate">{cfg.name.split(' ')[0]}</span>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          :{cfg.defaultPort}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Protocol Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Connection Protocol
                </label>
                <select
                  value={protocol}
                  onChange={(e) => setProtocol(e.target.value as ConnectionProtocol)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400 font-mono"
                >
                  <option value="auto">Universal Auto-Detect (TCL T-Cast / Roku / DIAL fallback)</option>
                  <option value="tcl_tcast">TCL TV+ MagiConnect (Port 4123)</option>
                  <option value="tcl_roku_ecp">Roku OS / TCL Roku ECP (Port 8060)</option>
                  <option value="androidtv_v2">Google TV / Android TV Remote v2 (Port 6466/6467)</option>
                  <option value="samsung_tizen">Samsung Smart TV Tizen (Port 8001)</option>
                  <option value="lg_webos">LG webOS Smart TV (Port 3000)</option>
                  <option value="sony_rest">Sony Bravia Simple IP Control (Port 80)</option>
                  <option value="adb">ADB over Wi-Fi (Port 5555)</option>
                </select>
              </div>

              {/* TV Friendly Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  TV Name / Room <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TCL Living Room, Bedroom Samsung, Hotel Mi TV"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* IP Address & Port */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    IP Address on Local Wi-Fi <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="192.168.1.66"
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Port</label>
                  <input
                    type="number"
                    value={port}
                    onChange={(e) => setPort(parseInt(e.target.value) || 4123)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
              </div>

              {/* Quick Subnet Buttons */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Common Subnets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIpAddress('192.168.1.66')}
                    className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/40 text-[10px] text-cyan-300 font-mono"
                  >
                    192.168.1.66 (Your TCL TV)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIpAddress('192.168.1.')}
                    className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 hover:text-white border border-slate-700"
                  >
                    192.168.1.x
                  </button>
                  <button
                    type="button"
                    onClick={() => setIpAddress('192.168.0.')}
                    className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 hover:text-white border border-slate-700"
                  >
                    192.168.0.x
                  </button>
                  <button
                    type="button"
                    onClick={() => setIpAddress('192.168.29.')}
                    className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 hover:text-white border border-slate-700"
                  >
                    192.168.29.x (JioFiber)
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('saved')}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-md shadow-cyan-500/20"
                >
                  Save & Connect TV
                </button>
              </div>
            </form>
          )}

          {/* Brand Guide Drawer Modal */}
          {selectedBrandGuide && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  {BRAND_CONFIGS[selectedBrandGuide]?.name} Setup Instructions
                </h4>
                <button
                  type="button"
                  onClick={() => setSelectedBrandGuide(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Close
                </button>
              </div>

              <ol className="list-decimal pl-4 space-y-1 text-xs text-slate-300">
                {BRAND_CONFIGS[selectedBrandGuide]?.setupGuide.map((step, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {step}
                  </li>
                ))}
              </ol>

              {BRAND_CONFIGS[selectedBrandGuide]?.notes && (
                <p className="text-[11px] text-cyan-300/80 bg-cyan-950/20 p-2.5 rounded-lg border border-cyan-500/20">
                  Tip: {BRAND_CONFIGS[selectedBrandGuide].notes}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
