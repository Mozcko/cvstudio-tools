import React, { useEffect, useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import useLocalStorage from '../hooks/useLocalStorage';
import useTranslation from '../hooks/useTranslation';
import { initialCVData, type CVData } from '../types/cv';
import { generateMarkdown } from '../utils/markdownGenerator';
import CVForm from './CVForm';
import Navbar from './Navbar'; 
import { themes, getThemeById } from '../templates'; 

// --- Imports del Editor de Código ---
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-markdown'; 
import 'prismjs/themes/prism-tomorrow.css'; 

export default function CVBuilder() {
  const { t, lang, toggleLang } = useTranslation();
  
  // 1. OBTENER DATOS DEL STORAGE
  const [rawData, setRawData] = useLocalStorage<CVData>('cv-data', initialCVData);
  
  // 2. VALIDAR SCHEMA (ANTI-CRASH)
  // Detecta si los datos guardados son de una versión vieja (strings en lugar de arrays)
  const cvData = useMemo(() => {
    const isOldSchema = 
        !Array.isArray(rawData.skills) || 
        !Array.isArray(rawData.certifications) ||
        !Array.isArray(rawData.personal?.socials) ||
        (rawData.experience.length > 0 && typeof rawData.experience[0].description === 'string');

    if (isOldSchema) {
        console.warn("Schema antiguo detectado. Reiniciando datos para evitar errores.");
        return initialCVData;
    }
    return rawData;
  }, [rawData]);

  // Si detectamos datos corruptos/viejos, actualizamos el storage
  useEffect(() => {
      if (cvData !== rawData) {
          setRawData(initialCVData);
      }
  }, [cvData, rawData, setRawData]);


  // 3. GESTIÓN DE TEMAS
  const [activeThemeId, setActiveThemeId] = useLocalStorage<string>('cv-theme-id', 'basic');
  const [customCSS, setCustomCSS] = useLocalStorage<string>('cv-custom-css', themes[0].css);

  // 4. ESTADOS UI
  const [markdown, setMarkdown] = useState<string>('');
  const [editMode, setEditMode] = useState<'form' | 'code'>('form');
  const [isMounted, setIsMounted] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  // Inicialización
  useEffect(() => {
    setIsMounted(true);
    setMarkdown(generateMarkdown(cvData, lang));
    
    // Asegurar que haya un CSS cargado. Si no hay (o si el ID guardado no coincide con el CSS actual), recargamos
    if (!customCSS) {
        setCustomCSS(getThemeById(activeThemeId).css);
    }
  }, []);

  // Sincronización Markdown (Data + Idioma)
  useEffect(() => {
    if (editMode === 'form') {
        setMarkdown(generateMarkdown(cvData, lang));
    }
  }, [cvData, editMode, lang]);

  // HANDLERS
  const handleDataChange = (newData: CVData) => setRawData(newData);
  
  const handleThemeChange = (theme: any) => {
      setActiveThemeId(theme.id);
      setCustomCSS(theme.css);
  };

  const handlePrint = () => window.print();

  const handleReset = () => {
    if(confirm(t.actions.confirmReset)){
        setRawData(initialCVData);
        // Resetear al tema por defecto
        handleThemeChange(themes[0]);
        setEditMode('form');
    }
  }

  // --- MOCK AI LOGIC ---
  const handleAiAction = async (action: 'enhance' | 'optimize' | 'translate') => {
    setIsAiProcessing(true);
    
    setTimeout(() => {
        const newData = { ...cvData };

        if (action === 'enhance') {
            if (lang === 'en') {
                newData.personal.summary = "Results-oriented Data Analyst with a proven track record in designing scalable ETL pipelines using Azure Data Factory. Expert in transforming raw data into actionable business intelligence using Python and SQL.";
            } else {
                newData.personal.summary = "Analista de Datos orientado a resultados con experiencia demostrada en el diseño de pipelines ETL escalables utilizando Azure Data Factory. Experto en transformar datos crudos en inteligencia de negocios accionable usando Python y SQL.";
            }
            alert(t.ai.alerts.enhance);
        } 
        else if (action === 'translate') {
            if (lang === 'es') {
                newData.personal.role = "Data Analyst";
                newData.personal.city = "Mexico City, Mexico";
                if(newData.experience[0]) newData.experience[0].role = "Systems Engineer Trainee";
            } else {
                newData.personal.role = "Analista de Datos";
                newData.personal.city = "CDMX, México";
                if(newData.experience[0]) newData.experience[0].role = "Ingeniero de Sistemas Trainee";
            }
            alert(t.ai.alerts.translate);
        }
        else if (action === 'optimize') {
            alert(t.ai.alerts.optimize);
        }

        setRawData(newData);
        setIsAiProcessing(false);
    }, 1500);
  };

  const highlightCode = (code: string) => (
    Prism.highlight(code, Prism.languages.markdown, 'markdown')
  );

  if (!isMounted) return <div className="flex h-screen items-center justify-center bg-app-bg text-slate-400">Cargando...</div>;

  return (
    <div className="flex flex-col h-screen bg-app-bg font-sans text-text-main">
      
      <Navbar 
        t={t}
        lang={lang}
        toggleLang={toggleLang}
        editMode={editMode}
        setEditMode={setEditMode}
        onReset={handleReset}
        onPrint={handlePrint}
        isAiProcessing={isAiProcessing}
        onAiAction={handleAiAction}
        currentTheme={activeThemeId}
        onThemeChange={handleThemeChange}
      />

      <main className="flex-1 flex overflow-hidden">
        
        {/* PANEL IZQUIERDO: EDITOR */}
        <section className="w-1/2 flex flex-col border-r border-panel-border bg-panel-bg print:hidden overflow-hidden transition-all relative">
          
          {/* Overlay de Carga (IA) */}
          {isAiProcessing && (
              <div className="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-purple-300">
                  <svg className="animate-spin h-8 w-8 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="font-bold animate-pulse">{t.ai.overlayText}</span>
              </div>
          )}

          {editMode === 'form' ? (
              // MODO VISUAL
              <div className="overflow-y-auto custom-scrollbar h-full">
                  <CVForm data={cvData} onChange={handleDataChange} t={t} />
              </div>
          ) : (
              // MODO CÓDIGO
              <div className="relative h-full flex flex-col bg-[#1d1f21]">
                  <div className="bg-yellow-500/10 text-yellow-500 text-xs py-2 px-4 text-center border-b border-yellow-500/20 shrink-0 font-medium">
                      {t.header.editorWarning}
                  </div>
                  
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                    <Editor
                      value={markdown}
                      onValueChange={(code) => setMarkdown(code)}
                      highlight={highlightCode}
                      padding={10}
                      className="font-mono text-sm"
                      style={{
                        fontFamily: '"Fira Code", "Fira Mono", monospace',
                        fontSize: 14,
                        minHeight: '100%'
                      }}
                      textareaClassName="focus:outline-none"
                    />
                  </div>
              </div>
          )}
        </section>

        {/* PANEL DERECHO: PREVIEW */}
        <section className="w-1/2 bg-app-bg overflow-y-auto print:w-full print:bg-white print:overflow-visible custom-scrollbar relative flex items-start justify-center">
           
           {/* Inyección de CSS dinámico */}
           <style>{customCSS}</style>

           <div className="py-12 px-8 print:p-0 transition-transform duration-300">
               {/* Hoja A4 Simulada */}
               <div className="bg-white text-slate-900 shadow-2xl min-h-[29.7cm] w-[21cm] print:shadow-none print:w-full relative">
                 <div className="cv-preview-content p-[1cm] print:p-0 h-full">
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