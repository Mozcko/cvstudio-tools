import React, { useEffect, useState } from 'react';
import useTranslation from '../../../hooks/useTranslation';
import Navbar from '../EditorToolbar';
import { useCVLogic } from './hooks/useCVLogic';
import { usePrintPreview } from './hooks/usePrintPreview';
import EditorPanel from './components/EditorPanel';
import PreviewPanel from './components/PreviewPanel';
import MobileNavigation from './components/MobileNavigation';
import ATSModal from '../ATSModal';
import CoverLetterModal from '../CoverLetterModal';
import AuthRequiredModal from '../AuthRequiredModal';
import GuestBanner from '../GuestBanner';
import OptimizeModal from '../OptimizeModal';
import AIChoiceModal from '../AIChoiceModal';
import ImportModal from '../ImportModal';
import Toast from '../../ui/Toast';

const AUTOSAVE_DELAY_MS = 3000;

export default function CVBuilder() {
  const { t, lang, toggleLang } = useTranslation();
  const safeLang = lang as 'es' | 'en' | 'pt';
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor');
  const [isMounted, setIsMounted] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const cvLogic = useCVLogic(t, safeLang);
  const {
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
    shouldAutosave,
    isAtsModalOpen,
    setIsAtsModalOpen,
    handleAtsAnalysis,
    isCoverLetterOpen,
    setIsCoverLetterOpen,
    isOptimizeModalOpen,
    setIsOptimizeModalOpen,
    isChoiceModalOpen,
    setIsChoiceModalOpen,
    handleChoiceApplied,
    handleGenerateCoverLetter,
    handleImport,
    getAuthToken,
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
    isGuest,
    isPro,
    freeAiRemaining,
    isAuthModalOpen,
    setIsAuthModalOpen,
    triggerAuthModal,
    authModalConfig,
    toasts,
    removeToast,
    isInitializing,
  } = cvLogic;

  const fileTitle = `${(cvData.personal.name || 'CV').trim().replace(/\s+/g, '_')}_CV`;
  const printPreview = usePrintPreview(customCSS, fileTitle);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const handlePrint = () => {
    if (isGuest) {
      triggerAuthModal(t.messages.authTitle, t.messages.signInToDownload);
      return;
    }
    printPreview.print();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase();
        if (key === 's') {
          e.preventDefault();
          handleSave();
        } else if (key === 'z') {
          e.preventDefault();
          if (e.shiftKey) {
            handleRedo();
          } else {
            handleUndo();
          }
        } else if (key === 'y') {
          e.preventDefault();
          handleRedo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, handleUndo, handleRedo]);

  // Autosave a few seconds after the last change (the hook decides when it is allowed)
  useEffect(() => {
    if (!shouldAutosave) return;
    const timer = setTimeout(() => handleSave(), AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [shouldAutosave, handleSave]);

  if (!isMounted || isInitializing)
    return (
      <div className="bg-app-bg flex h-screen items-center justify-center text-slate-400">
        {t.messages.loading}
      </div>
    );

  return (
    <div className="bg-app-bg text-text-main flex h-dvh flex-col overflow-hidden font-sans">
      {isGuest && <GuestBanner t={t} onSignUp={() => triggerAuthModal()} />}
      <div className="bg-panel-bg border-panel-border z-50 shrink-0 border-b">
        <Navbar
          t={t}
          lang={safeLang}
          toggleLang={toggleLang}
          onReset={handleReset}
          onImport={() => setIsImportOpen(true)}
          onPrint={handlePrint}
          isAiProcessing={isAiProcessing}
          onAiAction={(action) => {
            if (action === 'optimize') setIsOptimizeModalOpen(true);
            else handleAiAction(action);
          }}
          onSave={handleSave}
          saveStatus={saveStatus}
          resumeTitle={resumeTitle}
          onTitleChange={setResumeTitle}
          onAtsSimulator={() => setIsAtsModalOpen(true)}
          onCoverLetter={() => setIsCoverLetterOpen(true)}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          isPro={isPro}
          freeAiRemaining={freeAiRemaining}
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
          pageCount={printPreview.pageCount}
          sheetHeight={printPreview.sheetHeight}
          t={t}
          markdown={markdown}
          sourceRef={printPreview.sourceRef}
          isVisible={mobileTab === 'preview'}
        />
      </main>

      <ATSModal
        isOpen={isAtsModalOpen}
        onClose={() => setIsAtsModalOpen(false)}
        t={t}
        onAnalyze={handleAtsAnalysis}
      />
      <CoverLetterModal
        isOpen={isCoverLetterOpen}
        onClose={() => setIsCoverLetterOpen(false)}
        t={t}
        onGenerate={handleGenerateCoverLetter}
      />
      <OptimizeModal
        isOpen={isOptimizeModalOpen}
        onClose={() => setIsOptimizeModalOpen(false)}
        t={t}
        onOptimize={(jd) => handleAiAction('optimize', jd)}
        isProcessing={isAiProcessing}
      />

      <AIChoiceModal
        isOpen={isChoiceModalOpen}
        onClose={() => setIsChoiceModalOpen(false)}
        onChoice={handleChoiceApplied}
        t={t}
      />

      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        t={t}
        lang={safeLang}
        getToken={getAuthToken}
        onImported={handleImport}
        replacesContent
      />

      <AuthRequiredModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        t={t}
        {...authModalConfig}
      />

      <MobileNavigation mobileTab={mobileTab} setMobileTab={setMobileTab} t={t} />

      {/* Toast Notifications container */}
      <div className="pointer-events-none fixed inset-0 z-[200] flex flex-col items-center justify-end gap-2 p-8">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
}
