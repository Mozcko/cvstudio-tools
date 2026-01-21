import React from 'react';
import type { Translation } from '../i18n/locales';
import AITools from './AITools'; 

interface NavbarProps {
  t: Translation;
  lang: 'es' | 'en';
  toggleLang: () => void;
  editMode: 'form' | 'code';
  setEditMode: (mode: 'form' | 'code') => void;
  onReset: () => void;
  onPrint: () => void;
  
  // Props para AI
  isAiProcessing: boolean;
  onAiAction: (action: 'enhance' | 'optimize' | 'translate') => void;
}

export default function Navbar({ 
  t, 
  lang, 
  toggleLang, 
  editMode, 
  setEditMode, 
  onReset, 
  onPrint,
  isAiProcessing,
  onAiAction
}: NavbarProps) {
  
  return (
    <header className="flex justify-between items-center p-4 bg-panel-bg border-b border-panel-border print:hidden z-10 shadow-sm relative">
        
        {/* Izquierda: Título + Toggle de Banderas */}
        <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold text-text-main tracking-tight">{t.header.title}</h1>
            
            {/* Toggle Switch de Idioma (Banderas) */}
            <button 
                onClick={toggleLang}
                className="relative flex items-center bg-slate-800 border border-slate-600 rounded-full p-1 cursor-pointer hover:border-slate-500 transition-all shadow-inner"
                title={lang === 'es' ? "Cambiar a Inglés" : "Switch to Spanish"}
            >
                {/* Fondo deslizante (indicador activo) */}
                <div 
                    className={`absolute w-7 h-7 bg-slate-600 rounded-full shadow-md transition-all duration-300 ease-out transform ${
                        lang === 'en' ? 'translate-x-8.5' : 'translate-x-0'
                    }`}
                ></div>

                {/* Bandera México */}
                <div className={`relative z-10 w-8.5 h-7 flex items-center justify-center text-lg transition-opacity duration-300 ${lang === 'es' ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                    🇲🇽
                </div>

                {/* Bandera USA */}
                <div className={`relative z-10 w-8.5 h-7 flex items-center justify-center text-lg transition-opacity duration-300 ${lang === 'en' ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                    🇺🇸
                </div>
            </button>
        </div>
        
        {/* Derecha: Herramientas */}
        <div className="flex gap-3 items-center">
            
            {/* AI Tools */}
            <AITools 
                t={t}
                isProcessing={isAiProcessing}
                onEnhance={() => onAiAction('enhance')}
                onOptimize={() => onAiAction('optimize')}
                onTranslate={() => onAiAction('translate')}
            />

            <div className="h-6 w-px bg-slate-700 mx-1"></div>

            {/* Switch Visual/Code */}
            <div className="bg-slate-900/80 p-1 rounded-lg flex text-xs font-medium border border-slate-700">
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
            
            <div className="h-6 w-px bg-slate-700 mx-1"></div>

            <button 
                onClick={onReset}
                className="text-sm font-medium text-slate-400 hover:text-red-400 transition-colors duration-200 px-2"
                title={t.header.reset}
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
            </button>

            <button 
                onClick={onPrint}
                className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded shadow-lg shadow-blue-900/30 transition-all text-sm font-bold flex items-center gap-2 active:translate-y-0.5"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clipRule="evenodd" />
                </svg>
                {t.header.download}
            </button>
        </div>
    </header>
  );
}