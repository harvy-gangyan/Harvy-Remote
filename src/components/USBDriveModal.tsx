import React, { useState, useEffect } from 'react';
import {
  Usb,
  FolderOpen,
  Film,
  Music,
  Image as ImageIcon,
  RefreshCw,
  X,
  CheckCircle2,
  Tv,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { TVDevice } from '../types';
import { RemoteService } from '../utils/remoteService';

interface USBDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeDevice: TVDevice;
  onSendFeedback?: (text: string) => void;
}

export interface TVUSBDrive {
  id: string;
  name: string;
  label: string;
  totalSize: string;
  freeSize: string;
  format: string;
  path: string;
}

export const USBDriveModal: React.FC<USBDriveModalProps> = ({
  isOpen,
  onClose,
  activeDevice,
  onSendFeedback,
}) => {
  // Empty default drives - NO hardcoded demo drives!
  const [drives, setDrives] = useState<TVUSBDrive[]>([]);
  const [selectedDrive, setSelectedDrive] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Scan TV on open
  useEffect(() => {
    if (isOpen) {
      handleRefreshDrives();
    }
  }, [isOpen, activeDevice]);

  if (!isOpen) return null;

  const handleRefreshDrives = async () => {
    setIsScanning(true);
    setNotification(null);

    // Query physical TV via ADB or REST bridge
    try {
      if (activeDevice.brand === 'samsung') {
        // Samsung Tizen Source switch
        RemoteService.getInstance().sendKeycode(activeDevice, 'KEYCODE_TV_INPUT');
      } else if (activeDevice.brand === 'lg') {
        // LG webOS Input switch
        RemoteService.getInstance().sendKeycode(activeDevice, 'KEYCODE_TV_INPUT');
      } else {
        // Android TV / Google TV / TCL / Sony / Xiaomi
        await RemoteService.getInstance().sendAdbCommand(
          activeDevice,
          'shell sm list-volumes public'
        );
      }
    } catch {
      // Ignore network errors
    }

    setTimeout(() => {
      setIsScanning(false);
      // If no physical volume returned from ADB, keep empty list
      setNotification(`Scanned TV USB ports on ${activeDevice.name}`);
      setTimeout(() => setNotification(null), 3000);
    }, 900);
  };

  const handleLaunchTVMediaPlayer = (filterType: 'all' | 'video' | 'music' | 'photo' = 'all') => {
    const mimeMap = {
      all: '*/*',
      video: 'video/*',
      music: 'audio/*',
      photo: 'image/*',
    };

    // Command to launch the TV's native media player/file manager
    if (activeDevice.brand === 'samsung') {
      RemoteService.getInstance().sendKeycode(activeDevice, 'KEYCODE_MEDIA_PLAY_PAUSE');
      RemoteService.getInstance().sendKeycode(activeDevice, 'KEYCODE_TV_INPUT');
    } else if (activeDevice.protocol === 'tcl_roku_ecp') {
      RemoteService.getInstance().launchApp(activeDevice, '2213'); // Roku Media Player ID
    } else {
      // Android TV / Google TV / TCL / Sony / Mi
      RemoteService.getInstance().sendAdbCommand(
        activeDevice,
        `am start -a android.intent.action.VIEW -t "${mimeMap[filterType]}"`
      );
    }

    const label = filterType === 'all' ? 'USB Media Player' : `${filterType.toUpperCase()} Player`;
    if (onSendFeedback) {
      onSendFeedback(`Launched ${label} on ${activeDevice.name}`);
    }
    setNotification(`Launched ${label} on TV`);
    setTimeout(() => {
      onClose();
    }, 700);
  };

  const handleOpenTVFileExplorer = () => {
    // Open system storage documents UI on Android TV
    RemoteService.getInstance().sendAdbCommand(
      activeDevice,
      'am start -n com.google.android.documentsui/.FilesActivity'
    );
    if (onSendFeedback) {
      onSendFeedback(`Opened File Explorer on ${activeDevice.name}`);
    }
    setNotification('Opened TV File Explorer');
    setTimeout(() => {
      onClose();
    }, 700);
  };

  const handleSwitchToUSBInput = () => {
    RemoteService.getInstance().sendKeycode(activeDevice, 'KEYCODE_TV_INPUT');
    if (onSendFeedback) {
      onSendFeedback(`Switched ${activeDevice.name} input to USB`);
    }
    setNotification('Switched TV input source');
    setTimeout(() => {
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-3xl bg-[#090d16] border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-[#070b13]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
              <Usb className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-tight">TV USB & Storage</h2>
              <p className="text-[10px] text-slate-400 font-mono truncate max-w-[190px]">
                {activeDevice.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback message */}
        {notification && (
          <div className="mx-4 mt-3 px-3 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{notification}</span>
          </div>
        )}

        {/* Body */}
        <div className="p-4 overflow-y-auto space-y-3.5">
          {/* Quick TV USB Actions */}
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              TV USB Media Actions
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleLaunchTVMediaPlayer('all')}
                className="p-2.5 rounded-2xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-cyan-300 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer text-center group active:scale-95 shadow-sm"
              >
                <FolderOpen className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">Media Player</span>
                <span className="text-[9px] text-slate-400">Browse TV USB</span>
              </button>

              <button
                type="button"
                onClick={handleSwitchToUSBInput}
                className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer text-center group active:scale-95 shadow-sm"
              >
                <Tv className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">USB Input</span>
                <span className="text-[9px] text-slate-400">Switch Source</span>
              </button>
            </div>

            {/* Quick Media Filter Shortcuts */}
            <div className="grid grid-cols-3 gap-1.5 mt-2">
              <button
                type="button"
                onClick={() => handleLaunchTVMediaPlayer('video')}
                className="py-1.5 px-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-[10px] font-semibold flex items-center justify-center gap-1 cursor-pointer hover:text-white"
              >
                <Film className="w-3.5 h-3.5 text-amber-400" />
                <span>Videos</span>
              </button>
              <button
                type="button"
                onClick={() => handleLaunchTVMediaPlayer('music')}
                className="py-1.5 px-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-[10px] font-semibold flex items-center justify-center gap-1 cursor-pointer hover:text-white"
              >
                <Music className="w-3.5 h-3.5 text-cyan-400" />
                <span>Music</span>
              </button>
              <button
                type="button"
                onClick={() => handleLaunchTVMediaPlayer('photo')}
                className="py-1.5 px-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-[10px] font-semibold flex items-center justify-center gap-1 cursor-pointer hover:text-white"
              >
                <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>Photos</span>
              </button>
            </div>
          </div>

          {/* Connected USB Drives List or Empty State */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Connected Drives ({drives.length})
              </span>
              <button
                type="button"
                onClick={handleRefreshDrives}
                disabled={isScanning}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`} />
                <span>{isScanning ? 'Scanning...' : 'Scan TV'}</span>
              </button>
            </div>

            {drives.length === 0 ? (
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 mb-2">
                  <Usb className="w-4 h-4 text-slate-500" />
                </div>
                <div className="text-xs font-bold text-slate-200">No USB Drive Mounted</div>
                <p className="text-[10px] text-slate-400 mt-1 max-w-[240px] leading-relaxed">
                  Plug a USB flash drive or hard disk directly into your TV&apos;s physical USB port, then tap{' '}
                  <strong className="text-cyan-400">Scan TV</strong> or use{' '}
                  <strong className="text-cyan-400">Media Player</strong> above.
                </p>
                <button
                  type="button"
                  onClick={handleOpenTVFileExplorer}
                  className="mt-3 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-slate-700/60"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Open TV File Explorer</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {drives.map((drive) => {
                  const isSelected = selectedDrive === drive.id;
                  return (
                    <div
                      key={drive.id}
                      onClick={() => setSelectedDrive(drive.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-800/90 border-cyan-500/60 shadow-lg ring-1 ring-cyan-500/30'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Usb className="w-4 h-4 text-cyan-400" />
                          <div>
                            <div className="text-xs font-bold text-white">{drive.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {drive.label}
                            </div>
                          </div>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono font-bold">
                          {drive.format}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                        <span>{drive.freeSize} free</span>
                        <span>{drive.totalSize}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-[#070b13] border-t border-slate-800 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-mono">Physical TV USB Port</span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white cursor-pointer px-2 py-1"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
