import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Check,
  Search,
  Sparkles,
  ArrowUpDown,
} from 'lucide-react';
import { motion } from 'motion/react';
import { AppShortcut, StreamingApp } from '../types';
import { INDIAN_STREAMING_APPS } from '../data/streamingApps';
import { playRemoteClick } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import { BrandAppIcon } from './BrandAppIcon';

interface MyAppsManagerProps {
  shortcuts: AppShortcut[];
  installedApps?: StreamingApp[];
  onLaunchShortcut: (shortcut: AppShortcut) => void;
  onUpdateShortcuts: (shortcuts: AppShortcut[]) => void;
  onNavigateToAppsTab: () => void;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
}

export const MyAppsManager: React.FC<MyAppsManagerProps> = ({
  shortcuts,
  installedApps,
  onLaunchShortcut,
  onUpdateShortcuts,
  onNavigateToAppsTab,
  soundEnabled,
  hapticsEnabled,
}) => {
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [showAddPicker, setShowAddPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const appPool = installedApps && installedApps.length > 0 ? installedApps : INDIAN_STREAMING_APPS;

  const handleLaunch = (shortcut: AppShortcut) => {
    if (isConfiguring) return;
    if (soundEnabled) playRemoteClick('switch');
    if (hapticsEnabled) triggerHaptic('medium');
    onLaunchShortcut(shortcut);
  };

  const handleDelete = (shortcutId: string) => {
    if (soundEnabled) playRemoteClick('standard');
    if (hapticsEnabled) triggerHaptic('heavy');
    const remaining = shortcuts
      .filter((s) => s.id !== shortcutId)
      .map((s, idx) => ({ ...s, priority: idx + 1 }));
    onUpdateShortcuts(remaining);
  };

  const handleAddApp = (app: StreamingApp) => {
    if (soundEnabled) playRemoteClick('ok');
    if (hapticsEnabled) triggerHaptic('medium');

    const newShortcut: AppShortcut = {
      id: `shortcut-${Date.now()}-${app.id}`,
      name: app.name,
      appId: app.id,
      packageName: app.packageName,
      color: app.color,
      iconName: app.iconName,
      priority: shortcuts.length + 1,
    };

    onUpdateShortcuts([...shortcuts, newShortcut]);
    setShowAddPicker(false);
  };

  // Drag and Drop handlers for reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${index}`);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (index: number) => {
    if (dragOverIndex === index) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    if (soundEnabled) playRemoteClick('ok');
    if (hapticsEnabled) triggerHaptic('medium');

    const reordered = [...shortcuts].sort((a, b) => a.priority - b.priority);
    const [moved] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    const reindexed = reordered.map((s, idx) => ({ ...s, priority: idx + 1 }));
    onUpdateShortcuts(reindexed);

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const availableAppsToAdd = appPool.filter(
    (app) =>
      !shortcuts.some((s) => s.appId === app.id || s.packageName === app.packageName) &&
      (app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.packageName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const sortedShortcuts = [...shortcuts].sort((a, b) => a.priority - b.priority);

  return (
    <div className="w-full h-full flex flex-col min-h-0 select-none">
      {/* Top Header Row with Reorder & Add controls */}
      <div className="flex items-center justify-between mb-2 px-1 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Quick Apps</span>
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-800 text-cyan-400 border border-slate-700">
            {shortcuts.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Reorder / Config Toggle */}
          <button
            type="button"
            onClick={() => setIsConfiguring(!isConfiguring)}
            className={`px-2 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              isConfiguring
                ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
            }`}
          >
            {isConfiguring ? (
              <>
                <Check className="w-3 h-3" />
                <span>Done</span>
              </>
            ) : (
              <>
                <ArrowUpDown className="w-3 h-3 text-cyan-400" />
                <span>Reorder</span>
              </>
            )}
          </button>

          {/* Quick Add Button */}
          <button
            type="button"
            onClick={() => setShowAddPicker(true)}
            className="px-2 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* App Buttons Scrollable Grid - Fills available vertical area */}
      <div className="flex-1 min-h-0 w-full overflow-y-auto pr-1 pb-1">
        <div className="grid grid-cols-4 gap-2.5 w-full pb-2">
          {sortedShortcuts.map((shortcut, index) => {
            const isBeingDragged = draggedIndex === index;
            const isOver = dragOverIndex === index;

            return (
              <motion.div
                key={shortcut.id}
                layout
                draggable
                onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, index)}
                onDragOver={(e) => handleDragOver(e as unknown as React.DragEvent, index)}
                onDragLeave={() => handleDragLeave(index)}
                onDrop={(e) => handleDrop(e as unknown as React.DragEvent, index)}
                onDragEnd={handleDragEnd}
                className={`relative flex flex-col items-center cursor-pointer transition-all ${
                  isBeingDragged ? 'opacity-40 scale-95' : 'opacity-100'
                } ${isOver ? 'ring-2 ring-cyan-400 rounded-2xl scale-105' : ''}`}
              >
                {/* Trash Icon Button in Corner */}
                {isConfiguring && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(shortcut.id);
                    }}
                    className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-90 text-white flex items-center justify-center shadow-lg border border-white/30 z-30 cursor-pointer transition-transform"
                    title={`Delete ${shortcut.name}`}
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                )}

                {/* App Button Tile */}
                <motion.button
                  type="button"
                  whileTap={!isConfiguring ? { scale: 0.92 } : undefined}
                  onClick={() => handleLaunch(shortcut)}
                  className={`w-full aspect-square rounded-2xl flex flex-col items-center justify-center p-1.5 bg-slate-800/90 hover:bg-slate-700/90 active:bg-slate-750 border border-slate-700/80 shadow-[0_4px_12px_rgba(0,0,0,0.5)] relative overflow-hidden transition-all group ${
                    isConfiguring
                      ? 'ring-1 ring-amber-400/60 cursor-grab active:cursor-grabbing'
                      : 'hover:border-slate-500/80 active:scale-95 cursor-pointer'
                  }`}
                  title={
                    isConfiguring
                      ? `Drag to reorder ${shortcut.name}`
                      : `Launch ${shortcut.name}`
                  }
                >
                  {/* Real Brand Vector Logo */}
                  <div className="flex items-center justify-center mb-1">
                    <BrandAppIcon appId={shortcut.appId || shortcut.name} className="w-8 h-8 drop-shadow-md" />
                  </div>

                  {/* App Name Label */}
                  <span className="text-[10px] font-bold text-slate-200 group-hover:text-white tracking-tight truncate max-w-full px-1 text-center drop-shadow-sm leading-tight">
                    {shortcut.name}
                  </span>
                </motion.button>
              </motion.div>
            );
          })}

          {/* Add App Slot button in grid */}
          {!isConfiguring && shortcuts.length < 24 && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => setShowAddPicker(true)}
              className="w-full aspect-square rounded-2xl border-2 border-dashed border-slate-700/80 hover:border-cyan-500/50 bg-slate-900/40 hover:bg-slate-800/50 flex flex-col items-center justify-center p-1.5 text-slate-500 hover:text-cyan-400 transition-all cursor-pointer"
              title="Add App to Quick Apps"
            >
              <Plus className="w-6 h-6 mb-1 text-cyan-400/80" />
              <span className="text-[10px] font-semibold">Add</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Add App Modal Popover */}
      {showAddPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl p-4 flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Plus className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Add to Quick Apps
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddPicker(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="my-2.5 relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search TV apps..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* List of Streaming Apps to Add with real logos on clean dark cards */}
            <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-56 py-1">
              {availableAppsToAdd.map((app) => {
                return (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => handleAddApp(app)}
                    className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700/80 flex flex-col items-center justify-center text-white shadow hover:scale-105 active:scale-95 transition-transform cursor-pointer relative"
                  >
                    <BrandAppIcon appId={app.id} className="w-8 h-8 mb-1.5 drop-shadow" />
                    <span className="text-[10px] font-bold text-slate-200 truncate max-w-full text-center">
                      {app.name}
                    </span>
                  </button>
                );
              })}
              {availableAppsToAdd.length === 0 && (
                <div className="col-span-3 py-6 text-center text-xs text-slate-500">
                  All available apps have been added!
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAddPicker(false)}
                className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
