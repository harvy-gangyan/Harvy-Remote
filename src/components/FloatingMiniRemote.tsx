import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Power,
  VolumeX,
  Volume1,
  Volume2,
  Usb,
  Maximize2,
  Check,
  ChevronDown,
  X,
  Play,
  Pause,
  GripHorizontal,
  Home,
} from 'lucide-react';
import { TVDevice, RemoteSettings } from '../types';
import { USBDriveModal } from './USBDriveModal';
import { playRemoteClick } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import { RemoteService } from '../utils/remoteService';

interface FloatingMiniRemoteProps {
  devices: TVDevice[];
  activeDevice: TVDevice | null;
  onSelectDevice: (device: TVDevice) => void;
  onKeycodePress: (keycode: string) => void;
  onExpand: () => void;
  onClose?: () => void;
  onOpenUsb?: () => void;
  settings: RemoteSettings;
  ledActive: boolean;
  isPiPMode?: boolean;
}

export const FloatingMiniRemote: React.FC<FloatingMiniRemoteProps> = ({
  devices,
  activeDevice,
  onSelectDevice,
  onKeycodePress,
  onExpand,
  onClose,
  onOpenUsb,
  settings,
  ledActive,
  isPiPMode = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [detectedMediaState, setDetectedMediaState] = useState<'playing' | 'paused' | 'stopped' | 'unknown'>('unknown');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUsbModalOpen, setIsUsbModalOpen] = useState(false);

  // Active TV media playback state sync
  useEffect(() => {
    let isMounted = true;
    const checkState = async () => {
      if (!activeDevice) return;
      try {
        const state = await RemoteService.getInstance().queryMediaPlaybackState(activeDevice);
        if (!isMounted) return;
        setDetectedMediaState(state);
        if (state === 'playing') setIsPlaying(true);
        else if (state === 'paused' || state === 'stopped') setIsPlaying(false);
      } catch {
        // ignore
      }
    };
    checkState();
    const interval = setInterval(checkState, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeDevice]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePress = (
    keycode: string,
    soundType: 'standard' | 'power' | 'nav' | 'ok' | 'switch' = 'standard',
    hapticType: 'light' | 'medium' | 'heavy' = 'light'
  ) => {
    if (settings.sound) playRemoteClick(soundType);
    if (settings.haptics) triggerHaptic(hapticType);
    onKeycodePress(keycode);
  };

  const handlePlayPause = () => {
    setIsPlaying((prev) => !prev);
    handlePress('KEYCODE_MEDIA_PLAY_PAUSE', 'ok', 'medium');
  };

  const handleUsbClick = () => {
    if (onOpenUsb) {
      onOpenUsb();
    } else {
      setIsUsbModalOpen(true);
    }
  };

  const content = (
    <div
      className={`bg-[#070b13] text-slate-100 flex flex-col justify-between select-none box-border overflow-hidden ${
        isPiPMode
          ? 'w-full h-full p-1.5 rounded-none border-0'
          : 'w-[210px] h-[270px] p-2.5 rounded-3xl border border-cyan-500/30 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.85)]'
      }`}
    >
      {/* 1. Header: TV Status/Switch, Expand, Close */}
      <div className="flex items-center justify-between pb-1 mb-0.5 border-b border-slate-800/80 flex-shrink-0 h-7">
        {/* TV Selector */}
        <div className="relative min-w-0 flex-1 mr-1" ref={dropdownRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsDropdownOpen(!isDropdownOpen);
            }}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/60 transition-colors cursor-pointer min-w-0 max-w-full text-left"
            title="Switch TV"
          >
            <div
              className={`w-2 h-2 rounded-full flex-shrink-0 transition-all ${
                ledActive
                  ? 'bg-cyan-400 shadow-[0_0_6px_#38bdf8] scale-125'
                  : 'bg-emerald-500 shadow-[0_0_3px_rgba(16,185,129,0.5)]'
              }`}
            />
            <span className="text-[10px] font-bold text-white truncate min-w-0 max-w-[80px]">
              {activeDevice?.name || 'TV'}
            </span>
            <ChevronDown className="w-2.5 h-2.5 text-slate-400 ml-auto flex-shrink-0" />
          </button>

          {/* Quick TV Popover */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-44 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl z-50 overflow-hidden py-1">
              <div className="px-2 py-0.5 text-[8px] uppercase font-bold text-slate-400 border-b border-slate-800">
                Connected TVs
              </div>
              <div className="max-h-32 overflow-y-auto">
                {devices.map((dev) => {
                  const isCur = activeDevice ? dev.id === activeDevice.id : false;
                  return (
                    <button
                      key={dev.id}
                      type="button"
                      onClick={() => {
                        onSelectDevice(dev);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-2 py-1 text-left text-[11px] flex items-center justify-between hover:bg-slate-800 transition-colors cursor-pointer ${
                        isCur ? 'bg-cyan-500/15 text-cyan-300 font-bold' : 'text-slate-200'
                      }`}
                    >
                      <span className="truncate">{dev.name}</span>
                      {isCur && <Check className="w-3 h-3 text-cyan-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Action Controls: Expand to Full, Close App */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            id="btn-expand-full-remote"
            onClick={(e) => {
              e.stopPropagation();
              onExpand();
            }}
            title="Expand to Full Remote"
            className="p-1 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-95 text-slate-950 transition-all flex items-center justify-center cursor-pointer shadow-sm"
          >
            <Maximize2 className="w-3 h-3 stroke-[2.5]" />
          </button>

          {onClose && (
            <button
              type="button"
              id="btn-mini-close-app"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              title="Close Remote"
              className="p-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 active:scale-95 text-rose-300 border border-rose-500/40 transition-all cursor-pointer shadow-sm"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Three Flexible Rows - Uses grid with flex-1 so all 3 rows scale automatically to fit PiP */}
      <div className="flex-1 min-h-0 flex flex-col justify-between gap-1 py-0.5">
        {/* Row 1: Power (Red), USB (Cyan), Home (Amber) */}
        <div className="grid grid-cols-3 gap-1 flex-1 min-h-0">
          {/* Power */}
          <motion.button
            id="btn-mini-power"
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => handlePress('KEYCODE_POWER', 'power', 'heavy')}
            className="h-full min-h-0 rounded-xl bg-gradient-to-b from-red-600 to-red-700 hover:from-red-500 text-white flex items-center justify-center shadow-[0_2px_8px_rgba(220,38,38,0.4)] border border-red-500/50 cursor-pointer"
            title="Power"
          >
            <Power className="w-4 h-4 sm:w-5 sm:h-5 drop-shadow" />
          </motion.button>

          {/* USB */}
          <motion.button
            id="btn-mini-usb"
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={handleUsbClick}
            className="h-full min-h-0 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-cyan-400 border border-cyan-500/40 flex items-center justify-center cursor-pointer shadow-sm"
            title="USB Storage"
          >
            <Usb className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
          </motion.button>

          {/* Home Screen */}
          <motion.button
            id="btn-mini-home"
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => handlePress('KEYCODE_HOME', 'ok', 'medium')}
            className="h-full min-h-0 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-amber-400 border border-slate-700/80 flex items-center justify-center cursor-pointer shadow-sm"
            title="TV Home Screen"
          >
            <Home className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
          </motion.button>
        </div>

        {/* Row 2: Smart Play / Pause Dynamic Button */}
        <div className="flex-1 min-h-0">
          <motion.button
            id="btn-mini-smart-play-pause"
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={() => {
              const nextState = !isPlaying;
              setIsPlaying(nextState);
              handlePress(nextState ? 'KEYCODE_MEDIA_PLAY' : 'KEYCODE_MEDIA_PAUSE');
            }}
            className={`w-full h-full min-h-0 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all border font-bold text-xs uppercase tracking-wider shadow-sm ${
              isPlaying || detectedMediaState === 'playing'
                ? 'bg-gradient-to-r from-amber-500/25 to-amber-600/30 text-amber-300 border-amber-400/80 shadow-[0_0_12px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/50'
                : 'bg-gradient-to-r from-cyan-500/25 to-blue-600/30 text-cyan-300 border-cyan-400/80 shadow-[0_0_12px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400/50'
            }`}
            title={isPlaying || detectedMediaState === 'playing' ? "Pause playback" : "Play playback"}
          >
            {isPlaying || detectedMediaState === 'playing' ? (
              <>
                <Pause className="w-4 h-4 fill-current text-amber-400" />
                <span className="text-[11px] font-bold">Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current text-cyan-400 ml-0.5" />
                <span className="text-[11px] font-bold">Play</span>
              </>
            )}
          </motion.button>
        </div>

        {/* Row 3: Volume Up, Volume Down, Mute */}
        <div className="grid grid-cols-3 gap-1 flex-1 min-h-0">
          {/* Volume Up */}
          <motion.button
            id="btn-mini-volup"
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => handlePress('KEYCODE_VOLUME_UP', 'standard', 'light')}
            className="h-full min-h-0 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-100 border border-slate-700/80 flex items-center justify-center cursor-pointer shadow-sm"
            title="Volume Up"
          >
            <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-300" />
          </motion.button>

          {/* Volume Down */}
          <motion.button
            id="btn-mini-voldown"
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => handlePress('KEYCODE_VOLUME_DOWN', 'standard', 'light')}
            className="h-full min-h-0 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-100 border border-slate-700/80 flex items-center justify-center cursor-pointer shadow-sm"
            title="Volume Down"
          >
            <Volume1 className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300" />
          </motion.button>

          {/* Mute */}
          <motion.button
            id="btn-mini-mute-row3"
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => handlePress('KEYCODE_VOLUME_MUTE', 'standard', 'medium')}
            className="h-full min-h-0 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-amber-400 border border-slate-700/80 flex items-center justify-center cursor-pointer shadow-sm"
            title="Mute Audio"
          >
            <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
          </motion.button>
        </div>
      </div>

      {/* Subtle Drag Handle (only when in-app floating, never in native Android PiP) */}
      {!isPiPMode && (
        <div className="pt-0.5 flex items-center justify-center text-slate-600 text-[8px] gap-1 cursor-grab active:cursor-grabbing border-t border-slate-800/60 flex-shrink-0">
          <GripHorizontal className="w-3 h-3 text-slate-500" />
          <span className="font-mono">drag remote</span>
        </div>
      )}

      {/* USB Drive Modal */}
      {isUsbModalOpen && activeDevice && (
        <USBDriveModal
          isOpen={isUsbModalOpen}
          onClose={() => setIsUsbModalOpen(false)}
          activeDevice={activeDevice}
          onSendFeedback={(msg) => console.log(msg)}
        />
      )}
    </div>
  );

  // In native PiP mode, render directly so it fills the PiP window perfectly
  if (isPiPMode) {
    return content;
  }

  // In standard in-app floating mode, wrap with Framer Motion drag
  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="pointer-events-auto cursor-grab active:cursor-grabbing fixed right-4 bottom-6 z-50"
    >
      {content}
    </motion.div>
  );
};
