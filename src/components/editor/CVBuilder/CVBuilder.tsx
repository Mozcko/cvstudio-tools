import React, { useEffect, useState } from 'react';
import useTranslation from '../../../hooks/useTranslation';
import Navbar from '../EditorToolbar';
import { useCVLogic } from './hooks/useCVLogic';
import { usePDFPreview } from './hooks/usePDFPreview';
import EditorPanel from './components/EditorPanel';
import PreviewPanel from './components/PreviewPanel';
import MobileNavigation from './components/MobileNavigation';

export default function CVBuilder() {
  const { t, lang, toggleLang } = useTranslation();
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor');
  const [windowWidth, setWindowWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 0
  );
  const [isMounted, setIsMounted] = useState(false);

  // Custom Hooks
  const cvLogic = useCVLogic(t, lang);
  const {
    resumeId,
    saveStatus,
    handleSave,
    cvData,
    markdown,
    customCSS,
    isAiProcessing,
    handleAiAction,
    handleReset,
    resumeTitle,
    setResumeTitle,
    editMode,
    setEditMode,
    activeThemeId,
    handleThemeChange,
    handleDataChange,
    setMarkdown,
  } = cvLogic;

  const pdfPreview = usePDFPreview(markdown, customCSS, mobileTab, windowWidth, cvData);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

  const handlePrint = async () => {
    if (mobileTab === 'editor' && windowWidth < 1024) {
      setMobileTab('preview');
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    pdfPreview.generatePDF('save');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  useEffect(() => {
    if (!resumeId || saveStatus === 'saving' || saveStatus === 'error' || saveStatus === 'saved')
      return;
    const timer = setTimeout(() => handleSave(), 3000);
    return () => clearTimeout(timer);
  }, [cvData, resumeId, saveStatus, handleSave]);

  if (!isMounted)
    return (
      <div className="bg-app-bg flex h-screen items-center justify-center text-slate-400">
        Cargando...
      </div>
    );

  return (
    <div className="bg-app-bg text-text-main flex h-dvh flex-col overflow-hidden font-sans print:h-auto print:bg-white">
      <div className="bg-panel-bg border-panel-border z-50 shrink-0 border-b">
        <Navbar
          t={t}
          lang={lang}
          toggleLang={toggleLang}
          onReset={handleReset}
          onPrint={handlePrint}
          isAiProcessing={isAiProcessing}
          onAiAction={handleAiAction}
          onSave={handleSave}
          saveStatus={saveStatus}
          resumeTitle={resumeTitle}
          onTitleChange={setResumeTitle}
        />
      </div>

      <main className="relative z-0 flex min-h-0 flex-1 flex-col lg:flex-row">
        <EditorPanel
          editMode={editMode}
          setEditMode={setEditMode}
          activeThemeId={activeThemeId}
          handleThemeChange={handleThemeChange}
          isAiProcessing={isAiProcessing}
          t={t}
          cvData={cvData}
          handleDataChange={handleDataChange}
          markdown={markdown}
          setMarkdown={setMarkdown}
          isVisible={mobileTab === 'editor'}
        />
        <PreviewPanel
          customCSS={customCSS}
          pageCount={pdfPreview.pageCount}
          t={t}
          markdown={markdown}
          isPdfLoading={pdfPreview.isPdfLoading}
          pdfUrl={pdfPreview.pdfUrl}
          windowWidth={windowWidth}
          sourceRef={pdfPreview.sourceRef as React.RefObject<HTMLDivElement>}
          isVisible={mobileTab === 'preview'}
        />
      </main>
      <MobileNavigation mobileTab={mobileTab} setMobileTab={setMobileTab} t={t} />
    </div>
  );
}
