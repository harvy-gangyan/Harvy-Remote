import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Plus,
  Tv,
  Radio,
  Subtitles,
  Layers,
  FastForward,
  Moon,
  PowerOff,
  Flame,
  Sliders,
  Volume2,
  Gamepad2,
  Sparkles,
  Terminal,
  Zap,
  Film,
  Music,
  Shield,
  Play,
  Clock,
  Pencil,
  Trash2,
} from 'lucide-react';
import { CustomButton } from '../types';
import { playRemoteClick } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';

interface CustomButtonsGridProps {
  buttons: CustomButton[];
  onTriggerButton: (button: CustomButton) => void;
  onAddClick: () => void;
  onEditClick: (button: CustomButton) => void;
  onDeleteClick: (buttonId: string) => void;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
}

const iconRegistry: Record<string, React.ElementType> = {
  Tv,
  Radio,
  Subtitles,
  Layers,
  FastForward,
  Moon,
  PowerOff,
  Flame,
  Sliders,
  Volume2,
  Gamepad2,
  Sparkles,
  Terminal,
  Zap,
  Film,
  Music,
  Shield,
  Play,
  Clock,
};

const COLOR_CLASSES: Record<
  CustomButton['color'],
  { border: string; bg: string; text: string; glow: string; badge: string }
> = {
  indigo: {
    border: 'border-indigo-500/50 hover:border-indigo-400',
    bg: 'bg-indigo-950/40 hover:bg-indigo-900/60',
    text: 'text-indigo-400',
    glow: 'shadow-indigo-500/20',
    badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  },
  cyan: {
    border: 'border-cyan-500/50 hover:border-cyan-400',
    bg: 'bg-cyan-950/40 hover:bg-cyan-900/60',
    text: 'text-cyan-400',
    glow: 'shadow-cyan-500/20',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  },
  amber: {
    border: 'border-amber-500/50 hover:border-amber-400',
    bg: 'bg-amber-950/40 hover:bg-amber-900/60',
    text: 'text-amber-400',
    glow: 'shadow-amber-500/20',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  emerald: {
    border: 'border-emerald-500/50 hover:border-emerald-400',
    bg: 'bg-emerald-950/40 hover:bg-emerald-900/60',
    text: 'text-emerald-400',
    glow: 'shadow-emerald-500/20',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  rose: {
    border: 'border-rose-500/50 hover:border-rose-400',
    bg: 'bg-rose-950/40 hover:bg-rose-900/60',
    text: 'text-rose-400',
    glow: 'shadow-rose-500/20',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  },
  purple: {
    border: 'border-purple-500/50 hover:border-purple-400',
    bg: 'bg-purple-950/40 hover:bg-purple-900/60',
    text: 'text-purple-400',
    glow: 'shadow-purple-500/20',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  orange: {
    border: 'border-orange-500/50 hover:border-orange-400',
    bg: 'bg-orange-950/40 hover:bg-orange-900/60',
    text: 'text-orange-400',
    glow: 'shadow-orange-500/20',
    badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  },
  slate: {
    border: 'border-slate-600/50 hover:border-slate-400',
    bg: 'bg-slate-800/50 hover:bg-slate-700/60',
    text: 'text-slate-300',
    glow: 'shadow-slate-500/20',
    badge: 'bg-slate-700/40 text-slate-300 border-slate-600/40',
  },
};

export const CustomButtonsGrid: React.FC<CustomButtonsGridProps> = ({
  buttons,
  onTriggerButton,
  onAddClick,
  onEditClick,
  onDeleteClick,
  soundEnabled,
  hapticsEnabled,
}) => {
  const [isManageMode, setIsManageMode] = useState(false);

  const handlePress = (button: CustomButton) => {
    if (isManageMode) return;
    if (soundEnabled) playRemoteClick('standard');
    if (hapticsEnabled) triggerHaptic(button.actionType === 'macro' ? 'medium' : 'light');
    onTriggerButton(button);
  };

  return (
    <div className="w-full flex flex-col p-2">
      {/* Header with Title and Mode Actions */}
      <div className="flex items-center justify-between px-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Custom Buttons ({buttons.length})
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-medium">
            Ad-Free
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsManageMode(!isManageMode)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              isManageMode
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {isManageMode ? 'Done' : 'Manage'}
          </button>

          <button
            id="btn-add-custom"
            type="button"
            onClick={onAddClick}
            className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 text-xs font-semibold flex items-center gap-1 transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Grid of Custom Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
        {buttons.map((btn) => {
          const IconComp = iconRegistry[btn.iconName] || Tv;
          const styling = COLOR_CLASSES[btn.color] || COLOR_CLASSES.indigo;

          return (
            <motion.div
              key={btn.id}
              whileTap={!isManageMode ? { scale: 0.95 } : undefined}
              className={`relative p-3 rounded-xl border ${styling.border} ${styling.bg} shadow-md ${styling.glow} transition-all flex flex-col justify-between group overflow-hidden ${
                !isManageMode ? 'cursor-pointer active:brightness-125' : ''
              }`}
              onClick={() => handlePress(btn)}
            >
              {/* Top row: Icon & Type Tag */}
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${styling.text} bg-slate-900/60 border border-slate-700/50 shadow-inner`}
                >
                  <IconComp className="w-4 h-4" />
                </div>

                <span
                  className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded border ${styling.badge}`}
                >
                  {btn.actionType === 'macro'
                    ? `Macro (${btn.macroSteps?.length || 0})`
                    : btn.actionType}
                </span>
              </div>

              {/* Label & Description */}
              <div>
                <h4 className="text-xs font-bold text-slate-100 truncate group-hover:text-white">
                  {btn.label}
                </h4>
                {btn.description && (
                  <p className="text-[10px] text-slate-400 truncate mt-0.5 opacity-80">
                    {btn.description}
                  </p>
                )}
              </div>

              {/* Manage Overlay / Actions */}
              {isManageMode && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-[2px] flex items-center justify-center gap-2 p-2 z-10 animate-in fade-in">
                  <button
                    type="button"
                    title="Edit button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditClick(btn);
                    }}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Delete button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteClick(btn.id);
                    }}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950 text-rose-400 border border-slate-700 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}

        {/* Empty state card or quick add helper */}
        {buttons.length === 0 && (
          <div className="col-span-full py-8 text-center bg-slate-900/40 rounded-xl border border-dashed border-slate-700">
            <Sparkles className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-300">No custom buttons yet</p>
            <p className="text-xs text-slate-500 mt-1">Create HDMI shortcuts, late night volume macros, or app triggers.</p>
            <button
              type="button"
              onClick={onAddClick}
              className="mt-3 px-4 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Button</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
