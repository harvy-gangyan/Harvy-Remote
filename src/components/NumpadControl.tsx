import React from 'react';
import { motion } from 'motion/react';
import { RotateCcw, Info, Usb } from 'lucide-react';
import { playRemoteClick } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';

interface NumpadControlProps {
  onKeycodePress: (keycode: string) => void;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  disabled?: boolean;
}

export const NumpadControl: React.FC<NumpadControlProps> = ({
  onKeycodePress,
  soundEnabled,
  hapticsEnabled,
  disabled = false,
}) => {
  const handleClick = (keycode: string) => {
    if (disabled) return;
    if (soundEnabled) playRemoteClick('standard');
    if (hapticsEnabled) triggerHaptic('light');
    onKeycodePress(keycode);
  };

  const digits = [
    { num: '1', key: 'KEYCODE_1' },
    { num: '2', key: 'KEYCODE_2' },
    { num: '3', key: 'KEYCODE_3' },
    { num: '4', key: 'KEYCODE_4' },
    { num: '5', key: 'KEYCODE_5' },
    { num: '6', key: 'KEYCODE_6' },
    { num: '7', key: 'KEYCODE_7' },
    { num: '8', key: 'KEYCODE_8' },
    { num: '9', key: 'KEYCODE_9' },
  ];

  return (
    <div className="w-full flex flex-col items-center gap-3 p-2 select-none">
      {/* 4 Colored Function Buttons (Standard Indian DTH / Teletext) */}
      <div className="grid grid-cols-4 gap-2 w-full max-w-xs px-2">
        <motion.button
          id="btn-color-red"
          type="button"
          whileTap={{ scale: 0.92 }}
          onClick={() => handleClick('KEYCODE_PROG_RED')}
          className="h-8 rounded-lg bg-red-600 hover:bg-red-500 shadow-md shadow-red-950/50 flex items-center justify-center text-white text-xs font-semibold cursor-pointer"
          title="Red Function"
        >
          Red
        </motion.button>
        <motion.button
          id="btn-color-green"
          type="button"
          whileTap={{ scale: 0.92 }}
          onClick={() => handleClick('KEYCODE_PROG_GREEN')}
          className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-950/50 flex items-center justify-center text-white text-xs font-semibold cursor-pointer"
          title="Green Function"
        >
          Green
        </motion.button>
        <motion.button
          id="btn-color-yellow"
          type="button"
          whileTap={{ scale: 0.92 }}
          onClick={() => handleClick('KEYCODE_PROG_YELLOW')}
          className="h-8 rounded-lg bg-amber-500 hover:bg-amber-400 shadow-md shadow-amber-950/50 flex items-center justify-center text-slate-950 text-xs font-semibold cursor-pointer"
          title="Yellow Function"
        >
          Yellow
        </motion.button>
        <motion.button
          id="btn-color-blue"
          type="button"
          whileTap={{ scale: 0.92 }}
          onClick={() => handleClick('KEYCODE_PROG_BLUE')}
          className="h-8 rounded-lg bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-950/50 flex items-center justify-center text-white text-xs font-semibold cursor-pointer"
          title="Blue Function"
        >
          Blue
        </motion.button>
      </div>

      {/* 3x4 Numeric Keypad */}
      <div className="grid grid-cols-3 gap-2.5 w-full max-w-xs px-2">
        {digits.map((item) => (
          <motion.button
            key={item.num}
            id={`btn-num-${item.num}`}
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={() => handleClick(item.key)}
            disabled={disabled}
            className="h-13 rounded-xl bg-slate-800/90 hover:bg-slate-700 active:bg-cyan-500/20 active:border-cyan-400 border border-slate-700/60 shadow-[0_4px_10px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.1)] flex items-center justify-center text-xl font-bold text-slate-100 cursor-pointer transition-colors"
          >
            {item.num}
          </motion.button>
        ))}

        {/* Row 4: USB Drive, 0, Prev Ch */}
        <motion.button
          id="btn-tv-usb"
          type="button"
          whileTap={{ scale: 0.92 }}
          onClick={() => handleClick('KEYCODE_USB')}
          disabled={disabled}
          title="Connected USB Drives & Storage"
          className="h-13 rounded-xl bg-slate-800/60 hover:bg-slate-700 active:bg-cyan-500/20 border border-slate-700/60 flex flex-col items-center justify-center text-slate-300 text-xs font-medium cursor-pointer"
        >
          <Usb className="w-4 h-4 mb-0.5 text-cyan-400" />
          <span>USB</span>
        </motion.button>

        <motion.button
          id="btn-num-0"
          type="button"
          whileTap={{ scale: 0.92 }}
          onClick={() => handleClick('KEYCODE_0')}
          disabled={disabled}
          className="h-13 rounded-xl bg-slate-800/90 hover:bg-slate-700 active:bg-cyan-500/20 active:border-cyan-400 border border-slate-700/60 shadow-[0_4px_10px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.1)] flex items-center justify-center text-xl font-bold text-slate-100 cursor-pointer transition-colors"
        >
          0
        </motion.button>

        <motion.button
          id="btn-prev-channel"
          type="button"
          whileTap={{ scale: 0.92 }}
          onClick={() => handleClick('KEYCODE_LAST_CHANNEL')}
          disabled={disabled}
          title="Previous Channel"
          className="h-13 rounded-xl bg-slate-800/60 hover:bg-slate-700 active:bg-cyan-500/20 border border-slate-700/60 flex flex-col items-center justify-center text-slate-300 text-xs font-medium cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 mb-0.5 text-amber-400" />
          <span>Prev Ch</span>
        </motion.button>
      </div>

      {/* Auxiliary quick TV buttons */}
      <div className="flex items-center justify-center gap-3 mt-1">
        <motion.button
          id="btn-info"
          type="button"
          whileTap={{ scale: 0.92 }}
          onClick={() => handleClick('KEYCODE_INFO')}
          className="px-3.5 py-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-700 border border-slate-700/60 flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer"
        >
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span>Channel Info</span>
        </motion.button>
      </div>
    </div>
  );
};
