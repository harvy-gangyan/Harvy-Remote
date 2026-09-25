import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Power,
  VolumeX,
  Plus,
  Minus,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Home,
  Settings as SettingsIcon,
  Mic,
  Tv,
  Play,
  Pause,
  FastForward,
  Rewind,
  MousePointer,
  Grid,
  Sparkles,
  Layers,
  Usb,
  Hash,
  Radio,
  Subtitles,
  Cable,
  Keyboard,
  Check,
  Minimize2,
  X,
} from 'lucide-react';
import { DPadControl } from './DPadControl';
import { TrackpadControl } from './TrackpadControl';
import { AppLauncherDock } from './AppLauncherDock';
import { NumpadControl } from './NumpadControl';
import { MyAppsManager } from './MyAppsManager';
import { USBDriveModal } from './USBDriveModal';
import { TVDevice, CustomButton, RemoteSettings, StreamingApp, AppShortcut } from '../types';
import { BRAND_CONFIGS } from '../data/defaultTVs';
import { playRemoteClick } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import { RemoteService } from '../utils/remoteService';

interface RemoteShellProps {
  devices: TVDevice[];
  activeDevice: TVDevice;
  onSelectDevice: (device: TVDevice) => void;
  onOpenTVManager: () => void;
  onOpenScan: () => void;
  onOpenKeyboard: () => void;
  onOpenSettings: () => void;
  customButtons: CustomButton[];
  shortcuts: AppShortcut[];
  installedApps: StreamingApp[];
  onRefreshAppsFromTv: () => Promise<void>;
  isRefreshingApps: boolean;
  onAddCustomApp: (newApp: StreamingApp) => void;
  settings: RemoteSettings;
  ledActive: boolean;
  onKeycodePress: (keycode: string) => void;
  onLaunchApp: (app: StreamingApp) => void;
  onLaunchShortcut: (shortcut: AppShortcut) => void;
  onUpdateShortcuts: (shortcuts: AppShortcut[]) => void;
  onAddAppToShortcuts: (app: StreamingApp) => void;
  onRemoveAppFromShortcuts: (appId: string) => void;
  onTriggerCustomButton: (button: CustomButton) => void;
  onAddCustomClick: () => void;
  onEditCustomClick: (button: CustomButton) => void;
  onDeleteCustomClick: (buttonId: string) => void;
  onUpdateSettings: (newSettings: Partial<RemoteSettings>) => void;
  onMinimize?: () => void;
  onCloseApp?: () => void;
}

export const RemoteShell: React.FC<RemoteShellProps> = ({
  devices,
  activeDevice,
  onSelectDevice,
  onOpenTVManager,
  onOpenScan,
  onOpenKeyboard,
  onOpenSettings,
  onMinimize,
  onCloseApp,
  customButtons,
  shortcuts,
  installedApps,
  onRefreshAppsFromTv,
  isRefreshingApps,
  onAddCustomApp,
  settings,
  ledActive,
  onKeycodePress,
  onLaunchApp,
  onLaunchShortcut,
  onUpdateShortcuts,
  onAddAppToShortcuts,
  onRemoveAppFromShortcuts,
  onTriggerCustomButton,
  onAddCustomClick,
  onUpdateSettings,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [detectedMediaState, setDetectedMediaState] = useState<'playing' | 'paused' | 'stopped' | 'unknown'>('unknown');
  const [isUsbModalOpen, setIsUsbModalOpen] = useState(false);
  const [showOtherTvOptions, setShowOtherTvOptions] = useState(false);
  const [showNumericInDrawer, setShowNumericInDrawer] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Active TV media playback state sync (checked once on connect, no thread-locking continuous poll)
  useEffect(() => {
    let isMounted = true;
    const checkState = async () => {
      if (!activeDevice || !activeDevice.ipAddress) return;
      try {
        const state = await RemoteService.getInstance().queryMediaPlaybackState(activeDevice);
        if (!isMounted) return;
        setDetectedMediaState(state);
        if (state === 'playing') {
          setIsPlaying(true);
        } else if (state === 'paused' || state === 'stopped') {
          setIsPlaying(false);
        }
      } catch {
        // ignore
      }
    };

    // Lightweight one-time check with small delay so initial render is instantaneous
    const timer = setTimeout(checkState, 1000);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [activeDevice?.id]);

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

  const handlePress = (
    keycode: string,
    soundType: 'standard' | 'power' | 'nav' | 'ok' | 'switch' = 'standard',
    hapticType: 'light' | 'medium' | 'heavy' = 'light'
  ) => {
    if (settings.sound) playRemoteClick(soundType);
    if (settings.haptics) triggerHaptic(hapticType);
    onKeycodePress(keycode);
  };

  const handlePlay = () => {
    setIsPlaying(true);
    handlePress('KEYCODE_MEDIA_PLAY', 'ok', 'medium');
  };

  const handlePause = () => {
    setIsPlaying(false);
    handlePress('KEYCODE_MEDIA_PAUSE', 'ok', 'medium');
  };

  const handlePlayPauseToggle = () => {
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    handlePress(nextState ? 'KEYCODE_MEDIA_PLAY' : 'KEYCODE_MEDIA_PAUSE', 'ok', 'medium');
  };

  const handleUsbPress = () => {
    if (settings.sound) playRemoteClick('ok');
    if (settings.haptics) triggerHaptic('medium');
    setIsUsbModalOpen(true);
  };

  return (
    <div
      style={{
        paddingBottom: 'max(2.5rem, calc(env(safe-area-inset-bottom, 0px) + 1.75rem))',
        paddingTop: 'max(0.5rem, env(safe-area-inset-top, 0px))',
      }}
      className="w-full h-full min-h-dvh max-w-full sm:max-w-[420px] sm:h-[calc(100dvh-24px)] sm:max-h-[860px] bg-[#070b13] rounded-none sm:rounded-[28px] border-0 sm:border sm:border-slate-800/90 shadow-none sm:shadow-[0_12px_45px_rgba(0,0,0,0.85)] flex flex-col px-2.5 sm:px-3.5 relative select-none overflow-y-auto overflow-x-hidden my-0 sm:my-auto"
    >
      {/* 1. Sleek Integrated TV Selector & Header Bar (Inside the Remote UI) */}
      <div className="w-full flex items-center justify-between pb-2 mb-1 border-b border-slate-800/80 flex-shrink-0">
        {/* Left: TV Picker with Dropdown */}
        <div className="relative flex-1 min-w-0 mr-2" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 active:bg-slate-900 border border-slate-700/70 transition-all text-left cursor-pointer group"
            title="Click to switch TV"
          >
            {/* LED Status Indicator */}
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
              <span className="text-[11.5px] font-bold text-white truncate leading-tight">
                {activeDevice.name}
              </span>
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
                <span>Switch TV Device</span>
                <span className="text-cyan-400 font-mono">{devices.length} Available</span>
              </div>

              {/* Quick Auto-Scan option inside dropdown */}
              <div className="p-1.5 border-b border-slate-800/80">
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenScan();
                  }}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/40 text-left flex items-center justify-between transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    <div>
                      <span className="text-[11px] font-bold text-white block">Auto-Scan Local Wi-Fi</span>
                      <span className="text-[9px] text-cyan-300 block">Detect Smart TVs around you</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-cyan-400 font-mono">Scan →</span>
                </button>
              </div>

              {/* TV List */}
              <div className="max-h-60 overflow-y-auto py-1">
                {devices.map((device) => {
                  const isCurrent = device.id === activeDevice.id;
                  const cfg = BRAND_CONFIGS[device.brand];

                  return (
                    <button
                      key={device.id}
                      type="button"
                      onClick={() => {
                        onSelectDevice(device);
                        setDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left flex items-center justify-between transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-cyan-500/15 text-white font-medium border-l-2 border-cyan-400'
                          : 'hover:bg-slate-800/60 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            isCurrent ? 'bg-cyan-400' : 'bg-slate-600'
                          }`}
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs truncate font-medium text-slate-200">
                            {device.name}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono truncate">
                            {device.ipAddress} • {cfg?.name.split(' ')[0] || device.brand.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {isCurrent && <Check className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Manage TVs option */}
              <div className="p-1.5 border-t border-slate-800 bg-slate-950/40 flex justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenTVManager();
                  }}
                  className="w-full py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Tv className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Manage / Add TVs</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Quick Action Buttons (Scan Radar, Keyboard, TVs, Settings - NO APK button) */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            id="btn-quick-auto-scan"
            onClick={onOpenScan}
            title="Auto-Scan Wi-Fi for TVs"
            className="px-2 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 active:scale-95 text-cyan-300 border border-cyan-400/40 flex items-center gap-1 transition-all shadow-[0_0_10px_rgba(56,189,248,0.2)] cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="text-[10px] font-bold tracking-tight">Scan</span>
          </button>

          <button
            type="button"
            id="btn-open-tv-manager"
            onClick={onOpenTVManager}
            title="TV Device Profiles"
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors cursor-pointer"
          >
            <Tv className="w-4 h-4 text-emerald-400" />
          </button>

          <button
            type="button"
            id="btn-open-settings"
            onClick={onOpenSettings}
            title="Remote Settings"
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors cursor-pointer"
          >
            <SettingsIcon className="w-4 h-4 text-slate-400" />
          </button>

          {onMinimize && (
            <button
              type="button"
              id="btn-minimize-remote"
              onClick={onMinimize}
              title="Minimize to Floating Mini Remote (Leave screen free for other apps)"
              className="p-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/35 active:scale-95 text-cyan-300 border border-cyan-400/40 transition-all cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.3)] hover:scale-105"
            >
              <Minimize2 className="w-4 h-4 text-cyan-300" />
            </button>
          )}

          {onCloseApp && (
            <button
              type="button"
              id="btn-close-app"
              onClick={onCloseApp}
              title="Close / Exit TV Remote"
              className="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 active:scale-95 text-rose-300 border border-rose-500/40 transition-all cursor-pointer shadow-sm hover:scale-105"
            >
              <X className="w-4 h-4 text-rose-300" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Top Hardware Row: Power, USB, Mute */}
      <div className="grid grid-cols-3 gap-2 my-1 flex-shrink-0">
        {/* Power Button */}
        <motion.button
          id="btn-power"
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => handlePress('KEYCODE_POWER', 'power', 'heavy')}
          className="h-10 rounded-xl bg-gradient-to-b from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 active:from-red-700 text-white flex items-center justify-center gap-1.5 shadow-[0_2px_10px_rgba(220,38,38,0.4),inset_0_1px_1px_rgba(255,255,255,0.3)] border border-red-500/50 cursor-pointer"
          title="TV Power Toggle"
        >
          <Power className="w-4 h-4 drop-shadow" />
          <span className="text-[9px] uppercase font-bold tracking-wider">Power</span>
        </motion.button>

        {/* USB Media Button */}
        <motion.button
          id="btn-usb-media"
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.92 }}
          onClick={handleUsbPress}
          className="h-10 rounded-xl bg-slate-800/90 hover:bg-slate-700 active:bg-slate-800 text-slate-200 border border-slate-700/80 flex items-center justify-center gap-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.4)] cursor-pointer group"
          title="USB Storage & External Drives"
        >
          <Usb className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          <span className="text-[9px] uppercase font-bold tracking-wider text-cyan-300">USB</span>
        </motion.button>

        {/* Mute Button */}
        <motion.button
          id="btn-mute"
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => handlePress('KEYCODE_VOLUME_MUTE', 'standard', 'medium')}
          className="h-10 rounded-xl bg-slate-800/90 hover:bg-slate-700 active:bg-slate-800 text-slate-200 border border-slate-700/80 flex items-center justify-center gap-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.4)] cursor-pointer"
          title="Mute Audio"
        >
          <VolumeX className="w-4 h-4 text-amber-400" />
          <span className="text-[9px] uppercase font-bold tracking-wider">Mute</span>
        </motion.button>
      </div>

      {/* 2.5 Hardware & TV Status Banner */}
      <div className="w-full flex items-center justify-between px-2.5 py-1 mb-1 rounded-xl bg-slate-900/60 border border-slate-800/60 text-[10px] flex-shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse flex-shrink-0" />
          <span className="text-slate-300 font-mono truncate text-[9.5px]">
            Wi-Fi Direct • {activeDevice.ipAddress}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isPlaying || detectedMediaState === 'playing'
                ? 'bg-amber-400 animate-ping'
                : 'bg-emerald-400'
            }`}
          />
          <span className="text-slate-400 text-[9px] font-mono uppercase tracking-wider">
            {isPlaying || detectedMediaState === 'playing' ? 'Playing' : 'Standby'}
          </span>
        </div>
      </div>

      {/* 3. Media Controls Bar: 10s Rev, SMART PLAY/PAUSE DYNAMIC BUTTON, 10s Fwd */}
      <div className="grid grid-cols-4 gap-2 my-1 flex-shrink-0">
        <motion.button
          id="btn-media-rewind"
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => handlePress('KEYCODE_MEDIA_REWIND', 'standard', 'light')}
          className="h-10 rounded-xl bg-slate-800/90 hover:bg-slate-700 active:bg-cyan-500/20 text-slate-300 hover:text-white border border-slate-700/80 flex items-center justify-center gap-1 shadow-sm cursor-pointer"
          title="Rewind 10 Seconds"
        >
          <Rewind className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[9px] font-bold uppercase tracking-wider">10s</span>
        </motion.button>

        {/* Dynamic Smart Play/Pause Button - Changes dynamically to Pause when playing so user can pause whenever desired */}
        <motion.button
          id="btn-media-smart-play-pause"
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.94 }}
          onClick={handlePlayPauseToggle}
          className={`col-span-2 h-10 rounded-xl flex items-center justify-center gap-2 border font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer transition-all duration-200 ${
            isPlaying || detectedMediaState === 'playing'
              ? 'bg-gradient-to-r from-amber-500/25 to-amber-600/30 text-amber-300 border-amber-400/80 shadow-[0_0_14px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/50'
              : 'bg-gradient-to-r from-cyan-500/25 to-blue-600/30 text-cyan-300 border-cyan-400/80 shadow-[0_0_14px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400/50'
          }`}
          title={isPlaying || detectedMediaState === 'playing' ? "Click to Pause TV playback" : "Click to Play on TV"}
        >
          {isPlaying || detectedMediaState === 'playing' ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
              </span>
              <Pause className="w-4 h-4 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current ml-0.5" />
              <span>Play</span>
            </>
          )}
        </motion.button>

        <motion.button
          id="btn-media-forward"
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => handlePress('KEYCODE_MEDIA_FAST_FORWARD', 'standard', 'light')}
          className="h-10 rounded-xl bg-slate-800/90 hover:bg-slate-700 active:bg-cyan-500/20 text-slate-300 hover:text-white border border-slate-700/80 flex items-center justify-center gap-1 shadow-sm cursor-pointer"
          title="Fast Forward 10 Seconds"
        >
          <span className="text-[9px] font-bold uppercase tracking-wider">10s</span>
          <FastForward className="w-3.5 h-3.5 text-cyan-400" />
        </motion.button>
      </div>

      {/* 4. Volume & Voice Row: Vol-, Voice, Vol+ */}
      <div className="grid grid-cols-3 gap-2 my-1 flex-shrink-0">
        <motion.button
          id="btn-vol-down"
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => handlePress('KEYCODE_VOLUME_DOWN', 'standard', 'light')}
          className="h-10 rounded-xl bg-slate-800/90 hover:bg-slate-700 active:bg-cyan-500/20 text-slate-200 hover:text-white border border-slate-700/80 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          title="Volume Down"
        >
          <Minus className="w-4 h-4 text-slate-400" />
          <span className="text-[9px] uppercase font-bold tracking-wider">VOL -</span>
        </motion.button>

        <motion.button
          id="btn-voice-assistant"
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => handlePress('KEYCODE_VOICE_ASSIST', 'ok', 'medium')}
          className="h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold border border-cyan-300/40 shadow-[0_3px_12px_rgba(6,182,212,0.35)] flex items-center justify-center gap-1.5 cursor-pointer"
          title="Voice Assistant / Search"
        >
          <Mic className="w-4 h-4 text-slate-950" />
          <span className="text-[9px] uppercase font-bold tracking-wider">Voice</span>
        </motion.button>

        <motion.button
          id="btn-vol-up"
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => handlePress('KEYCODE_VOLUME_UP', 'standard', 'light')}
          className="h-10 rounded-xl bg-slate-800/90 hover:bg-slate-700 active:bg-cyan-500/20 text-slate-200 hover:text-white border border-slate-700/80 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          title="Volume Up"
        >
          <Plus className="w-4 h-4 text-slate-400" />
          <span className="text-[9px] uppercase font-bold tracking-wider">VOL +</span>
        </motion.button>
      </div>

      {/* 5. Mode Switcher Tabs: Quick Apps / D-Pad / Touch / All Apps */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-2xl border border-slate-800/90 my-1 flex-shrink-0">
        <button
          id="tab-btn-myapps"
          type="button"
          onClick={() => onUpdateSettings({ activeTab: 'myapps' })}
          className={`py-1.5 rounded-xl flex flex-col items-center transition-all cursor-pointer ${
            settings.activeTab === 'myapps'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 mb-0.5 text-cyan-400" />
          <span className="text-[9px] font-bold">Quick Apps</span>
        </button>

        <button
          id="tab-btn-dpad"
          type="button"
          onClick={() => onUpdateSettings({ activeTab: 'dpad' })}
          className={`py-1.5 rounded-xl flex flex-col items-center transition-all cursor-pointer ${
            settings.activeTab === 'dpad'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5 mb-0.5" />
          <span className="text-[9px] font-bold">D-Pad</span>
        </button>

        <button
          id="tab-btn-touchpad"
          type="button"
          onClick={() => onUpdateSettings({ activeTab: 'touchpad' })}
          className={`py-1.5 rounded-xl flex flex-col items-center transition-all cursor-pointer ${
            settings.activeTab === 'touchpad'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MousePointer className="w-3.5 h-3.5 mb-0.5" />
          <span className="text-[9px] font-bold">Touch</span>
        </button>

        <button
          id="tab-btn-apps"
          type="button"
          onClick={() => onUpdateSettings({ activeTab: 'apps' })}
          className={`py-1.5 rounded-xl flex flex-col items-center transition-all cursor-pointer ${
            settings.activeTab === 'apps'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Grid className="w-3.5 h-3.5 mb-0.5" />
          <span className="text-[9px] font-bold">All Apps</span>
        </button>
      </div>

      {/* 6. Dynamic Center Content Surface - Expands to fill available vertical space */}
      <div className="flex-1 min-h-0 w-full flex flex-col my-1 overflow-hidden">
        {/* Tab 1: Quick Apps (Per-TV shortcuts) */}
        {settings.activeTab === 'myapps' && (
          <MyAppsManager
            shortcuts={shortcuts}
            installedApps={installedApps}
            onLaunchShortcut={onLaunchShortcut}
            onUpdateShortcuts={onUpdateShortcuts}
            onNavigateToAppsTab={() => onUpdateSettings({ activeTab: 'apps' })}
            soundEnabled={settings.sound}
            hapticsEnabled={settings.haptics}
          />
        )}

        {/* Tab 2: D-Pad Navigation */}
        {settings.activeTab === 'dpad' && (
          <div className="w-full h-full flex flex-col items-center justify-between">
            <div className="flex-1 flex items-center justify-center">
              <DPadControl
                onDirectionPress={(dir) => handlePress(dir, 'nav', 'light')}
                onSelectPress={() => handlePress('KEYCODE_DPAD_CENTER', 'ok', 'medium')}
                soundEnabled={settings.sound}
                hapticsEnabled={settings.haptics}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 w-full pt-1">
              <motion.button
                id="btn-nav-back"
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={() => handlePress('KEYCODE_BACK', 'standard', 'light')}
                className="h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:bg-cyan-500/20 border border-slate-700 flex items-center justify-center gap-1.5 text-slate-300 hover:text-white cursor-pointer"
                title="Back to Previous Screen"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-[10px] uppercase font-bold tracking-wider">Back</span>
              </motion.button>

              <motion.button
                id="btn-nav-home"
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={() => handlePress('KEYCODE_HOME', 'ok', 'medium')}
                className="h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:bg-cyan-500/20 border border-slate-700 flex items-center justify-center gap-1.5 text-slate-300 hover:text-white cursor-pointer"
                title="Return to TV Home Screen"
              >
                <Home className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[10px] uppercase font-bold tracking-wider">Home</span>
              </motion.button>
            </div>
          </div>
        )}

        {/* Tab 3: Touchpad Navigation */}
        {settings.activeTab === 'touchpad' && (
          <div className="w-full h-full flex flex-col items-center justify-between">
            <div className="flex-1 w-full flex items-center justify-center">
              <TrackpadControl
                onSwipe={(dir) => handlePress(dir, 'nav', 'light')}
                onTap={() => handlePress('KEYCODE_DPAD_CENTER', 'ok', 'medium')}
                soundEnabled={settings.sound}
                hapticsEnabled={settings.haptics}
                sensitivity={settings.touchpadSensitivity}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 w-full pt-1">
              <motion.button
                id="btn-touch-back"
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={() => handlePress('KEYCODE_BACK', 'standard', 'light')}
                className="h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:bg-cyan-500/20 border border-slate-700 flex items-center justify-center gap-1.5 text-slate-300 hover:text-white cursor-pointer"
                title="Back"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-[10px] uppercase font-bold tracking-wider">Back</span>
              </motion.button>

              <motion.button
                id="btn-touch-home"
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={() => handlePress('KEYCODE_HOME', 'ok', 'medium')}
                className="h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:bg-cyan-500/20 border border-slate-700 flex items-center justify-center gap-1.5 text-slate-300 hover:text-white cursor-pointer"
                title="Home Launcher"
              >
                <Home className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[10px] uppercase font-bold tracking-wider">Home</span>
              </motion.button>
            </div>
          </div>
        )}

        {/* Tab 4: All Apps (TV's real installed apps + Official Store + Pull from TV) */}
        {settings.activeTab === 'apps' && (
          <AppLauncherDock
            activeDevice={activeDevice}
            installedApps={installedApps}
            shortcuts={shortcuts}
            onLaunchApp={onLaunchApp}
            onAddAppToShortcuts={onAddAppToShortcuts}
            onRemoveAppFromShortcuts={onRemoveAppFromShortcuts}
            onRefreshAppsFromTv={onRefreshAppsFromTv}
            isRefreshingApps={isRefreshingApps}
            onAddCustomApp={onAddCustomApp}
            soundEnabled={settings.sound}
            hapticsEnabled={settings.haptics}
          />
        )}
      </div>

      {/* 7. Collapsible "Other TV Options" Drawer */}
      <div className="mt-1 pt-1 border-t border-slate-800/80 flex-shrink-0">
        <button
          type="button"
          id="btn-toggle-other-tv-options"
          onClick={() => setShowOtherTvOptions(!showOtherTvOptions)}
          className="w-full py-1.5 px-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 active:bg-slate-900 border border-slate-800 text-[11px] font-semibold text-slate-400 hover:text-slate-200 flex items-center justify-between transition-colors cursor-pointer group"
        >
          <span className="flex items-center gap-1.5 group-hover:text-cyan-400 transition-colors">
            <Tv className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
            <span>Other TV options</span>
          </span>
          <div className="flex items-center gap-1 text-[10px] text-slate-500">
            <span>{showOtherTvOptions ? 'Hide' : 'Show'}</span>
            {showOtherTvOptions ? (
              <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            )}
          </div>
        </button>

        <AnimatePresence>
          {showOtherTvOptions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-y-auto max-h-[195px] pt-2 space-y-2 pr-0.5 custom-scrollbar"
            >
              {/* Channels & Live TV */}
              <div>
                <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-500 block mb-1">
                  Channels & Inputs
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  <motion.button
                    id="btn-ch-up-drawer"
                    type="button"
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handlePress('KEYCODE_CHANNEL_UP', 'standard', 'light')}
                    className="h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:bg-cyan-500/20 border border-slate-700 flex flex-col items-center justify-center text-slate-200 cursor-pointer"
                    title="Channel Up"
                  >
                    <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-[8px] uppercase font-bold">CH +</span>
                  </motion.button>

                  <motion.button
                    id="btn-ch-down-drawer"
                    type="button"
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handlePress('KEYCODE_CHANNEL_DOWN', 'standard', 'light')}
                    className="h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:bg-cyan-500/20 border border-slate-700 flex flex-col items-center justify-center text-slate-200 cursor-pointer"
                    title="Channel Down"
                  >
                    <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-[8px] uppercase font-bold">CH -</span>
                  </motion.button>

                  <motion.button
                    id="btn-input-source-drawer"
                    type="button"
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handlePress('KEYCODE_TV_INPUT', 'switch', 'light')}
                    className="h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:bg-cyan-500/20 border border-slate-700 flex flex-col items-center justify-center text-slate-200 cursor-pointer"
                    title="Source / Input Selector"
                  >
                    <Cable className="w-3.5 h-3.5 text-slate-300" />
                    <span className="text-[8px] uppercase font-bold">Input</span>
                  </motion.button>

                  <motion.button
                    id="btn-live-tv-drawer"
                    type="button"
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handlePress('KEYCODE_TV_INPUT', 'switch', 'light')}
                    className="h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:bg-cyan-500/20 border border-slate-700 flex flex-col items-center justify-center text-slate-200 cursor-pointer"
                    title="Live TV / Cable Antenna"
                  >
                    <Radio className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-[8px] uppercase font-bold">Live TV</span>
                  </motion.button>
                </div>
              </div>

              {/* System Controls */}
              <div>
                <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-500 block mb-1">
                  System Controls
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  <motion.button
                    id="btn-nav-recents-drawer"
                    type="button"
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handlePress('KEYCODE_APP_SWITCH', 'standard', 'light')}
                    className="h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:bg-cyan-500/20 border border-slate-700 flex flex-col items-center justify-center text-slate-200 cursor-pointer"
                    title="Recent Apps / Task Switcher"
                  >
                    <Layers className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-[8px] uppercase font-bold">Recents</span>
                  </motion.button>

                  <motion.button
                    id="btn-nav-settings-drawer"
                    type="button"
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handlePress('KEYCODE_SETTINGS', 'standard', 'light')}
                    className="h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:bg-cyan-500/20 border border-slate-700 flex flex-col items-center justify-center text-slate-200 cursor-pointer"
                    title="TV Settings Menu"
                  >
                    <SettingsIcon className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[8px] uppercase font-bold">TV Set</span>
                  </motion.button>

                  <motion.button
                    id="btn-cc-subtitles-drawer"
                    type="button"
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handlePress('KEYCODE_CAPTIONS', 'standard', 'light')}
                    className="h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:bg-cyan-500/20 border border-slate-700 flex flex-col items-center justify-center text-slate-200 cursor-pointer"
                    title="Closed Captions / Subtitles Toggle"
                  >
                    <Subtitles className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[8px] uppercase font-bold">Subtitle</span>
                  </motion.button>

                  <button
                    type="button"
                    onClick={() => setShowNumericInDrawer(!showNumericInDrawer)}
                    className={`h-9 rounded-xl border flex flex-col items-center justify-center transition-colors cursor-pointer ${
                      showNumericInDrawer
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50'
                        : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700'
                    }`}
                    title="Toggle Numeric Numpad"
                  >
                    <Hash className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-[8px] uppercase font-bold">Numbers</span>
                  </button>
                </div>
              </div>

              {/* Custom Buttons */}
              {customButtons.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-500">
                      Custom Macros
                    </span>
                    <button
                      type="button"
                      onClick={onAddCustomClick}
                      className="text-[9px] text-cyan-400 hover:underline cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {customButtons.map((btn) => (
                      <motion.button
                        key={btn.id}
                        type="button"
                        whileTap={{ scale: 0.93 }}
                        onClick={() => onTriggerCustomButton(btn)}
                        className="px-2 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-[10px] font-semibold text-slate-200 truncate flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-sm"
                        title={btn.description || btn.label}
                      >
                        <Sparkles className="w-2.5 h-2.5 text-cyan-400 flex-shrink-0" />
                        <span className="truncate">{btn.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Numeric 0-9 Numpad if opened */}
              {showNumericInDrawer && (
                <div className="pt-2 border-t border-slate-800">
                  <NumpadControl
                    onKeycodePress={(code) => handlePress(code, 'standard', 'light')}
                    soundEnabled={settings.sound}
                    hapticsEnabled={settings.haptics}
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* USB Drives & Media Devices Modal */}
      <USBDriveModal
        isOpen={isUsbModalOpen}
        onClose={() => setIsUsbModalOpen(false)}
        activeDevice={activeDevice}
      />
    </div>
  );
};
