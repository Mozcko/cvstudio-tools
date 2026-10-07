import React, { useState } from 'react';
import type { Translation } from '../../i18n/locales';

interface OptimizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: Translation;
  onOptimize: (jd: string) => void;
  isProcessing: boolean;
}

export default function OptimizeModal({
  isOpen,
  onClose,
  t,
  onOptimize,
  isProcessing,
}: OptimizeModalProps) {
  const [jd, setJd] = useState('');

  if (!isOpen) return null;

  const handleOptimize = () => {
    if (!jd.trim()) return;
    onOptimize(jd);
    setJd('');
    onClose();
  };

  // Safe access to i18n keys with fallbacks
  const ai = t.ai as Record<string, unknown>;
  const optimize = (ai.optimize as Record<string, string>) || {};
  const dropdown = (ai.dropdown as Record<string, string>) || {};

  const optimizeTitle = optimize.title || dropdown.optimize;
  const optimizeDesc = optimize.description || (ai.jobDescriptionPrompt as string);
  const optimizePlaceholder = optimize.placeholder || t.ai.ats.placeholder;
  const optimizeAction = optimize.action || dropdown.optimize;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="animate-in fade-in zoom-in-95 flex w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 bg-slate-800/50 p-6 backdrop-blur-md">
          <h2 className="flex items-center gap-2 text-xl font-bold text-white">
            <span className="text-blue-400">🎯</span> {optimizeTitle}
          </h2>
          <button onClick={onClose} className="text-slate-400 transition-colors hover:text-white">
            ✕
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-slate-300">{optimizeDesc}</p>
            <textarea
              className="custom-scrollbar h-64 w-full rounded-lg border border-slate-700 bg-slate-950 p-4 text-sm text-slate-200 transition-all outline-none placeholder:text-slate-600 focus:border-blue-500"
              placeholder={optimizePlaceholder}
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              disabled={isProcessing}
            />
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg border border-slate-700 py-3 font-bold text-slate-400 transition-all hover:bg-slate-800"
              >
                {t.actions.close}
              </button>
              <button
                onClick={handleOptimize}
                disabled={isProcessing || !jd.trim()}
                className="flex flex-[2] items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <svg
                      className="h-5 w-5 animate-spin text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {t.ai.processing}
                  </>
                ) : (
                  <>{optimizeAction}</>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 bg-slate-900/50 p-3 text-center text-[10px] tracking-widest text-slate-500 uppercase">
          {t.ai.dropdown.poweredBy}
        </div>
      </div>
    </div>
  );
}
