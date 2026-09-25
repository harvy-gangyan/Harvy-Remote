import React, { useState, useEffect } from 'react';
import { X, Send, Delete, Mic, MicOff } from 'lucide-react';
import { TVDevice } from '../types';

interface KeyboardInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendText: (text: string, sendEnter: boolean) => void;
  activeDevice: TVDevice | null;
}

const PRESET_SEARCHES = [
  'Latest Hindi Movies',
  'Live Cricket Match',
  'Lo-Fi Relaxing Beats',
  'Indian Street Food Documentary',
  '4K Nature Landscapes',
  'Tech Reviews',
];

export const KeyboardInputModal: React.FC<KeyboardInputModalProps> = ({
  isOpen,
  onClose,
  onSendText,
  activeDevice,
}) => {
  const [text, setText] = useState('');
  const [sendEnter, setSendEnter] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  useEffect(() => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .webkitSpeechRecognition;

    setSpeechSupported(!!SpeechRecognition);
  }, []);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendText(text.trim(), sendEnter);
    setText('');
    onClose();
  };

  const handleVoiceInput = () => {
    const SpeechRecognitionClass =
      (window as unknown as { SpeechRecognition?: new () => any; webkitSpeechRecognition?: new () => any })
        .SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: new () => any; webkitSpeechRecognition?: new () => any })
        .webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      alert('Speech recognition is not supported in this browser window. Please type your search query.');
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = 'en-IN'; // Indian English / Hindi mix support
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div>
            <h2 className="text-base font-bold text-white">Voice & Text Input to TV</h2>
            <p className="text-xs text-slate-400">
              Speak or type to search directly on {activeDevice?.name || 'Connected TV'}
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Search Query, Title, or URL
              </label>
              {speechSupported && (
                <span className="text-[10px] text-cyan-400 font-mono">
                  {isListening ? '● Listening now...' : 'Voice Search Available'}
                </span>
              )}
            </div>

            <div className="relative">
              <input
                id="input-tv-text"
                type="text"
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Speak with mic or type movie, show, password..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 transition-colors pr-20"
              />

              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {text && (
                  <button
                    type="button"
                    onClick={() => setText('')}
                    className="p-1 text-slate-400 hover:text-slate-200"
                    title="Clear text"
                  >
                    <Delete className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleVoiceInput}
                  title="Speak search query"
                  className={`p-1.5 rounded-lg transition-all ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30'
                  }`}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Quick presets */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Quick Suggestions
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_SEARCHES.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setText(s)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center gap-2 pt-1">
            <input
              id="checkbox-send-enter"
              type="checkbox"
              checked={sendEnter}
              onChange={(e) => setSendEnter(e.target.checked)}
              className="w-4 h-4 rounded text-cyan-500 bg-slate-800 border-slate-700 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="checkbox-send-enter" className="text-xs text-slate-300 cursor-pointer">
              Automatically press Enter / Search after sending
            </label>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!text.trim()}
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/25 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Send to TV</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
