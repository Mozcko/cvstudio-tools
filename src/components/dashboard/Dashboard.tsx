import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { supabase } from '../../lib/supabase';
import { generateMarkdown } from '../../utils/markdownGenerator';
import { themes } from '../../templates';
import type { CVData } from '../../types/cv';

interface Resume {
  id: string;
  title: string;
  updated_at: string;
  language: string;
  data: Record<string, unknown>;
  theme: string;
}

const ResumeCard = ({ cv, onDelete }: { cv: Resume; onDelete: (id: string) => void }) => {
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

  const theme = themes.find((t) => t.id === cv.theme) || themes[0];
  const scopedCss = theme.css.replace(
    /\.cv-preview-content/g,
    `#cv-preview-${cv.id} .cv-preview-content`
  );

  const markdownContent = React.useMemo(() => {
    try {
      if (cv.data?.mode === 'markdown') {
        return (cv.data.markdown as string) || '';
      }
      // Ensure arrays exist to prevent "map of undefined" errors in generateMarkdown
      const rawData = (cv.data || {}) as unknown as {
        experience?: unknown[];
        education?: unknown[];
        skills?: unknown[];
        projects?: unknown[];
        languages?: unknown;
        social?: unknown[];
      };

      const safeData = {
        ...(cv.data || {}),
        experience: rawData.experience || [],
        education: rawData.education || [],
        skills: rawData.skills || [],
        projects: rawData.projects || [],
        languages: rawData.languages || [],
        social: rawData.social || [],
      } as unknown as CVData;
      return generateMarkdown(safeData, (cv.language as 'es' | 'en') || 'es');
    } catch {
      return '';
    }
  }, [cv]);

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-800 p-5 transition-all hover:border-slate-500">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-400 uppercase">
          {cv.language || 'ES'}
        </div>
        <div className="text-xs text-slate-500">{new Date(cv.updated_at).toLocaleDateString()}</div>
      </div>
      <h3 className="mb-1 truncate text-xl font-bold text-white">
        {cv.title || 'Mi CV Sin Título'}
      </h3>

      {/* VISTA PREVIA TIPO DOCUMENTO (Miniatura) */}
      <div
        ref={containerRef}
        className="relative mb-6 h-40 overflow-hidden rounded-md border border-slate-700/50 bg-slate-900/50 shadow-sm transition-all group-hover:border-slate-500/50"
      >
        <style>{scopedCss}</style>
        <div
          id={`cv-preview-${cv.id}`}
          className="relative h-full w-full overflow-hidden bg-slate-800"
        >
          <div
            className="cv-preview-content pointer-events-none origin-top-left bg-white shadow-xl select-none"
            style={{
              width: '210mm',
              minHeight: '297mm',
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
            <ReactMarkdown rehypePlugins={[rehypeRaw]}>{markdownContent}</ReactMarkdown>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-slate-800 via-transparent to-transparent"></div>
      </div>

      <div className="mt-auto flex gap-2">
        <a
          href={`/app/editor?id=${cv.id}`}
          className="flex flex-1 items-center justify-center rounded-lg bg-slate-700 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-slate-600"
        >
          Editar
        </a>
        <button
          onClick={() => onDelete(cv.id)}
          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-700 hover:text-red-400"
          title="Eliminar"
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
              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
            />
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) setError(err.message);
      else setError('Error al cargar los CVs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Estructura mínima inicial
    const initialData = {
      personal: {
        name: user.user_metadata?.full_name || 'Tu Nombre',
        role: 'Tu Rol',
        summary: 'Resumen profesional...',
      },
    };

    const { data, error } = await supabase
      .from('resumes')
      .insert([
        {
          user_id: user.id,
          title: 'Nuevo Currículum',
          data: initialData,
          language: 'es',
          theme: 'basic',
        },
      ])
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
      setResumes(resumes.filter((r) => r.id !== id));
    }
  };

  return (
    <div>
      {/* Header Section */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-white">Mis Currículums</h1>
          <p className="text-slate-400">Gestiona y edita tus documentos.</p>
        </div>

        <button
          onClick={handleCreate}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-bold text-white transition-colors hover:bg-blue-500"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-5 w-5"
          >
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          Crear Nuevo
        </button>
      </div>

      {/* Grid Section */}
      {loading ? (
        <div className="animate-pulse py-10 text-center text-slate-500">
          Cargando tus documentos...
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-900/50 bg-red-900/10 py-10 text-center text-red-400">
          {error}
        </div>
      ) : resumes.length === 0 ? (
        <div className="col-span-full flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-700 p-10 text-slate-500">
          <p className="mb-4">No tienes currículums guardados aún.</p>
          <button onClick={handleCreate} className="text-blue-400 underline hover:text-white">
            Crear el primero
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {resumes.map((cv) => (
            <ResumeCard key={cv.id} cv={cv} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
