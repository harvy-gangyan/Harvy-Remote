import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Check, Search, RotateCw, ShoppingBag, ExternalLink, Sparkles, X } from 'lucide-react';
import { TVDevice, StreamingApp, AppShortcut } from '../types';
import { BRAND_CONFIGS } from '../data/defaultTVs';
import { playRemoteClick } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import { BrandAppIcon } from './BrandAppIcon';

interface AppLauncherDockProps {
  activeDevice: TVDevice;
  installedApps: StreamingApp[];
  shortcuts: AppShortcut[];
  onLaunchApp: (app: StreamingApp) => void;
  onAddAppToShortcuts: (app: StreamingApp) => void;
  onRemoveAppFromShortcuts: (appId: string) => void;
  onRefreshAppsFromTv: () => Promise<void>;
  isRefreshingApps: boolean;
  onAddCustomApp: (newApp: StreamingApp) => void;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
}

export const AppLauncherDock: React.FC<AppLauncherDockProps> = ({
  activeDevice,
  installedApps,
  shortcuts,
  onLaunchApp,
  onAddAppToShortcuts,
  onRemoveAppFromShortcuts,
  onRefreshAppsFromTv,
  isRefreshingApps,
  onAddCustomApp,
  soundEnabled,
  hapticsEnabled,
}) => {
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [customAppName, setCustomAppName] = useState('');
  const [customPackageName, setCustomPackageName] = useState('');

  const shortcutAppIds = new Set(shortcuts.map((s) => s.appId));
  const brandInfo = BRAND_CONFIGS[activeDevice.brand];

  const handleLaunch = (app: StreamingApp) => {
    if (soundEnabled) playRemoteClick('switch');
    if (hapticsEnabled) triggerHaptic('medium');
    onLaunchApp(app);
  };

  const handleToggleShortcut = (e: React.MouseEvent, app: StreamingApp) => {
    e.stopPropagation();
    if (shortcutAppIds.has(app.id)) {
      if (soundEnabled) playRemoteClick('standard');
      if (hapticsEnabled) triggerHaptic('light');
      onRemoveAppFromShortcuts(app.id);
    } else {
      if (soundEnabled) playRemoteClick('ok');
      if (hapticsEnabled) triggerHaptic('medium');
      onAddAppToShortcuts(app);
    }
  };

  const handleLaunchAppStore = () => {
    if (soundEnabled) playRemoteClick('ok');
    if (hapticsEnabled) triggerHaptic('medium');

    const storeApp: StreamingApp = {
      id: 'tv_store',
      name: brandInfo?.appStoreName || 'TV App Store',
      packageName: brandInfo?.appStorePackage || 'com.android.vending',
      iconName: 'ShoppingBag',
      color: '#34A853',
      popularInIndia: true,
      category: 'utility',
    };
    onLaunchApp(storeApp);
  };

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAppName.trim()) return;

    const newApp: StreamingApp = {
      id: `custom_${Date.now()}`,
      name: customAppName.trim(),
      packageName: customPackageName.trim() || customAppName.trim().toLowerCase().replace(/\s+/g, '.'),
      iconName: 'Tv',
      color: '#06b6d4',
      popularInIndia: false,
      category: 'ott',
    };

    onAddCustomApp(newApp);
    setCustomAppName('');
    setCustomPackageName('');
    setIsAddModalOpen(false);
  };

  const filteredApps = installedApps.filter(
    (app) =>
      app.name.toLowerCase().includes(search.toLowerCase()) ||
      app.packageName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full h-full flex flex-col min-h-0 select-none">
      {/* 1. Official TV App Store Card (Play Store on Android TV, LG Store, Samsung Store, etc.) */}
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={handleLaunchAppStore}
        className="w-full mb-2 p-2.5 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-cyan-950/60 border border-emerald-500/40 hover:border-emerald-400 shadow-md cursor-pointer flex items-center justify-between group transition-all"
        title={`Open ${brandInfo?.appStoreName || 'TV App Store'} directly on TV screen`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <ShoppingBag className="w-4 h-4 text-emerald-300" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors truncate">
                {brandInfo?.appStoreName || 'Google Play Store'}
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold uppercase">
                Install on TV
              </span>
            </div>
            <span className="text-[9.5px] text-slate-400 truncate">
              Open app store to install or remove apps on {activeDevice.name}
            </span>
          </div>
        </div>
        <ExternalLink className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0 ml-1" />
      </motion.div>

      {/* 2. Controls Row: Pull Apps from TV + Add Custom App */}
      <div className="flex items-center justify-between mb-2 px-1 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
            Installed on TV
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-800 text-cyan-400 border border-slate-700">
            {installedApps.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Pull / Refresh Apps from connected TV button */}
          <button
            type="button"
            onClick={onRefreshAppsFromTv}
            disabled={isRefreshingApps}
            className="px-2 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 active:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
            title="Scan & pull installed apps from the connected TV"
          >
            <RotateCw className={`w-3 h-3 text-cyan-400 ${isRefreshingApps ? 'animate-spin' : ''}`} />
            <span>{isRefreshingApps ? 'Pulling...' : 'Pull Apps'}</span>
          </button>

          {/* Add custom app */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            title="Add a custom sideloaded app by package name"
          >
            <Plus className="w-3 h-3 text-cyan-400" />
            <span>Custom</span>
          </button>
        </div>
      </div>

      {/* 3. Search Bar */}
      <div className="relative mb-2 flex-shrink-0">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder={`Search ${activeDevice.name} apps...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8 pr-2.5 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
        />
      </div>

      {/* 4. List of Installed Apps on THIS TV */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1 pb-1">
        {filteredApps.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400 flex flex-col items-center gap-2">
            <span>No apps found matching "{search}"</span>
            <button
              type="button"
              onClick={onRefreshAppsFromTv}
              className="text-cyan-400 underline font-semibold"
            >
              Pull apps from {activeDevice.name}
            </button>
          </div>
        ) : (
          filteredApps.map((app) => {
            const isInQuickApps = shortcutAppIds.has(app.id);

            return (
              <motion.div
                key={app.id}
                id={`btn-launch-${app.id}`}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleLaunch(app)}
                className="relative flex items-center justify-between p-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 active:bg-slate-700 border border-slate-700/60 transition-all cursor-pointer text-left group overflow-hidden"
              >
                {/* Brand Logo & Name */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 shadow flex items-center justify-center">
                    <BrandAppIcon appId={app.id} className="w-7 h-7" />
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-slate-100 truncate group-hover:text-cyan-300">
                      {app.name}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono truncate">
                      {app.packageName}
                    </span>
                  </div>
                </div>

                {/* Add to Quick Apps Toggle Button */}
                <div className="flex items-center pl-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleToggleShortcut(e, app)}
                    title={
                      isInQuickApps
                        ? `Remove ${app.name} from Quick Apps`
                        : `Add ${app.name} to Quick Apps`
                    }
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      isInQuickApps
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 hover:bg-rose-950/60 hover:text-rose-300 hover:border-rose-700'
                        : 'bg-slate-700/80 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 border border-slate-600/70'
                    }`}
                  >
                    {isInQuickApps ? (
                      <>
                        <Check className="w-3 h-3 text-cyan-400" />
                        <span>Added</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3 h-3" />
                        <span>Quick App</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Modal: Add Custom / Sideloaded App */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Add Custom TV App</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustom} className="space-y-3 mt-3">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                  App Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SmartTube, Kodi, Plex"
                  value={customAppName}
                  onChange={(e) => setCustomAppName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                  Package Name / App ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. com.teamsmart.videomanager.tv"
                  value={customPackageName}
                  onChange={(e) => setCustomPackageName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                />
                <span className="text-[9px] text-slate-500 mt-1 block">
                  Leave blank to auto-generate based on app name.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold"
                >
                  Add to {activeDevice.name}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
