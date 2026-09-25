import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Tv, Plus, Settings, Keyboard, Smartphone, Download, Radio, ChevronRight } from 'lucide-react';
import { TVDevice } from '../types';
import { BRAND_CONFIGS } from '../data/defaultTVs';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface TVDeviceSelectorProps {
  devices: TVDevice[];
  activeDevice: TVDevice;
  onSelectDevice: (device: TVDevice) => void;
  onOpenTVManager: () => void;
  onOpenScan?: () => void;
  onOpenKeyboard: () => void;
  onOpenSettings: () => void;
  onOpenMobileGuide?: () => void;
  ledActive: boolean;
}

export const TVDeviceSelector: React.FC<TVDeviceSelectorProps> = ({
  devices,
  activeDevice,
  onSelectDevice,
  onOpenTVManager,
  onOpenScan,
  onOpenKeyboard,
  onOpenSettings,
  onOpenMobileGuide,
  ledActive,
}) => {
  const { canInstall, isInstalled, installApp } = usePWAInstall();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const brandInfo = BRAND_CONFIGS[activeDevice.brand];

  return (
    <header className="w-full flex items-center justify-between px-3 py-2 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-30 select-none">
      {/* Left: TV Picker with "Harvy TV Remote connected to TV's Name" */}
      <div className="relative flex-1 min-w-0 mr-2" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-800/70 hover:bg-slate-700/80 active:bg-slate-800 border border-slate-700/70 transition-all text-left cursor-pointer group"
          title="Click to switch connected Android TV"
        >
          {/* LED IR / Wi-Fi Emitter status indicator */}
          <div className="relative flex-shrink-0">
            <div
              className={`w-2.5 h-2.5 rounded-full transition-all duration-150 ${
                ledActive
                  ? 'bg-cyan-400 shadow-[0_0_12px_#38bdf8] scale-125 ring-2 ring-cyan-300'
                  : 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]'
              }`}
            />
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <div className="text-[11px] sm:text-xs font-semibold text-slate-200 truncate leading-tight">
              <span className="font-bold text-white">Harvy TV Remote</span>
              <span className="text-slate-400 mx-1">connected to</span>
              <span className="text-cyan-400 font-bold">"{activeDevice.name}"</span>
            </div>
            <span className="text-[9px] text-slate-400 font-mono truncate">
              {activeDevice.ipAddress} • {brandInfo?.name.split(' ')[0] || activeDevice.brand.toUpperCase()}
            </span>
          </div>

          <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors flex-shrink-0" />
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden py-1.5 z-40 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800 flex items-center justify-between">
              <span>Switch Android TV</span>
              <span className="text-cyan-400 font-mono">{devices.length} Saved</span>
            </div>

            {/* Quick Auto-Scan option inside dropdown */}
            <div className="p-1.5 border-b border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  if (onOpenScan) onOpenScan();
                  else onOpenTVManager();
                }}
                className="w-full px-2.5 py-2 rounded-xl bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/40 text-left flex items-center justify-between transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Auto-Scan Network</span>
                      <span className="px-1.5 py-0.2 rounded text-[8px] bg-cyan-400 text-slate-950 font-bold uppercase">
                        Radar
                      </span>
                    </div>
                    <div className="text-[9.5px] text-slate-400">Discover TVs on Wi-Fi automatically</div>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            <div className="max-h-56 overflow-y-auto py-1">
              {devices.map((device) => {
                const isSelected = device.id === activeDevice.id;
                return (
                  <button
                    key={device.id}
                    type="button"
                    onClick={() => {
                      onSelectDevice(device);
                      setDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-cyan-500/15 text-cyan-300 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs truncate">{device.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {device.ipAddress} • {device.brand.toUpperCase()}
                      </div>
                    </div>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-cyan-400" />}
                  </button>
                );
              })}
            </div>

            <div className="border-t border-slate-800 pt-1 px-1">
              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  onOpenTVManager();
                }}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-cyan-400 hover:bg-cyan-500/10 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add / Manage TVs</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right: Quick Action Controls */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Direct Install PWA button when installable in Chrome / Mobile */}
        {canInstall && !isInstalled && (
          <button
            type="button"
            id="btn-quick-install-app"
            onClick={installApp}
            title="Install Harvy TV Remote as a standalone app on your phone"
            className="px-2 py-1 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-bold text-[10px] flex items-center gap-1 shadow-md transition-all cursor-pointer"
          >
            <Download className="w-3 h-3" />
            <span>Install App</span>
          </button>
        )}

        {/* Mobile Install & APK Guide */}
        {onOpenMobileGuide && (
          <button
            type="button"
            id="btn-open-mobile-guide"
            onClick={onOpenMobileGuide}
            title="Get APK / Install on Mobile Phone"
            className="px-2 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-400/30 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] font-bold tracking-tight">APK</span>
          </button>
        )}

        {/* Quick Auto-Scan Wi-Fi TVs button */}
        <button
          type="button"
          id="btn-quick-auto-scan"
          onClick={onOpenScan || onOpenTVManager}
          title="Auto-Scan Wi-Fi Network for TVs"
          className="px-2 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 active:scale-95 text-cyan-300 border border-cyan-400/40 flex items-center gap-1 transition-all shadow-[0_0_10px_rgba(56,189,248,0.2)] cursor-pointer"
        >
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="text-[10px] font-bold tracking-tight">Scan</span>
        </button>

        {/* Send text to TV */}
        <button
          type="button"
          id="btn-open-keyboard"
          onClick={onOpenKeyboard}
          title="Type text or search on TV"
          className="p-1.5 rounded-xl bg-slate-800/70 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors cursor-pointer"
        >
          <Keyboard className="w-4 h-4 text-cyan-400" />
        </button>

        {/* Manage TVs */}
        <button
          type="button"
          id="btn-open-tv-manager"
          onClick={onOpenTVManager}
          title="TV Device Profiles"
          className="p-1.5 rounded-xl bg-slate-800/70 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors cursor-pointer"
        >
          <Tv className="w-4 h-4 text-emerald-400" />
        </button>

        {/* Remote Settings */}
        <button
          type="button"
          id="btn-open-settings"
          onClick={onOpenSettings}
          title="Remote Settings"
          className="p-1.5 rounded-xl bg-slate-800/70 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors cursor-pointer"
        >
          <Settings className="w-4 h-4 text-slate-400" />
        </button>
      </div>
    </header>
  );
};
