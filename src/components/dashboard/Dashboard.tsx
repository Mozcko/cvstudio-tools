import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Resume {
    id: string;
    title: string;
    updated_at: string;
    language: string;
    data: any;
}

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
                        <div key={cv.id} className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-slate-500 transition-all group relative overflow-hidden flex flex-col h-full">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold uppercase text-xs">
                                    {cv.language || 'ES'}
                                </div>
                                <div className="text-xs text-slate-500">
                                    {new Date(cv.updated_at).toLocaleDateString()}
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-1 truncate">{cv.title || 'Mi CV Sin Título'}</h3>
                            <p className="text-sm text-slate-400 mb-6 line-clamp-2 flex-grow">
                                {cv.data?.personal?.summary || 'Sin resumen profesional...'}
                            </p>
                            
                            <div className="flex gap-2 mt-auto">
                                <a href={`/app/editor?id=${cv.id}`} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm font-medium text-center transition-colors flex items-center justify-center">
                                    Editar
                                </a>
                                <button onClick={() => handleDelete(cv.id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors" title="Eliminar">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}