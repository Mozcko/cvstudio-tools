import React from 'react';
import type { Translation } from '../../i18n/locales';
import type { CvTheme } from '../../templates'; 
import AITools from './AITools'; 
import ThemeSelector from './ThemeSelector'; 
import UserMenu from '../auth/UserMenu'; // Importamos el menú de usuario desde auth

interface EditorToolbarProps {
  t: Translation;
  lang: 'es' | 'en';
  toggleLang: () => void;
  editMode: 'form' | 'code';
  setEditMode: (mode: 'form' | 'code') => void;
  onReset: () => void;
  onPrint: () => void;
  
  isAiProcessing: boolean;
  onAiAction: (action: 'enhance' | 'optimize' | 'translate') => void;

  currentTheme: string;
  onThemeChange: (theme: CvTheme) => void;

  onSave: () => void;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
}

export default function EditorToolbar({ 
  t, 
  lang, 
  toggleLang, 
  editMode, 
  setEditMode, 
  onReset, 
  onPrint,
  isAiProcessing,
  onAiAction,
  currentTheme,   
  onThemeChange,
  onSave,
  saveStatus
}: EditorToolbarProps) {
  
  return (
    <header className="flex justify-between items-center px-2 md:px-4 py-3 bg-panel-bg border-b border-panel-border print:hidden z-10 shadow-sm relative shrink-0">
        
        {/* IZQUIERDA: Título + Banderas */}
        <div className="flex items-center gap-2 md:gap-4 lg:gap-6">
            <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                 <div className="bg-blue-600 w-8 h-8 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-white">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                 </div>
                 {/* En pantallas muy chicas ocultamos el texto "CVStudio" para dar espacio a herramientas */}
                 <h1 className="text-lg font-bold text-text-main tracking-tight hidden sm:block">
                    CVStudio<span className="text-blue-500">.tools</span>
                 </h1>
            </a>
            
            {/* Toggle de Banderas */}
            <button 
                onClick={toggleLang}
                className="relative flex items-center justify-between w-14 bg-slate-800 border border-slate-600 rounded-full p-1 cursor-pointer hover:border-slate-500 transition-all shadow-inner"
                title={lang === 'es' ? "Cambiar a Inglés" : "Switch to Spanish"}
            >
                <div className={`absolute left-1 w-6 h-6 bg-slate-600 rounded-full shadow-md transition-all duration-300 ease-out transform ${lang === 'en' ? 'translate-x-6' : 'translate-x-0'}`}></div>
                <div className={`relative z-10 w-6 h-6 flex items-center justify-center text-sm transition-opacity duration-300 ${lang === 'es' ? 'opacity-100' : 'opacity-40 grayscale'}`}>🇲🇽</div>
                <div className={`relative z-10 w-6 h-6 flex items-center justify-center text-sm transition-opacity duration-300 ${lang === 'en' ? 'opacity-100' : 'opacity-40 grayscale'}`}>🇺🇸</div>
            </button>
        </div>
        
        {/* DERECHA: Herramientas del Editor */}
        <div className="flex items-center gap-2 lg:gap-3">
            
            {/* 1. Herramientas AI */}
            <AITools 
                t={t} isProcessing={isAiProcessing}
                onEnhance={() => onAiAction('enhance')} onOptimize={() => onAiAction('optimize')} onTranslate={() => onAiAction('translate')}
            />

            {/* 2. Selector de Temas */}
            <div className="hidden md:block">
                <ThemeSelector currentTheme={currentTheme} onSelect={onThemeChange} />
            </div>

            <div className="h-6 w-px bg-slate-700 mx-1 hidden lg:block"></div>

            {/* 3. Switch Visual/Code */}
            <div className="bg-slate-900/80 p-1 rounded-lg hidden md:flex text-xs font-medium border border-slate-700">
                <button 
                    onClick={() => setEditMode('form')}
                    className={`px-3 py-1.5 rounded-md transition-all ${editMode === 'form' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                    {t.header.visualEditor}
                </button>
                <button 
                    onClick={() => setEditMode('code')}
                    className={`px-3 py-1.5 rounded-md transition-all ${editMode === 'code' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                    {t.header.codeEditor}
                </button>
            </div>
            
            {/* 4. Acciones: Reset & Download */}
            <button 
                onClick={onSave} 
                disabled={saveStatus === 'saving'}
                className={`
                    flex items-center gap-2 px-3 py-2 rounded transition-all text-sm font-medium
                    ${saveStatus === 'saved' ? 'text-green-400 bg-green-900/20' : 'text-slate-300 hover:text-white hover:bg-slate-800'}
                `}
                title={t.actions.save}
            >
                {saveStatus === 'saving' ? (
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : saveStatus === 'saved' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" /></svg>
                )}
                <span className="hidden xl:inline">
                    {saveStatus === 'saving' ? t.actions.saving : saveStatus === 'saved' ? t.actions.saved : t.actions.save}
                </span>
            </button>

            <button onClick={onReset} className="text-slate-400 hover:text-red-400 transition-colors p-2" title={t.header.reset}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
            </button>

            <button onClick={onPrint} className="bg-accent hover:bg-accent-hover text-white px-3 py-2 lg:px-4 rounded shadow-lg shadow-blue-900/30 transition-all text-sm font-bold flex items-center gap-2 active:translate-y-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clipRule="evenodd" />
                </svg>
                <span className="hidden lg:inline">{t.header.download}</span>
            </button>

            <div className="h-6 w-px bg-slate-700 mx-1"></div>

            {/* 5. Menú de Usuario (Avatar + Salir) */}
            <UserMenu />
        </div>
    </header>
  );
}