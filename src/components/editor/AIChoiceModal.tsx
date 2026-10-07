import React from 'react';
import type { Translation } from '../../i18n/locales';

interface AIChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChoice: (choice: 'overwrite' | 'copy') => void;
  t: Translation;
}

export default function AIChoiceModal({ isOpen, onClose, onChoice, t }: AIChoiceModalProps) {
  if (!isOpen) return null;

  const labels = t.aiChoice;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Enter' && onClose()}
        role="button"
        tabIndex={0}
        aria-label={t.actions.close}
      />

      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 px-6 py-8 text-center text-white">
          <h2 className="text-xl font-bold">{labels.title}</h2>
          <p className="mt-1 text-xs text-blue-100 opacity-90">{labels.description}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 p-6">
          <button
            onClick={() => onChoice('overwrite')}
            className="flex items-start gap-4 rounded-xl border border-slate-700 bg-slate-800/50 p-4 text-left transition-all hover:border-blue-500"
          >
            <div>
              <div className="text-sm font-bold text-white">{labels.apply}</div>
            </div>
          </button>

          <button
            onClick={() => onChoice('copy')}
            className="flex items-start gap-4 rounded-xl border border-slate-700 bg-slate-800/50 p-4 text-left transition-all hover:border-emerald-500"
          >
            <div>
              <div className="text-sm font-bold text-white">{labels.copy}</div>
            </div>
          </button>

          <button
            onClick={onClose}
            className="mt-2 w-full py-2 text-xs font-medium text-slate-500 transition-colors hover:text-white"
          >
            {t.actions.close}
          </button>
        </div>
      </div>
    </div>
  );
}
