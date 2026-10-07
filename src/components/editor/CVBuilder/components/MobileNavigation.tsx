import React from 'react';
import type { Translation } from '../../../../i18n/locales';

interface MobileNavigationProps {
  mobileTab: 'editor' | 'preview';
  setMobileTab: (tab: 'editor' | 'preview') => void;
  t: Translation;
}

export default function MobileNavigation({ mobileTab, setMobileTab, t }: MobileNavigationProps) {
  return (
    <div className="safe-area-pb relative z-50 flex shrink-0 border-t border-slate-700 bg-slate-800 shadow-2xl lg:hidden print:hidden">
      <button
        onClick={() => setMobileTab('editor')}
        className={`flex flex-1 items-center justify-center gap-2 py-4 transition-colors active:bg-slate-700 ${mobileTab === 'editor' ? 'border-t-2 border-blue-500 bg-slate-700/50 text-blue-400' : 'border-t-2 border-transparent text-slate-400'}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
        <span>{t.header.editor}</span>
      </button>
      <div className="my-2 w-px bg-slate-700"></div>
      <button
        onClick={() => setMobileTab('preview')}
        className={`flex flex-1 items-center justify-center gap-2 py-4 transition-colors active:bg-slate-700 ${mobileTab === 'preview' ? 'border-t-2 border-blue-500 bg-slate-700/50 text-blue-400' : 'border-t-2 border-transparent text-slate-400'}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
        <span>{t.header.preview}</span>
      </button>
    </div>
  );
}
