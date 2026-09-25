import React, { useRef, useState } from 'react';
import { MousePointer, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { playRemoteClick } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';

interface TrackpadControlProps {
  onSwipe: (dir: 'KEYCODE_DPAD_UP' | 'KEYCODE_DPAD_DOWN' | 'KEYCODE_DPAD_LEFT' | 'KEYCODE_DPAD_RIGHT') => void;
  onTap: () => void;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  sensitivity: number;
}

export const TrackpadControl: React.FC<TrackpadControlProps> = ({
  onSwipe,
  onTap,
  soundEnabled,
  hapticsEnabled,
  sensitivity = 1.0,
}) => {
  const [activeGesture, setActiveGesture] = useState<string | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const hasMovedRef = useRef<boolean>(false);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    touchStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
    };
    hasMovedRef.current = false;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!touchStartRef.current) return;
    const dx = e.clientX - touchStartRef.current.x;
    const dy = e.clientY - touchStartRef.current.y;
    const dt = Date.now() - touchStartRef.current.time;

    const threshold = 35 / sensitivity;

    if (!hasMovedRef.current && Math.abs(dx) < 12 && Math.abs(dy) < 12 && dt < 450) {
      // Tap detected (Click OK)
      if (soundEnabled) playRemoteClick('ok');
      if (hapticsEnabled) triggerHaptic('medium');
      setActiveGesture('Tap (OK)');
      onTap();
      setTimeout(() => setActiveGesture(null), 300);
    } else {
      // Swipe evaluation
      if (Math.abs(dx) > Math.abs(dy)) {
        if (Math.abs(dx) > threshold) {
          const dir = dx > 0 ? 'KEYCODE_DPAD_RIGHT' : 'KEYCODE_DPAD_LEFT';
          if (soundEnabled) playRemoteClick('nav');
          if (hapticsEnabled) triggerHaptic('light');
          setActiveGesture(dx > 0 ? 'Swipe Right' : 'Swipe Left');
          onSwipe(dir);
          setTimeout(() => setActiveGesture(null), 300);
        }
      } else {
        if (Math.abs(dy) > threshold) {
          const dir = dy > 0 ? 'KEYCODE_DPAD_DOWN' : 'KEYCODE_DPAD_UP';
          if (soundEnabled) playRemoteClick('nav');
          if (hapticsEnabled) triggerHaptic('light');
          setActiveGesture(dy > 0 ? 'Swipe Down' : 'Swipe Up');
          onSwipe(dir);
          setTimeout(() => setActiveGesture(null), 300);
        }
      }
    }

    touchStartRef.current = null;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!touchStartRef.current) return;
    const dx = Math.abs(e.clientX - touchStartRef.current.x);
    const dy = Math.abs(e.clientY - touchStartRef.current.y);
    if (dx > 8 || dy > 8) {
      hasMovedRef.current = true;
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-1 select-none">
      <div
        id="remote-trackpad-surface"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="w-full h-[190px] rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-slate-700/80 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8),0_6px_20px_rgba(0,0,0,0.5)] relative flex flex-col items-center justify-center cursor-grab active:cursor-grabbing touch-none overflow-hidden group"
      >
        {/* Subtle grid dots pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        {/* Direction hint icons */}
        <ArrowUp className="absolute top-3 w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-colors pointer-events-none" />
        <ArrowDown className="absolute bottom-3 w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-colors pointer-events-none" />
        <ArrowLeft className="absolute left-3 w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-colors pointer-events-none" />
        <ArrowRight className="absolute right-3 w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-colors pointer-events-none" />

        <div className="flex flex-col items-center pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-cyan-400 shadow-inner mb-2">
            <MousePointer className="w-6 h-6" />
          </div>
          <span className="text-xs font-medium text-slate-400">Swipe to Navigate</span>
          <span className="text-[11px] text-slate-500 mt-0.5">Tap anywhere to Click / OK</span>
        </div>

        {activeGesture && (
          <div className="absolute bottom-4 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-mono font-medium animate-pulse pointer-events-none">
            {activeGesture}
          </div>
        )}
      </div>
    </div>
  );
};
