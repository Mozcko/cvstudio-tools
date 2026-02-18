import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../../../lib/supabase';
import useLocalStorage from '../../../../hooks/useLocalStorage';
import { initialCVData, type CVData } from '../../../../types/cv';
import { generateMarkdown } from '../../../../utils/markdownGenerator';
import type { CvTheme } from '../../../../templates';
import { themes } from '../../../../templates';
import type { Translation } from '../../../../i18n/locales';

export function useCVLogic(t: Translation, lang: 'es' | 'en') {
  // 1. DATA STATE
  const [rawData, setRawData] = useLocalStorage<CVData>('cv-data', initialCVData);
  const [resumeId, setResumeId] = useLocalStorage<string | null>('cv-resume-id', null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [resumeTitle, setResumeTitle] = useState<string>('');

  // Bandera para saber si hay cambios sin guardar
  const [isDirty, setIsDirty] = useState(false);

  // 2. THEME STATE
  const [activeThemeId, setActiveThemeId] = useLocalStorage<string>('cv-theme-id', 'basic');
  const [customCSS, setCustomCSS] = useLocalStorage<string>('cv-custom-css', themes[0].css);

  // 3. EDITOR STATE
  const [markdown, setMarkdownState] = useState<string>('');
  const [editMode, setEditMode] = useState<'form' | 'code'>('form');
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const [isAtsModalOpen, setIsAtsModalOpen] = useState(false);
  const [isCoverLetterOpen, setIsCoverLetterOpen] = useState(false);

  // 4. SCHEMA VALIDATION
  const cvData = useMemo(() => {
    const isOldSchema =
      !Array.isArray(rawData.skills) ||
      !Array.isArray(rawData.certifications) ||
      !Array.isArray(rawData.personal?.socials) ||
      (rawData.experience.length > 0 && typeof rawData.experience[0].description === 'string');

    if (isOldSchema) {
      console.warn('Schema antiguo detectado. Reiniciando datos para evitar errores.');
      return initialCVData;
    }
    return {
      projects: [],
      customSections: [],
      sectionOrder: ['experience', 'projects', 'education', 'skills', 'custom'],
      ...rawData,
    };
  }, [rawData]);

  // 5. SYNC MARKDOWN
  useEffect(() => {
    if (editMode === 'form') {
      setMarkdownState(generateMarkdown(cvData, lang));
    }
  }, [cvData, editMode, lang]);

  // 6. LOAD FROM DB
  useEffect(() => {
    const initSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;

      const params = new URLSearchParams(window.location.search);
      const urlId = params.get('id');

      if (urlId) {
        setResumeId(urlId);
        const { data } = await supabase
          .from('resumes')
          .select('data, theme, title')
          .eq('id', urlId)
          .single();
        if (data) {
          if (data.data) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const userCvData = data.data as any;
            if (userCvData.mode === 'markdown' && typeof userCvData.markdown === 'string') {
              setMarkdownState(userCvData.markdown);
              setEditMode('code');
            } else {
              setRawData(userCvData);
              setEditMode('form');
            }
          }
          if (data.theme) setActiveThemeId(data.theme);
          if (data.title) setResumeTitle(data.title);
          setIsDirty(false);
          setSaveStatus('saved'); // Cargado exitosamente
        }
      } else if (!resumeId) {
        const { data } = await supabase
          .from('resumes')
          .select('id, data, title')
          .eq('user_id', session.user.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();
        if (data) {
          setResumeId(data.id);
          if (data.title) setResumeTitle(data.title);
          if (data.data) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const userCvData = data.data as any;
            if (userCvData.mode === 'markdown' && typeof userCvData.markdown === 'string') {
              setMarkdownState(userCvData.markdown);
              setEditMode('code');
            } else {
              setRawData(userCvData);
              setEditMode('form');
            }
          }
          setIsDirty(false);
          setSaveStatus('saved');
        }
      }
    };
    initSession();
  }, []);

  // 7. ACTIONS (Ahora resetean saveStatus a 'idle')

  const handleDataChange = (newData: CVData) => {
    setRawData(newData);
    setIsDirty(true);
    setSaveStatus('idle'); // Quitamos "Saved" porque ya cambió
  };

  const handleThemeChange = (theme: CvTheme) => {
    setActiveThemeId(theme.id);
    setCustomCSS(theme.css);
    setIsDirty(true);
    setSaveStatus('idle');
  };

  const handleMarkdownChange = (newMarkdown: string) => {
    setMarkdownState(newMarkdown);
    setIsDirty(true);
    setSaveStatus('idle');
  };

  const handleTitleChange = (newTitle: string) => {
    setResumeTitle(newTitle);
    setIsDirty(true);
    setSaveStatus('idle');
  };

  const handleReset = () => {
    if (confirm(t.actions.confirmReset)) {
      setRawData(initialCVData);
      handleThemeChange(themes[0]);
      setEditMode('form');
      setIsDirty(true);
      setSaveStatus('idle');
    }
  };

  const handleSave = useCallback(async () => {
    // NUEVO: Bloqueo de seguridad
    // Si ya estamos guardando, o NO hay cambios y ya está guardado, no hacemos nada.
    if (saveStatus === 'saving' || (!isDirty && saveStatus === 'saved')) {
      return;
    }

    setSaveStatus('saving');
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert('Debes iniciar sesión para guardar tu progreso en la nube.');
      setSaveStatus('idle');
      return;
    }

    let finalTitle = resumeTitle;
    let dataPayload = cvData;

    if (editMode === 'code') {
      dataPayload = { mode: 'markdown', markdown } as unknown as CVData;
      if (!finalTitle) {
        const h1Match = markdown.match(/^#\s+(.*)/);
        finalTitle = h1Match ? h1Match[1].trim() : 'Markdown CV';
      }
    } else {
      if (!finalTitle) finalTitle = cvData.personal.role || 'Mi CV';
    }

    const payload = {
      user_id: user.id,
      title: finalTitle,
      data: dataPayload,
      language: lang,
      theme: activeThemeId,
      updated_at: new Date().toISOString(),
    };

    try {
      if (resumeId) {
        const { error } = await supabase.from('resumes').update(payload).eq('id', resumeId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('resumes').insert(payload).select().single();
        if (error) throw error;
        if (data) setResumeId(data.id);
      }

      setSaveStatus('saved');
      setIsDirty(false);
      // ELIMINADO: setTimeout que reseteaba a idle. Ahora se queda en 'saved'.
    } catch (error) {
      console.error('Error saving CV:', error);
      setSaveStatus('error');
      alert('Error al guardar. Revisa tu conexión.');
    }
  }, [
    cvData,
    lang,
    activeThemeId,
    resumeId,
    setResumeId,
    resumeTitle,
    editMode,
    markdown,
    isDirty,
    saveStatus,
  ]); // Añadidos isDirty y saveStatus

  const handleAiAction = async (action: 'enhance' | 'optimize' | 'translate') => {
    setIsAiProcessing(true);
    try {
      let jobDescription = '';
      if (action === 'optimize') {
        const promptText =
          (t.ai as { jobDescriptionPrompt?: string }).jobDescriptionPrompt ||
          'Pega aquí la descripción del trabajo:';
        jobDescription = prompt(promptText) || '';
        if (!jobDescription) {
          setIsAiProcessing(false);
          return;
        }
      }

      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, cvData, lang, jobDescription }),
      });

      if (!response.ok) throw new Error(`Error en la API: ${response.statusText}`);
      const newCvData = await response.json();
      if (!newCvData || !newCvData.personal) throw new Error('Respuesta inválida.');

      setRawData(newCvData);
      setIsDirty(true);
      setSaveStatus('idle'); // La IA cambió datos, ya no estamos guardados

      const successMsg = {
        enhance: t.ai.alerts.enhance,
        translate: t.ai.alerts.translate,
        optimize: t.ai.alerts.optimize,
      }[action];
      alert(successMsg);
    } catch (error) {
      console.error('AI Action Error:', error);
      alert('Hubo un error al procesar tu solicitud con IA.');
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleAtsAnalysis = async (jd: string) => {
    try {
      // Usamos el estado 'markdown' que ya está sincronizado
      const response = await fetch('/api/ats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobDescription: jd,
          cvMarkdown: markdown,
        }),
      });

      if (!response.ok) throw new Error('Error analyzing ATS');
      return await response.json();
    } catch (error) {
      console.error(error);
      alert('Error connecting to ATS Simulator');
      return null;
    }
  };

  const handleGenerateCoverLetter = async (jd: string) => {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cover_letter',
          cvData,
          lang,
          jobDescription: jd,
        }),
      });

      if (!response.ok) throw new Error('Error generando carta');

      const data = await response.json();
      return data.coverLetter || null;
    } catch (error) {
      console.error(error);
      alert('Error al generar la Cover Letter. Intenta de nuevo.');
      return null;
    }
  };

  return {
    cvData,
    handleDataChange,
    activeThemeId,
    handleThemeChange,
    customCSS,
    setCustomCSS,
    markdown,
    setMarkdown: handleMarkdownChange,
    editMode,
    setEditMode,
    isAiProcessing,
    handleAiAction,
    saveStatus,
    handleSave,
    handleReset,
    resumeTitle,
    setResumeTitle: handleTitleChange,
    resumeId,
    isDirty,
    isAtsModalOpen,
    setIsAtsModalOpen,
    handleAtsAnalysis,
    isCoverLetterOpen,
    setIsCoverLetterOpen,
    handleGenerateCoverLetter,
  };
}
