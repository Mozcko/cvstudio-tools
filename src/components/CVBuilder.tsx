import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import useLocalStorage from '../hooks/useLocalStorage';

// Importamos los archivos como strings crudos usando '?raw' (Feature de Vite)
// @ts-ignore (A veces TS se queja de los imports ?raw, esto lo silencia)
import defaultMarkdownFile from '../templates/default.md?raw';
// @ts-ignore
import defaultCssFile from '../templates/basic.css?raw'; // O ?inline

export default function CVBuilder() {
  // Usamos el hook para que si recargas la página, tu texto editado siga ahí.
  const [markdown, setMarkdown] = useLocalStorage<string>('cv-markdown', defaultMarkdownFile);
  
  // El CSS también lo guardamos por si quieres editarlo en vivo en el futuro
  const [currentStyles, setCurrentStyles] = useLocalStorage<string>('cv-styles', defaultCssFile);

  // Estado para saber si estamos montados (evita errores de hidratación con localStorage)
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleReset = () => {
    if(confirm('¿Estás seguro de reiniciar al CV por defecto? Perderás los cambios actuales.')){
        setMarkdown(defaultMarkdownFile);
        setCurrentStyles(defaultCssFile);
    }
  }

  if (!isMounted) {
    return <div className="p-10 text-center">Cargando editor...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans text-gray-900">
      {/* Header */}
      <header className="flex justify-between items-center p-4 bg-white border-b border-gray-200 print:hidden">
        <h1 className="text-xl font-bold text-gray-800">RenderCV - Frontend</h1>
        <div className="flex gap-2">
            <button 
                onClick={handleReset}
                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded border border-transparent transition"
            >
                Resetear
            </button>
            <button 
                onClick={handlePrint}
                className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded shadow transition font-medium flex items-center gap-2"
            >
                <span>Descargar PDF</span>
            </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Editor (Izquierda) */}
        <section className="w-1/2 flex flex-col border-r border-gray-300 bg-white print:hidden">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-bold uppercase text-gray-500 flex justify-between">
            <span>Markdown Source</span>
            <span className="text-gray-400">Edita aquí</span>
          </div>
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            className="flex-1 w-full p-6 resize-none focus:outline-none font-mono text-sm leading-relaxed text-gray-800 bg-white"
            spellCheck={false}
          />
        </section>

        {/* Preview (Derecha) */}
        <section className="w-1/2 bg-gray-500 overflow-y-auto print:w-full print:bg-white print:overflow-visible">
           {/* Inyección de Estilos Dinámicos */}
           <style>{currentStyles}</style>

           <div className="flex justify-center py-10 print:p-0">
               {/* Hoja A4 */}
               <div 
                 className="bg-white shadow-xl min-h-[29.7cm] w-[21cm] print:shadow-none print:w-full print:min-h-0"
               >
                 {/* Contenedor con clase específica para el CSS scopeado */}
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