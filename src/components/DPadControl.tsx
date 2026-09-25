import React from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { playRemoteClick } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';

interface DPadControlProps {
  onDirectionPress: (direction: 'KEYCODE_DPAD_UP' | 'KEYCODE_DPAD_DOWN' | 'KEYCODE_DPAD_LEFT' | 'KEYCODE_DPAD_RIGHT') => void;
  onSelectPress: () => void;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  disabled?: boolean;
}

export const DPadControl: React.FC<DPadControlProps> = ({
  onDirectionPress,
  onSelectPress,
  soundEnabled,
  hapticsEnabled,
  disabled = false,
}) => {
  const handleDir = (
    dir: 'KEYCODE_DPAD_UP' | 'KEYCODE_DPAD_DOWN' | 'KEYCODE_DPAD_LEFT' | 'KEYCODE_DPAD_RIGHT'
  ) => {
    if (disabled) return;
    if (soundEnabled) playRemoteClick('nav');
    if (hapticsEnabled) triggerHaptic('light');
    onDirectionPress(dir);
  };

  const handleSelect = () => {
    if (disabled) return;
    if (soundEnabled) playRemoteClick('ok');
    if (hapticsEnabled) triggerHaptic('medium');
    onSelectPress();
  };

  return (
    <div className="relative flex items-center justify-center p-1 select-none">
      {/* Outer D-Pad Disc with metallic chamfer and dark slate finish */}
      <div className="relative w-44 h-44 sm:w-48 sm:h-48 rounded-full bg-gradient-to-b from-slate-800 via-slate-900 to-black p-1 shadow-[0_8px_24px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.15)] border border-slate-700/60 flex items-center justify-center">
        
        {/* Subtle cross texture lines */}
        <div className="absolute inset-0 rounded-full pointer-events-none overflow-hidden opacity-20">
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-gradient-to-b from-transparent via-cyan-400 to-transparent" />
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
        </div>

        {/* UP BUTTON */}
        <motion.button
          id="btn-dpad-up"
          type="button"
          aria-label="Navigate Up"
          whileTap={{ scale: 0.94 }}
          onClick={() => handleDir('KEYCODE_DPAD_UP')}
          disabled={disabled}
          className="absolute top-1.5 w-20 h-12 rounded-t-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700/40 active:bg-cyan-500/20 active:text-cyan-400 transition-colors focus:outline-none cursor-pointer"
        >
          <ChevronUp className="w-6 h-6 stroke-[2.5] drop-shadow-md" />
        </motion.button>

        {/* DOWN BUTTON */}
        <motion.button
          id="btn-dpad-down"
          type="button"
          aria-label="Navigate Down"
          whileTap={{ scale: 0.94 }}
          onClick={() => handleDir('KEYCODE_DPAD_DOWN')}
          disabled={disabled}
          className="absolute bottom-1.5 w-20 h-12 rounded-b-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700/40 active:bg-cyan-500/20 active:text-cyan-400 transition-colors focus:outline-none cursor-pointer"
        >
          <ChevronDown className="w-6 h-6 stroke-[2.5] drop-shadow-md" />
        </motion.button>

        {/* LEFT BUTTON */}
        <motion.button
          id="btn-dpad-left"
          type="button"
          aria-label="Navigate Left"
          whileTap={{ scale: 0.94 }}
          onClick={() => handleDir('KEYCODE_DPAD_LEFT')}
          disabled={disabled}
          className="absolute left-1.5 w-12 h-20 rounded-l-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700/40 active:bg-cyan-500/20 active:text-cyan-400 transition-colors focus:outline-none cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5] drop-shadow-md" />
        </motion.button>

        {/* RIGHT BUTTON */}
        <motion.button
          id="btn-dpad-right"
          type="button"
          aria-label="Navigate Right"
          whileTap={{ scale: 0.94 }}
          onClick={() => handleDir('KEYCODE_DPAD_RIGHT')}
          disabled={disabled}
          className="absolute right-1.5 w-12 h-20 rounded-r-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700/40 active:bg-cyan-500/20 active:text-cyan-400 transition-colors focus:outline-none cursor-pointer"
        >
          <ChevronRight className="w-6 h-6 stroke-[2.5] drop-shadow-md" />
        </motion.button>

        {/* CENTER "OK" / SELECT BUTTON */}
        <motion.button
          id="btn-dpad-ok"
          type="button"
          aria-label="Select OK"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.92 }}
          onClick={handleSelect}
          disabled={disabled}
          className="relative z-10 w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950 border border-slate-600/80 shadow-[0_4px_12px_rgba(0,0,0,0.6),inset_0_1px_3px_rgba(255,255,255,0.15)] flex flex-col items-center justify-center text-white active:border-cyan-400 active:shadow-[0_0_16px_rgba(6,182,212,0.4)] transition-all cursor-pointer focus:outline-none group"
        >
          <span className="font-bold text-base tracking-wider text-slate-100 group-hover:text-cyan-400 group-active:scale-95 transition-colors">
            OK
          </span>
          <span className="text-[8px] uppercase tracking-widest text-slate-400 font-mono opacity-60">
            ENTER
          </span>
        </motion.button>
      </div>
    </div>
  );
};
