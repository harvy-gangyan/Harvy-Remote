import React, { useState } from 'react';
import {
  Tv,
  Radio,
  Plus,
  Wifi,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  X,
} from 'lucide-react';
import { TVBrand } from '../types';
import { BRAND_CONFIGS } from '../data/defaultTVs';

interface NoTVConnectedScreenProps {
  onOpenScan: () => void;
  onOpenManualAdd: () => void;
  onCloseApp?: () => void;
}

export const NoTVConnectedScreen: React.FC<NoTVConnectedScreenProps> = ({
  onOpenScan,
  onOpenManualAdd,
  onCloseApp,
}) => {
  const [expandedBrand, setExpandedBrand] = useState<TVBrand | null>('tcl');

  const popularBrands: TVBrand[] = ['tcl', 'samsung', 'xiaomi', 'lg', 'sony', 'oneplus'];

  return (
    <div className="w-full max-w-[420px] h-[calc(100dvh-24px)] max-h-[880px] bg-[#070b13] rounded-[32px] border border-cyan-500/30 shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_30px_rgba(6,182,212,0.15)] flex flex-col relative overflow-hidden select-none p-4 sm:p-5 my-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.4)]">
            <Tv className="w-4 h-4 text-slate-950 font-bold" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide">Universal TV Remote</h1>
            <div className="flex items-center gap-1.5 text-[10.5px] text-cyan-400 font-mono">
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span>Ready for TV Connection</span>
            </div>
          </div>
        </div>

        {onCloseApp && (
          <button
            type="button"
            onClick={onCloseApp}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
            title="Close Application"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Content Area (Scrollable with custom scrollbar) */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 py-3 space-y-4 [scrollbar-width:thin] [scrollbar-color:#0ea5e9_#0f172a]">
        {/* Welcome & Status Hero */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="w-14 h-14 rounded-2xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center mx-auto mb-3 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)]">
            <Radio className="w-7 h-7 animate-pulse" />
          </div>

          <h2 className="text-base font-bold text-white mb-1">No TVs Connected Yet</h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-[320px] mx-auto mb-4">
            Connect your Smart TV to control power, volume, D-Pad, streaming apps, and inputs directly from your phone.
          </p>

          {/* Primary Action Buttons */}
          <div className="space-y-2">
            <button
              type="button"
              id="btn-onboarding-auto-scan"
              onClick={onOpenScan}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.35)] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
            >
              <Radio className="w-4 h-4 text-slate-950 animate-pulse" />
              <span>Auto-Scan Wi-Fi for TVs</span>
            </button>

            <button
              type="button"
              id="btn-onboarding-manual-add"
              onClick={onOpenManualAdd}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-850 text-cyan-300 border border-cyan-500/40 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
            >
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Add TV Manually by IP</span>
            </button>
          </div>
        </div>

        {/* Requirements Checklist */}
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
          <span className="font-bold text-slate-200 block mb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Before Connecting Your TV:</span>
          </span>
          <div className="space-y-2 text-[11px] text-slate-400">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 mt-0.5 flex-shrink-0" />
              <span>
                Ensure your phone and Smart TV are on the <b>same Wi-Fi network</b> (2.4GHz or 5GHz).
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 mt-0.5 flex-shrink-0" />
              <span>
                Turn on your TV so its network card responds to connection requests.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 mt-0.5 flex-shrink-0" />
              <span>
                For Android / Google TV (TCL, Mi, OnePlus, Sony), enable <b>Network Debugging</b> in Developer Options.
              </span>
            </div>
          </div>
        </div>

        {/* TV Setup Guides Accordion */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>Setup Instructions by TV Brand</span>
          </div>

          <div className="space-y-1.5">
            {popularBrands.map((brandKey) => {
              const info = BRAND_CONFIGS[brandKey];
              const isExpanded = expandedBrand === brandKey;
              return (
                <div
                  key={brandKey}
                  className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedBrand(isExpanded ? null : brandKey)}
                    className="w-full px-3 py-2 text-left flex items-center justify-between text-xs font-semibold text-slate-200 hover:bg-slate-800/60 cursor-pointer"
                  >
                    <span>{info.name}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="p-3 pt-1 border-t border-slate-800 text-[11px] text-slate-300 space-y-1.5 bg-slate-950/60">
                      <div className="text-[10px] text-cyan-400 font-mono mb-1">
                        Default Port: {info.defaultPort} • Protocol: {info.protocolDescription}
                      </div>
                      <ol className="list-decimal pl-4 space-y-1 text-slate-400">
                        {info.setupGuide.map((step, idx) => (
                          <li key={idx} className="leading-snug">
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono flex-shrink-0">
        <span>Harvy Universal TV Remote</span>
        <span>Production Ready • v2.0</span>
      </div>
    </div>
  );
};
