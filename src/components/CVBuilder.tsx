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
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor');
  const [windowWidth, setWindowWidth] = useState(0);

  // Inicialización
  useEffect(() => {
    setIsMounted(true);
    setMarkdown(generateMarkdown(cvData, lang));
    
    // Asegurar que haya un CSS cargado
    if (!customCSS) {
        setCustomCSS(getThemeById(activeThemeId).css);
    }

    // Listener para ajustar la escala del CV en móviles
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

  // --- LOGICA DE INTELIGENCIA ARTIFICIAL (REAL) ---
  const handleAiAction = async (action: 'enhance' | 'optimize' | 'translate') => {
    setIsAiProcessing(true);
    
    try {
        let jobDescription = "";
        
        // Si la acción es optimizar, necesitamos pedir la descripción del puesto
        if (action === 'optimize') {
            // Nota: Usamos 'as any' por si no has actualizado locales.ts aún, para que no rompa
            const promptText = (t.ai as any).jobDescriptionPrompt || "Pega aquí la descripción del trabajo:";
            jobDescription = prompt(promptText) || "";
            
            // Si el usuario cancela, detenemos todo
            if (!jobDescription) {
                setIsAiProcessing(false);
                return;
            }
        }

        // Llamada a nuestro Endpoint de Astro (que conecta con DeepSeek)
        const response = await fetch('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action,
                cvData, // Enviamos el estado actual
                lang,   // Enviamos el idioma actual ('es' o 'en')
                jobDescription
            })
        });

        if (!response.ok) {
            throw new Error(`Error en la API: ${response.statusText}`);
        }

        const newCvData = await response.json();

        // Validamos que lo que nos devolvió la IA tenga sentido (mínimo que tenga la sección personal)
        if (!newCvData || !newCvData.personal) {
            throw new Error("La respuesta de la IA no tiene el formato esperado.");
        }

        // Actualizamos el estado con los datos mejorados por IA
        setRawData(newCvData);
        
        // Mensaje de éxito
        const successMsg = {
            enhance: t.ai.alerts.enhance,
            translate: t.ai.alerts.translate,
            optimize: t.ai.alerts.optimize
        }[action];
        
        alert(successMsg);

    } catch (error) {
        console.error("AI Action Error:", error);
        alert("Hubo un error al procesar tu solicitud con IA. Por favor intenta de nuevo.");
    } finally {
        setIsAiProcessing(false);
    }
  };

  const highlightCode = (code: string) => (
    Prism.highlight(code, Prism.languages.markdown, 'markdown')
  );

  // Calcular escala dinámica para aprovechar el espacio en móvil
  const calculateScale = () => {
      if (windowWidth >= 1024 || windowWidth === 0) return 1;
      // Ancho pantalla - 12px (margen mínimo) / Ancho A4 (794px)
      return Math.min(1, (windowWidth - 12) / 794);
  };
  const scale = calculateScale();

  if (!isMounted) return <div className="flex h-screen items-center justify-center bg-app-bg text-slate-400">Cargando...</div>;

  return (
    <div className="flex flex-col h-[100dvh] bg-app-bg font-sans text-text-main">
      
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

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* PANEL IZQUIERDO: EDITOR */}
        <section className={`
            w-full lg:w-5/12 xl:w-4/12 
            flex flex-col border-r border-panel-border bg-panel-bg print:hidden overflow-hidden transition-all relative min-w-0
            ${mobileTab === 'editor' ? 'flex-1' : 'hidden lg:flex'} lg:h-auto
        `}>
          
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
        <section className={`
            w-full lg:w-7/12 xl:w-8/12 
            bg-app-bg overflow-auto print:w-full print:bg-white print:overflow-visible custom-scrollbar relative flex items-start justify-center min-w-0
            ${mobileTab === 'preview' ? 'flex-1' : 'hidden lg:flex'} lg:h-auto
        `}>
           
           {/* Inyección de CSS dinámico */}
           <style>{customCSS}</style>

           <div className="py-6 md:py-12 w-full flex justify-center print:p-0">
               {/* Hoja A4 Simulada */}
               <div 
                    className="bg-white text-slate-900 shadow-2xl print:shadow-none !print:w-full !print:transform-none !print:mb-0 relative origin-top transition-transform duration-300"
                    style={{ 
                        width: '21cm',
                        minHeight: '29.7cm',
                        transform: `scale(${scale})`,
                        marginBottom: scale === 1 ? 0 : `-${29.7 * (1 - scale)}cm`,
                        marginLeft: scale === 1 ? 0 : `-${21 * (1 - scale) / 2}cm`,
                        marginRight: scale === 1 ? 0 : `-${21 * (1 - scale) / 2}cm`
                    }}
               >
                 <div className="cv-preview-content p-[1cm] print:p-0 h-full">
                    <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                        {markdown}
                    </ReactMarkdown>
                 </div>
               </div>
           </div>
        </section>

        {/* BARRA DE NAVEGACIÓN MÓVIL (SOLO VISIBLE EN PANTALLAS PEQUEÑAS) */}
        <div className="lg:hidden bg-slate-800 border-t border-slate-700 flex text-xs font-bold z-50 shrink-0 safe-area-pb">
            <button 
                onClick={() => setMobileTab('editor')}
                className={`flex-1 py-4 flex items-center justify-center gap-2 transition-colors ${mobileTab === 'editor' ? 'text-blue-400 bg-slate-700/50 border-t-2 border-blue-500' : 'text-slate-400 border-t-2 border-transparent'}`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                <span>{t.header.editor}</span>
            </button>
            <div className="w-px bg-slate-700 my-2"></div>
            <button 
                onClick={() => setMobileTab('preview')}
                className={`flex-1 py-4 flex items-center justify-center gap-2 transition-colors ${mobileTab === 'preview' ? 'text-blue-400 bg-slate-700/50 border-t-2 border-blue-500' : 'text-slate-400 border-t-2 border-transparent'}`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                <span>{t.header.preview}</span>
            </button>
        </div>

      </main>
    </div>
  );
}