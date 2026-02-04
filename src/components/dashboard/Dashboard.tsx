import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { supabase } from '../../lib/supabase';
import { generateMarkdown } from '../../utils/markdownGenerator';
import { themes } from '../../templates';

interface Resume {
    id: string;
    title: string;
    updated_at: string;
    language: string;
    data: any;
    theme: string;
}

const ResumeCard = ({ cv, onDelete }: { cv: Resume, onDelete: (id: string) => void }) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [scale, setScale] = React.useState(0.22);

    React.useEffect(() => {
        if (!containerRef.current) return;
        
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const width = entry.contentRect.width;
                // 210mm @ 96dpi ~= 793.7px
                const A4_WIDTH_PX = 794; 
                setScale(width / A4_WIDTH_PX);
            }
        });

        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    const theme = themes.find(t => t.id === cv.theme) || themes[0];
    const scopedCss = theme.css.replace(/\.cv-preview-content/g, `#cv-preview-${cv.id} .cv-preview-content`);

    const markdownContent = React.useMemo(() => {
        try {
            if (cv.data?.mode === 'markdown') {
                return cv.data.markdown || '';
            }
            // Ensure arrays exist to prevent "map of undefined" errors in generateMarkdown
            const safeData = {
                ...(cv.data || {}),
                experience: cv.data?.experience || [],
                education: cv.data?.education || [],
                skills: cv.data?.skills || [],
                projects: cv.data?.projects || [],
                languages: cv.data?.languages || [],
                social: cv.data?.social || []
            };
            return generateMarkdown(safeData, cv.language as 'es' | 'en' || 'es');
        } catch (e) {
            return '';
        }
    }, [cv]);

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-slate-500 transition-all group relative overflow-hidden flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold uppercase text-xs">
                    {cv.language || 'ES'}
                </div>
                <div className="text-xs text-slate-500">
                    {new Date(cv.updated_at).toLocaleDateString()}
                </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-1 truncate">{cv.title || 'Mi CV Sin Título'}</h3>
            
            {/* VISTA PREVIA TIPO DOCUMENTO (Miniatura) */}
            <div ref={containerRef} className="mb-6 h-40 bg-slate-900/50 rounded-md overflow-hidden relative shadow-sm border border-slate-700/50 group-hover:border-slate-500/50 transition-all">
                <style>{scopedCss}</style>
                <div id={`cv-preview-${cv.id}`} className="w-full h-full overflow-hidden relative bg-slate-800">
                    <div 
                        className="cv-preview-content origin-top-left bg-white shadow-xl pointer-events-none select-none"
                        style={{ 
                            width: '210mm', 
                            minHeight: '297mm', 
                            transform: `scale(${scale})`, 
                            transformOrigin: 'top left'
                        }}
                    >
                        <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                        {markdownContent}
                        </ReactMarkdown>
                    </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-800 via-transparent to-transparent pointer-events-none"></div>
            </div>
            
            <div className="flex gap-2 mt-auto">
                <a href={`/app/editor?id=${cv.id}`} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm font-medium text-center transition-colors flex items-center justify-center">
                    Editar
                </a>
                <button onClick={() => onDelete(cv.id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors" title="Eliminar">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default function Dashboard() {
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadResumes();
    }, []);

    const loadResumes = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                // Si no hay usuario, redirigir o manejar el estado
                return;
            }

            const { data, error } = await supabase
                .from('resumes')
                .select('*')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false });

            if (error) throw error;
            setResumes(data || []);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error al cargar los CVs');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Estructura mínima inicial
        const initialData = {
            personal: {
                name: user.user_metadata?.full_name || "Tu Nombre",
                role: "Tu Rol",
                summary: "Resumen profesional..."
            }
        };

        const { data, error } = await supabase
            .from('resumes')
            .insert([{ 
                user_id: user.id,
                title: 'Nuevo Currículum',
                data: initialData, 
                language: 'es',
                theme: 'basic'
            }])
            .select()
            .single();

        if (error) {
            alert('Error al crear: ' + error.message);
        } else if (data) {
            window.location.href = `/app/editor?id=${data.id}`;
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este CV?')) return;
        
        const { error } = await supabase.from('resumes').delete().eq('id', id);
        if (error) {
            alert(error.message);
        } else {
            setResumes(resumes.filter(r => r.id !== id));
        }
    };

    return (
        <div>
            {/* Header Section */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Mis Currículums</h1>
                    <p className="text-slate-400">Gestiona y edita tus documentos.</p>
                </div>
                
                <button 
                    onClick={handleCreate}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                    </svg>
                    Crear Nuevo
                </button>
            </div>

            {/* Grid Section */}
            {loading ? (
                <div className="text-center text-slate-500 py-10 animate-pulse">
                    Cargando tus documentos...
                </div>
            ) : error ? (
                <div className="text-red-400 text-center py-10 border border-red-900/50 bg-red-900/10 rounded-lg">{error}</div>
            ) : resumes.length === 0 ? (
                <div className="col-span-full border-2 border-dashed border-slate-700 rounded-xl p-10 flex flex-col items-center justify-center text-slate-500">
                    <p className="mb-4">No tienes currículums guardados aún.</p>
                    <button onClick={handleCreate} className="text-blue-400 hover:text-white underline">Crear el primero</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {resumes.map(cv => (
                        <ResumeCard key={cv.id} cv={cv} onDelete={handleDelete} />
                    ))}
                </div>
            )}
        </div>
    );
}