import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import useLocalStorage from '../hooks/useLocalStorage';
import { initialCVData, type CVData } from '../types/cv';
import { generateMarkdown } from '../utils/markdownGenerator';
import CVForm from './CVForm';

// --- NUEVOS IMPORTS PARA EL EDITOR ---
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-markdown'; // Importamos sintaxis Markdown
import 'prismjs/themes/prism-tomorrow.css'; // Tema oscuro para el código (Okaidia o Tomorrow)

// @ts-ignore
import defaultCssFile from '../templates/basic.css?raw';

export default function CVBuilder() {
  const [cvData, setCvData] = useLocalStorage<CVData>('cv-data', initialCVData);
  const [markdown, setMarkdown] = useState<string>('');
  const [editMode, setEditMode] = useState<'form' | 'code'>('form');
  const [currentStyles, setCurrentStyles] = useLocalStorage<string>('cv-styles', defaultCssFile);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setMarkdown(generateMarkdown(cvData));
  }, []);

  // Sincronización
  useEffect(() => {
    if (editMode === 'form') {
        setMarkdown(generateMarkdown(cvData));
    }
  }, [cvData, editMode]);

  const handlePrint = () => window.print();

  // Función de resaltado para el editor
  const highlightCode = (code: string) => (
    Prism.highlight(code, Prism.languages.markdown, 'markdown')
  );

  if (!isMounted) return <div className="p-10 text-center text-white">Cargando...</div>;

  return (
    <div className="flex flex-col h-screen bg-app-bg font-sans text-text-main">
      
      {/* HEADER */}
      <header className="flex justify-between items-center p-4 bg-panel-bg border-b border-panel-border print:hidden">
        <h1 className="text-lg font-bold text-text-main">CV Builder</h1>
        
        <div className="bg-slate-900 p-1 rounded-lg flex text-xs font-medium border border-slate-700">
            <button 
                onClick={() => setEditMode('form')}
                className={`px-3 py-1.5 rounded-md transition-all ${editMode === 'form' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
                ✏️ Editor Visual
            </button>
            <button 
                onClick={() => setEditMode('code')}
                className={`px-3 py-1.5 rounded-md transition-all ${editMode === 'code' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
                🧑‍💻 Código Markdown
            </button>
        </div>

        <button 
             onClick={handlePrint}
             className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded shadow transition text-sm font-bold"
        >
             Descargar PDF
        </button>
      </header>

      <main className="flex-1 flex overflow-hidden">
        
        {/* PANEL IZQUIERDO */}
        <section className="w-1/2 flex flex-col border-r border-panel-border bg-panel-bg print:hidden overflow-hidden">
          
          {editMode === 'form' ? (
              // MODO VISUAL: Necesita su propio scroll
              <div className="overflow-y-auto custom-scrollbar h-full">
                  <CVForm data={cvData} onChange={setCvData} />
              </div>
          ) : (
              // MODO CÓDIGO: El Editor necesita un contenedor para el scroll
              <div className="relative h-full flex flex-col">
                  <div className="bg-yellow-900/20 text-yellow-200 text-xs py-2 px-4 text-center border-b border-yellow-900/50 shrink-0">
                      ⚠️ Modo Avanzado: Los cambios directos al código no actualizan el formulario visual.
                  </div>
                  
                  {/* Contenedor Scrollable para el Editor */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar bg-panel-bg">
                    <Editor
                      value={markdown}
                      onValueChange={(code) => setMarkdown(code)}
                      highlight={highlightCode}
                      padding={24}
                      className="font-mono text-sm"
                      style={{
                        fontFamily: '"Fira Code", "Fira Mono", monospace',
                        fontSize: 14,
                        backgroundColor: 'transparent', // Usamos el fondo del panel
                        minHeight: '100%'
                      }}
                      textareaClassName="focus:outline-none"
                    />
                  </div>
              </div>
          )}
        </section>

        {/* PANEL DERECHO (Preview) */}
        <section className="w-1/2 bg-app-bg overflow-y-auto print:w-full print:bg-white print:overflow-visible custom-scrollbar">
           <style>{currentStyles}</style>
           <div className="flex justify-center py-12 px-4 print:p-0">
               <div className="bg-white text-slate-900 shadow-2xl min-h-[29.7cm] w-[21cm] print:shadow-none print:w-full">
                 <div className="cv-preview-content p-[1cm] print:p-0">
                    <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                        {markdown}
                    </ReactMarkdown>
                 </div>
               </div>
           </div>
        </section>

      </main>
    </div>
  );
}