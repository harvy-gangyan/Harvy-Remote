import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
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
  Check,
} from 'lucide-react';
import { CustomButton, ActionType, MacroStep } from '../types';
import { ANDROID_KEYCODES } from '../data/keycodes';

interface CustomButtonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (button: CustomButton) => void;
  editingButton?: CustomButton | null;
}

const AVAILABLE_ICONS: { name: string; icon: React.ElementType }[] = [
  { name: 'Tv', icon: Tv },
  { name: 'Radio', icon: Radio },
  { name: 'Subtitles', icon: Subtitles },
  { name: 'Layers', icon: Layers },
  { name: 'FastForward', icon: FastForward },
  { name: 'Moon', icon: Moon },
  { name: 'PowerOff', icon: PowerOff },
  { name: 'Flame', icon: Flame },
  { name: 'Sliders', icon: Sliders },
  { name: 'Volume2', icon: Volume2 },
  { name: 'Gamepad2', icon: Gamepad2 },
  { name: 'Sparkles', icon: Sparkles },
  { name: 'Terminal', icon: Terminal },
  { name: 'Zap', icon: Zap },
  { name: 'Film', icon: Film },
  { name: 'Music', icon: Music },
  { name: 'Shield', icon: Shield },
  { name: 'Play', icon: Play },
  { name: 'Clock', icon: Clock },
];

const COLOR_OPTIONS: { id: CustomButton['color']; bg: string; border: string; text: string }[] = [
  { id: 'indigo', bg: 'bg-indigo-600', border: 'border-indigo-400', text: 'text-indigo-400' },
  { id: 'cyan', bg: 'bg-cyan-600', border: 'border-cyan-400', text: 'text-cyan-400' },
  { id: 'amber', bg: 'bg-amber-600', border: 'border-amber-400', text: 'text-amber-400' },
  { id: 'emerald', bg: 'bg-emerald-600', border: 'border-emerald-400', text: 'text-emerald-400' },
  { id: 'rose', bg: 'bg-rose-600', border: 'border-rose-400', text: 'text-rose-400' },
  { id: 'purple', bg: 'bg-purple-600', border: 'border-purple-400', text: 'text-purple-400' },
  { id: 'orange', bg: 'bg-orange-600', border: 'border-orange-400', text: 'text-orange-400' },
  { id: 'slate', bg: 'bg-slate-700', border: 'border-slate-400', text: 'text-slate-300' },
];

const PRESET_TEMPLATES = [
  {
    label: 'Switch to HDMI 1',
    iconName: 'Tv',
    color: 'indigo' as const,
    actionType: 'keycode' as ActionType,
    payload: 'KEYCODE_TV_INPUT_HDMI_1',
    description: 'Direct switch to HDMI Port 1',
  },
  {
    label: 'Switch to HDMI 2',
    iconName: 'Radio',
    color: 'cyan' as const,
    actionType: 'keycode' as ActionType,
    payload: 'KEYCODE_TV_INPUT_HDMI_2',
    description: 'Direct switch to HDMI Port 2 (DTH Box)',
  },
  {
    label: 'Toggle Subtitles',
    iconName: 'Subtitles',
    color: 'amber' as const,
    actionType: 'keycode' as ActionType,
    payload: 'KEYCODE_CAPTIONS',
    description: 'Toggle video subtitles / captions',
  },
  {
    label: 'App Switcher',
    iconName: 'Layers',
    color: 'purple' as const,
    actionType: 'keycode' as ActionType,
    payload: 'KEYCODE_APP_SWITCH',
    description: 'Show background running apps',
  },
  {
    label: 'Late Night Vol -5',
    iconName: 'Moon',
    color: 'slate' as const,
    actionType: 'macro' as ActionType,
    payload: 'night_audio_preset',
    description: 'Lower volume by 5 notches',
    macroSteps: [
      { id: '1', actionType: 'keycode' as const, payload: 'KEYCODE_VOLUME_DOWN', delayMs: 80 },
      { id: '2', actionType: 'keycode' as const, payload: 'KEYCODE_VOLUME_DOWN', delayMs: 80 },
      { id: '3', actionType: 'keycode' as const, payload: 'KEYCODE_VOLUME_DOWN', delayMs: 80 },
      { id: '4', actionType: 'keycode' as const, payload: 'KEYCODE_VOLUME_DOWN', delayMs: 80 },
      { id: '5', actionType: 'keycode' as const, payload: 'KEYCODE_VOLUME_DOWN', delayMs: 0 },
    ],
  },
  {
    label: 'Sleep Screen',
    iconName: 'PowerOff',
    color: 'orange' as const,
    actionType: 'keycode' as ActionType,
    payload: 'KEYCODE_SLEEP',
    description: 'Put TV display directly to sleep',
  },
];

export const CustomButtonModal: React.FC<CustomButtonModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingButton,
}) => {
  const [label, setLabel] = useState(editingButton?.label || '');
  const [iconName, setIconName] = useState(editingButton?.iconName || 'Tv');
  const [color, setColor] = useState<CustomButton['color']>(editingButton?.color || 'indigo');
  const [actionType, setActionType] = useState<ActionType>(editingButton?.actionType || 'keycode');
  const [payload, setPayload] = useState(editingButton?.payload || 'KEYCODE_TV_INPUT_HDMI_1');
  const [description, setDescription] = useState(editingButton?.description || '');
  const [macroSteps, setMacroSteps] = useState<MacroStep[]>(
    editingButton?.macroSteps || [
      { id: '1', actionType: 'keycode', payload: 'KEYCODE_VOLUME_DOWN', delayMs: 150 },
      { id: '2', actionType: 'keycode', payload: 'KEYCODE_VOLUME_DOWN', delayMs: 0 },
    ]
  );

  if (!isOpen) return null;

  const handleApplyPreset = (preset: typeof PRESET_TEMPLATES[0]) => {
    setLabel(preset.label);
    setIconName(preset.iconName);
    setColor(preset.color);
    setActionType(preset.actionType);
    setPayload(preset.payload);
    setDescription(preset.description || '');
    if (preset.macroSteps) {
      setMacroSteps(preset.macroSteps);
    }
  };

  const handleAddMacroStep = () => {
    setMacroSteps([
      ...macroSteps,
      {
        id: Math.random().toString(36).substring(2, 9),
        actionType: 'keycode',
        payload: 'KEYCODE_DPAD_CENTER',
        delayMs: 200,
      },
    ]);
  };

  const handleRemoveMacroStep = (index: number) => {
    setMacroSteps(macroSteps.filter((_, i) => i !== index));
  };

  const handleMacroStepChange = (index: number, field: keyof MacroStep, value: unknown) => {
    const updated = [...macroSteps];
    updated[index] = { ...updated[index], [field]: value };
    setMacroSteps(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;

    const newBtn: CustomButton = {
      id: editingButton?.id || `custom-btn-${Date.now()}`,
      label: label.trim(),
      iconName,
      color,
      actionType,
      payload: actionType === 'macro' ? label.toLowerCase().replace(/\s+/g, '_') : payload.trim(),
      description: description.trim() || undefined,
      macroSteps: actionType === 'macro' ? macroSteps : undefined,
    };

    onSave(newBtn);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div>
            <h2 className="text-base font-bold text-white">
              {editingButton ? 'Edit Custom Button' : 'Create Custom Button'}
            </h2>
            <p className="text-xs text-slate-400">
              Personalized macro, HDMI shortcut, or app launcher
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Quick Presets Carousel (if new button) */}
          {!editingButton && (
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Quick One-Click Presets
              </span>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {PRESET_TEMPLATES.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Button Label */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Button Label <span className="text-rose-400">*</span>
            </label>
            <input
              id="input-custom-label"
              type="text"
              required
              placeholder="e.g. HDMI 1, Skip Intro, Late Night"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>

          {/* Action Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Action Type</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setActionType('keycode')}
                className={`py-2 px-3 rounded-xl border text-xs font-medium text-center transition-all ${
                  actionType === 'keycode'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-semibold'
                    : 'bg-slate-800/70 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                Keycode
              </button>
              <button
                type="button"
                onClick={() => setActionType('app')}
                className={`py-2 px-3 rounded-xl border text-xs font-medium text-center transition-all ${
                  actionType === 'app'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-semibold'
                    : 'bg-slate-800/70 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                App Launch
              </button>
              <button
                type="button"
                onClick={() => setActionType('macro')}
                className={`py-2 px-3 rounded-xl border text-xs font-medium text-center transition-all ${
                  actionType === 'macro'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-semibold'
                    : 'bg-slate-800/70 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                Sequence Macro
              </button>
            </div>
          </div>

          {/* Action Payload Configuration */}
          {actionType === 'keycode' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Select Android TV Keycode
              </label>
              <select
                id="select-custom-keycode"
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
              >
                {ANDROID_KEYCODES.map((k) => (
                  <option key={k.name} value={k.name}>
                    {k.label} ({k.name})
                  </option>
                ))}
              </select>
            </div>
          )}

          {actionType === 'app' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Android Package Name
              </label>
              <input
                id="input-custom-package"
                type="text"
                required
                placeholder="e.g. com.netflix.ninja or in.startv.hotstar"
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Directly launches this package on TV without advertising or splash screens.
              </span>
            </div>
          )}

          {actionType === 'macro' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  Macro Sequence Steps ({macroSteps.length})
                </label>
                <button
                  type="button"
                  onClick={handleAddMacroStep}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Step
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto p-1 bg-slate-950/60 rounded-xl border border-slate-800">
                {macroSteps.map((step, idx) => (
                  <div
                    key={step.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs"
                  >
                    <span className="text-slate-400 font-mono font-bold w-4">{idx + 1}.</span>
                    <select
                      value={step.payload}
                      onChange={(e) => handleMacroStepChange(idx, 'payload', e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs"
                    >
                      {ANDROID_KEYCODES.map((k) => (
                        <option key={k.name} value={k.name}>
                          {k.label}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="3000"
                        step="50"
                        value={step.delayMs || 0}
                        onChange={(e) =>
                          handleMacroStepChange(idx, 'delayMs', parseInt(e.target.value) || 0)
                        }
                        className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-slate-200 text-xs text-right font-mono"
                      />
                      <span className="text-[10px] text-slate-400">ms</span>
                    </div>

                    {macroSteps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMacroStep(idx)}
                        className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Icon Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Button Icon</label>
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 p-2 bg-slate-950/50 rounded-xl border border-slate-800 max-h-32 overflow-y-auto">
              {AVAILABLE_ICONS.map((item) => {
                const IconC = item.icon;
                const isSelected = iconName === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setIconName(item.name)}
                    className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/40'
                        : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    <IconC className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Theme Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Color Theme</label>
            <div className="flex gap-2.5 items-center">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.id)}
                  className={`w-7 h-7 rounded-full ${c.bg} flex items-center justify-center transition-transform ${
                    color === c.id ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  {color === c.id && <Check className="w-4 h-4 text-white drop-shadow" />}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Switch directly to gaming console"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Save / Cancel buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all"
            >
              {editingButton ? 'Save Changes' : 'Create Button'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
