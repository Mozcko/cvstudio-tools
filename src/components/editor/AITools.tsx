import React, { useState } from 'react';
import type { Translation } from '../../i18n/locales';

interface AIToolsProps {
  t: Translation;
  onEnhance: () => void;
  onOptimize: () => void;
  onTranslate: () => void;
  isProcessing: boolean;
}

export default function AITools({
  t,
  onEnhance,
  onOptimize,
  onTranslate,
  isProcessing,
}: AIToolsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={toggleMenu}
        disabled={isProcessing}
        className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-bold transition-all ${
          isProcessing
            ? 'cursor-wait border-purple-900/50 bg-purple-900/20 text-purple-300'
            : 'border-transparent bg-linear-to-r from-purple-600 to-indigo-600 text-white shadow-md hover:from-purple-500 hover:to-indigo-500 hover:shadow-purple-500/20'
        } `}
      >
        {isProcessing ? (
          <>
            <svg
              className="h-3 w-3 animate-spin text-white"
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
            <span className="hidden sm:inline">{t.ai.processing}</span>
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-3 w-3"
            >
              <path
                fillRule="evenodd"
                d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576l.813-2.846A.75.75 0 019 4.5zM9 15a.75.75 0 01.75.75v1.5h1.5a.75.75 0 010 1.5h-1.5v1.5a.75.75 0 01-1.5 0v-1.5h-1.5a.75.75 0 010-1.5h1.5v-1.5A.75.75 0 019 15z"
                clipRule="evenodd"
              />
            </svg>
            <span className="hidden sm:inline">{t.ai.button}</span>
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && !isProcessing && (
        <div className="animate-in fade-in zoom-in-95 absolute top-full right-0 z-50 mt-2 w-56 overflow-hidden rounded-lg border border-slate-700 bg-slate-800 shadow-xl duration-100">
          <div className="space-y-1 p-2">
            <button
              onClick={() => handleAction(onEnhance)}
              className="group flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-slate-200 transition-colors hover:bg-slate-700"
            >
              <span className="text-purple-400 group-hover:text-purple-300">✨</span>{' '}
              {t.ai.dropdown.enhance}
            </button>
            <button
              onClick={() => handleAction(onOptimize)}
              className="group flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-slate-200 transition-colors hover:bg-slate-700"
            >
              <span className="text-blue-400 group-hover:text-blue-300">🎯</span>{' '}
              {t.ai.dropdown.optimize}
            </button>
            <button
              onClick={() => handleAction(onTranslate)}
              className="group flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-slate-200 transition-colors hover:bg-slate-700"
            >
              <span className="text-green-400 group-hover:text-green-300">🌐</span>{' '}
              {t.ai.dropdown.translate}
            </button>
          </div>
          <div className="border-t border-slate-700/50 bg-slate-900/50 p-2 text-center text-[10px] text-slate-500">
            {t.ai.dropdown.poweredBy}
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
          role="button"
          tabIndex={0}
          onKeyDown={() => setIsOpen(false)}
        ></div>
      )}
    </div>
  );
}
