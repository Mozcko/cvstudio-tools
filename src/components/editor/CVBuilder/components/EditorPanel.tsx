import React, { useState } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-markdown'; 
import 'prismjs/themes/prism-tomorrow.css'; 
import CVForm from '../../CVForm/CVForm';
import ThemeSelector from '../../ThemeSelector';
import type { CVData } from '../../../../types/cv';
import type { Translation } from '../../../../i18n/locales';

interface EditorPanelProps {
    editMode: 'form' | 'code';
    setEditMode: (mode: 'form' | 'code') => void;
    activeThemeId: string;
    handleThemeChange: (theme: any) => void;
    isAiProcessing: boolean;
    t: Translation;
    cvData: CVData;
    handleDataChange: (data: CVData) => void;
    markdown: string;
    setMarkdown: (md: string) => void;
    isVisible: boolean;
}

export default function EditorPanel({
    editMode, setEditMode, activeThemeId, handleThemeChange, isAiProcessing, t, cvData, handleDataChange, markdown, setMarkdown, isVisible
}: EditorPanelProps) {
    const [showCodeWarning, setShowCodeWarning] = useState(true);

    const highlightCode = (code: string) => Prism.highlight(code, Prism.languages.markdown, 'markdown');

    return (
        <section className={`w-full lg:w-5/12 xl:w-4/12 flex flex-col border-r border-panel-border bg-panel-bg print:hidden min-w-0 ${isVisible ? 'flex-1 h-full overflow-hidden' : 'hidden lg:flex'}`}>
            {/* Toolbar */}
            <div className="shrink-0 p-3 border-b border-panel-border bg-slate-900/50 flex justify-between items-center z-10">
                <div className="flex bg-slate-800/50 p-0.5 rounded-lg border border-slate-700/50">
                    <button onClick={() => setEditMode('form')} className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${editMode === 'form' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}>{t.header.visualEditor}</button>
                    <button onClick={() => setEditMode('code')} className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${editMode === 'code' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}>{t.header.codeEditor}</button>
                </div>
                <ThemeSelector currentTheme={activeThemeId} onSelect={handleThemeChange} />
            </div>

            {/* AI Overlay */}
            {isAiProcessing && (
                <div className="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-purple-300">
                    <svg className="animate-spin h-8 w-8 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span className="font-bold animate-pulse">{t.ai.overlayText}</span>
                </div>
            )}

            {editMode === 'form' ? (
                <div className="overflow-y-auto custom-scrollbar h-full">
                    <CVForm data={cvData} onChange={handleDataChange} t={t} />
                </div>
            ) : (
                <div className="relative h-full flex flex-col bg-[#1d1f21]">
                    {showCodeWarning && (
                        <div className="m-4 mb-0 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-xs text-yellow-500 flex items-start gap-2 relative animate-in fade-in slide-in-from-top-2 shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mt-0.5 shrink-0"><path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
                            <div className="flex-1 pr-2"><p>{t.header.editorWarning}</p></div>
                            <button onClick={() => setShowCodeWarning(false)} className="text-yellow-500/70 hover:text-yellow-400 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg></button>
                        </div>
                    )}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 pb-24">
                        <Editor
                            value={markdown}
                            onValueChange={(code) => setMarkdown(code)}
                            highlight={highlightCode}
                            padding={10}
                            className="font-mono text-sm"
                            style={{ fontFamily: '"Fira Code", "Fira Mono", monospace', fontSize: 14, minHeight: '100%' }}
                            textareaClassName="focus:outline-none"
                        />
                    </div>
                </div>
            )}
        </section>
    );
}