import React, { useState } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Vibrate,
  Sliders,
  Download,
  Upload,
  ShieldCheck,
  Trash2,
  Copy,
  Check,
} from 'lucide-react';
import { RemoteSettings, CommandLogItem, TVDevice, CustomButton, AppShortcut } from '../types';
import { RemoteService } from '../utils/remoteService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: RemoteSettings;
  onUpdateSettings: (newSettings: Partial<RemoteSettings>) => void;
  devices: TVDevice[];
  customButtons: CustomButton[];
  shortcuts: AppShortcut[];
  onImportData: (data: {
    devices?: TVDevice[];
    customButtons?: CustomButton[];
    shortcuts?: AppShortcut[];
  }) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  devices,
  customButtons,
  shortcuts,
  onImportData,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'logs' | 'backup'>('general');
  const [logs, setLogs] = useState<CommandLogItem[]>(RemoteService.getInstance().getLogs());
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClearLogs = () => {
    RemoteService.getInstance().clearLogs();
    setLogs([]);
  };

  const handleCopyLog = (item: CommandLogItem) => {
    navigator.clipboard.writeText(item.details || item.command);
    setCopiedLogId(item.id);
    setTimeout(() => setCopiedLogId(null), 1500);
  };

  const handleExport = () => {
    const data = {
      app: 'Harvy TV Remote',
      version: '2.0',
      exportedAt: new Date().toISOString(),
      devices,
      customButtons,
      shortcuts,
      settings,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `harvys-remote-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.devices || parsed.customButtons || parsed.shortcuts) {
          onImportData({
            devices: parsed.devices,
            customButtons: parsed.customButtons,
            shortcuts: parsed.shortcuts,
          });
          alert('Harvy TV Remote configuration imported successfully!');
          onClose();
        }
      } catch {
        alert('Invalid backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div>
            <h2 className="text-base font-bold text-white">Remote Settings</h2>
            <p className="text-xs text-slate-400">Tactile preferences, logs & backup</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 pt-2 gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`pb-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'general'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            General & Tactile
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('logs');
              setLogs(RemoteService.getInstance().getLogs());
            }}
            className={`pb-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'logs'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Command Logs ({logs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`pb-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'backup'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Backup & Export
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {activeTab === 'general' && (
            <div className="space-y-4">
              {/* Ad-Free Assurance Notice */}
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <h4 className="font-bold text-emerald-300">100% Ad-Free & Private</h4>
                  <p className="text-slate-300 mt-0.5">
                    Unlike Play Store remote apps that bombard you with full-screen video ads, this remote is clean, instant, runs locally over Wi-Fi, and never displays advertisements.
                  </p>
                </div>
              </div>

              {/* Sound Clicks */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-700/80 flex items-center justify-center text-cyan-400">
                    {settings.sound ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Button Audio Feedback</h4>
                    <p className="text-xs text-slate-400">Crisp mechanical click sounds</p>
                  </div>
                </div>
                <input
                  id="toggle-sound"
                  type="checkbox"
                  checked={settings.sound}
                  onChange={(e) => onUpdateSettings({ sound: e.target.checked })}
                  className="w-5 h-5 rounded text-cyan-500 bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Haptic Vibration */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-700/80 flex items-center justify-center text-cyan-400">
                    <Vibrate className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Haptic Vibration</h4>
                    <p className="text-xs text-slate-400">Tactile physical buzz on button press</p>
                  </div>
                </div>
                <input
                  id="toggle-haptics"
                  type="checkbox"
                  checked={settings.haptics}
                  onChange={(e) => onUpdateSettings({ haptics: e.target.checked })}
                  className="w-5 h-5 rounded text-cyan-500 bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Trackpad Sensitivity */}
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-semibold text-white">Touchpad Sensitivity</span>
                  </div>
                  <span className="text-xs font-mono text-cyan-400">
                    {settings.touchpadSensitivity.toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.1"
                  value={settings.touchpadSensitivity}
                  onChange={(e) =>
                    onUpdateSettings({ touchpadSensitivity: parseFloat(e.target.value) })
                  }
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>Slow & Precise</span>
                  <span>Fast Swipes</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Real-Time Dispatched Commands
                </span>
                {logs.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearLogs}
                    className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              {logs.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
                  No commands dispatched yet. Tap any button on the remote to see commands here.
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 font-mono text-xs flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-cyan-400 font-semibold">{log.command}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded ${
                              log.status === 'success'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-cyan-500/20 text-cyan-300'
                            }`}
                          >
                            {log.status}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate mt-0.5">
                          {log.details || log.targetTv}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopyLog(log)}
                        title="Copy command string"
                        className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                      >
                        {copiedLogId === log.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                <h4 className="text-sm font-semibold text-white">Export Setup</h4>
                <p className="text-xs text-slate-400">
                  Export all your saved TVs ({devices.length}) and custom buttons ({customButtons.length}) to a JSON backup file to share across your phone or family members.
                </p>
                <button
                  type="button"
                  onClick={handleExport}
                  className="mt-2 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-cyan-400" />
                  <span>Download Backup JSON</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                <h4 className="text-sm font-semibold text-white">Import Setup</h4>
                <p className="text-xs text-slate-400">
                  Restore previously exported TV configurations and custom macros.
                </p>
                <label className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer shadow-md">
                  <Upload className="w-4 h-4" />
                  <span>Choose Backup File...</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileImport}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
