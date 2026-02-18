import React from 'react';
import type { Translation } from '../../i18n/locales';
import AITools from './AITools';
import UserMenu from '../auth/UserMenu'; // Importamos el menú de usuario desde auth

interface EditorToolbarProps {
  t: Translation;
  lang: 'es' | 'en';
  toggleLang: () => void;
  onReset: () => void;
  onPrint: () => void;
  onAtsSimulator: () => void;

  isAiProcessing: boolean;
  onAiAction: (action: 'enhance' | 'optimize' | 'translate') => void;

  onSave: () => void;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';

  resumeTitle: string;
  onTitleChange: (title: string) => void;
}

export default function EditorToolbar({
  t,
  lang,
  toggleLang,
  onReset,
  onPrint,
  isAiProcessing,
  onAiAction,
  onSave,
  saveStatus,
  resumeTitle,
  onTitleChange,
  onAtsSimulator,
}: EditorToolbarProps) {
  return (
    <header className="bg-panel-bg border-panel-border relative z-10 flex shrink-0 items-center justify-between border-b px-2 py-3 shadow-sm md:px-4 print:hidden">
      {/* IZQUIERDA: Título + Banderas */}
      <div className="flex items-center gap-2 md:gap-4 lg:gap-6">
        <a
          href="/app/dashboard"
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
          title="Volver al Dashboard"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-lg shadow-blue-900/20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="h-5 w-5 text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
          </div>
        </a>

        {/* Input para el título del CV */}
        <div className="flex flex-col">
          <label
            htmlFor="resume-title"
            className="mb-0.5 hidden text-[10px] font-bold tracking-wider text-slate-500 uppercase sm:block"
          >
            Nombre del Archivo
          </label>
          <input
            id="resume-title"
            type="text"
            value={resumeTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Nombre del CV (ej. Full Stack Google)"
            className="w-32 truncate border-b border-slate-700 bg-transparent text-sm font-bold text-white placeholder-slate-600 transition-colors outline-none hover:border-blue-500 focus:w-64 focus:border-blue-500 sm:w-48 lg:w-64"
          />
        </div>

        {/* Toggle de Banderas */}
        <button
          onClick={toggleLang}
          className="relative flex w-14 cursor-pointer items-center justify-between rounded-full border border-slate-600 bg-slate-800 p-1 shadow-inner transition-all hover:border-slate-500"
          title={lang === 'es' ? 'Cambiar a Inglés' : 'Switch to Spanish'}
        >
          <div
            className={`absolute left-1 h-6 w-6 transform rounded-full bg-slate-600 shadow-md transition-all duration-300 ease-out ${lang === 'en' ? 'translate-x-6' : 'translate-x-0'}`}
          ></div>
          <div
            className={`relative z-10 flex h-6 w-6 items-center justify-center text-sm transition-opacity duration-300 ${lang === 'es' ? 'opacity-100' : 'opacity-40 grayscale'}`}
          >
            🇲🇽
          </div>
          <div
            className={`relative z-10 flex h-6 w-6 items-center justify-center text-sm transition-opacity duration-300 ${lang === 'en' ? 'opacity-100' : 'opacity-40 grayscale'}`}
          >
            🇺🇸
          </div>
        </button>
      </div>

      {/* DERECHA: Herramientas del Editor */}
      <div className="flex items-center gap-2 lg:gap-3">
        {/* 1. Herramientas AI */}
        <AITools
          t={t}
          isProcessing={isAiProcessing}
          onEnhance={() => onAiAction('enhance')}
          onOptimize={() => onAiAction('optimize')}
          onTranslate={() => onAiAction('translate')}
          onAtsSimulator={onAtsSimulator}
        />

        {/* 4. Acciones: Reset & Download */}
        <button
          onClick={onSave}
          disabled={saveStatus === 'saving'}
          className={`flex items-center gap-2 rounded px-3 py-2 text-sm font-medium transition-all ${saveStatus === 'saved' ? 'bg-green-900/20 text-green-400' : 'text-slate-300 hover:bg-slate-800 hover:text-white'} `}
          title={t.actions.save}
        >
          {saveStatus === 'saving' ? (
            <svg
              className="h-4 w-4 animate-spin"
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
          ) : saveStatus === 'saved' ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path
                fillRule="evenodd"
                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
              />
            </svg>
          )}
          <span className="hidden xl:inline">
            {saveStatus === 'saving'
              ? t.actions.saving
              : saveStatus === 'saved'
                ? t.actions.saved
                : t.actions.save}
          </span>
        </button>

        <button
          onClick={onReset}
          className="p-2 text-slate-400 transition-colors hover:text-red-400"
          title={t.header.reset}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
            />
          </svg>
        </button>

        <button
          onClick={onPrint}
          className="bg-accent hover:bg-accent-hover flex items-center gap-2 rounded px-3 py-2 text-sm font-bold text-white shadow-lg shadow-blue-900/30 transition-all active:translate-y-0.5 lg:px-4"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z"
              clipRule="evenodd"
            />
          </svg>
          <span className="hidden lg:inline">{t.header.download}</span>
        </button>

        <div className="mx-1 h-6 w-px bg-slate-700"></div>

        {/* 5. Menú de Usuario (Avatar + Salir) */}
        <UserMenu />
      </div>
    </header>
  );
}
