import React from 'react';
import type { Translation } from '../../i18n/locales';

interface EmptyStateProps {
  t: Translation;
  onCreate: () => void;
  onImport: () => void;
}

/** Shown on the dashboard while the user has no CV yet. */
export default function EmptyState({ t, onCreate, onImport }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center rounded-2xl border-2 border-dashed border-slate-700 bg-slate-800/30 px-6 py-14 text-center"
      data-testid="dashboard-empty"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 160 130"
        className="mb-6 h-32 w-auto"
        aria-hidden="true"
      >
        {/* A blank CV sheet waiting to be filled in */}
        <rect
          x="38"
          y="8"
          width="84"
          height="112"
          rx="8"
          fill="#1e293b"
          stroke="#334155"
          strokeWidth="2"
        />
        <circle cx="58" cy="30" r="8" fill="#334155" />
        <rect x="72" y="24" width="36" height="5" rx="2.5" fill="#334155" />
        <rect x="72" y="33" width="24" height="4" rx="2" fill="#334155" />
        <rect x="50" y="52" width="60" height="4" rx="2" fill="#334155" />
        <rect x="50" y="62" width="48" height="4" rx="2" fill="#334155" />
        <rect x="50" y="72" width="56" height="4" rx="2" fill="#334155" />
        <circle cx="118" cy="100" r="18" fill="#2563eb" />
        <path d="M118 91v18M109 100h18" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
      </svg>

      <h2 className="mb-2 text-2xl font-bold text-white">{t.dashboard.emptyTitle}</h2>
      <p className="mb-8 max-w-md text-slate-400">{t.dashboard.emptyDescription}</p>

      <button
        onClick={onCreate}
        data-testid="create-first-cv"
        className="rounded-xl bg-blue-600 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-blue-900/40 transition-all hover:bg-blue-500 active:translate-y-0.5"
      >
        {t.dashboard.createFirst}
      </button>
      <button
        onClick={onImport}
        className="mt-4 text-sm font-medium text-slate-400 underline transition-colors hover:text-white"
      >
        {t.dashboard.emptyImport}
      </button>
    </div>
  );
}
