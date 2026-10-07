import React, { useRef, useState } from 'react';
import type { Translation } from '../../i18n/locales';
import { localePrefixFromPath } from '../../i18n/utils';
import type { CVLang } from '../../types/cv';
import {
  ACCEPTED_EXTENSIONS,
  ImportError,
  prepareImport,
  runAiImport,
  type ImportErrorCode,
  type ImportResult,
} from '../../lib/import';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: Translation;
  lang: CVLang;
  /** Resolves to null for guests. Only called when the file needs the AI. */
  getToken: () => Promise<string | null>;
  /** Receives the imported CV. The modal closes when this settles; a rejection is shown as an error. */
  onImported: (result: ImportResult, fileName: string) => void | Promise<void>;
  /** Shown in the editor, where importing overwrites the CV that is open. */
  replacesContent?: boolean;
}

type Status = 'idle' | 'reading' | 'analyzing' | 'creating';

export default function ImportModal({
  isOpen,
  onClose,
  t,
  lang,
  getToken,
  onImported,
  replacesContent = false,
}: ImportModalProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<ImportErrorCode | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const busy = status !== 'idle';
  const langPrefix = localePrefixFromPath();

  const close = () => {
    if (busy) return;
    setError(null);
    onClose();
  };

  const handleFile = async (file: File | undefined) => {
    if (!file || busy) return;
    setError(null);
    try {
      setStatus('reading');
      const prepared = await prepareImport(file, lang);
      let result: ImportResult;
      if (prepared.kind === 'ready') {
        result = prepared.result;
      } else {
        const token = await getToken();
        // Checked before the "analysing" state so guests are not shown a spinner first
        if (!token) throw new ImportError('needsAuth');
        setStatus('analyzing');
        result = await runAiImport(prepared, lang, token);
      }
      setStatus('creating');
      await onImported(result, file.name);
      setStatus('idle');
      onClose();
    } catch (err) {
      if (!(err instanceof ImportError)) console.error(err);
      setError(err instanceof ImportError ? err.code : 'failed');
      setStatus('idle');
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const statusText = {
    idle: '',
    reading: t.import.reading,
    analyzing: t.import.analyzing,
    creating: t.import.creating,
  }[status];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={close}
        onKeyDown={(e) => e.key === 'Enter' && close()}
        role="button"
        tabIndex={0}
        aria-label={t.actions.close}
      />

      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl md:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-title"
      >
        <h2 id="import-title" className="mb-1 text-2xl font-bold text-white">
          {t.import.title}
        </h2>
        <p className="mb-5 text-sm text-slate-400">{t.import.description}</p>

        {replacesContent && (
          <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
            {t.import.replaceWarning}
          </p>
        )}

        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFile(e.dataTransfer.files[0]);
          }}
          className={`flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors disabled:cursor-wait ${
            isDragging
              ? 'border-blue-400 bg-blue-500/10'
              : 'border-slate-600 bg-slate-800/40 hover:border-blue-500'
          }`}
        >
          {busy ? (
            <span
              className="flex items-center gap-2 text-sm font-medium text-blue-300"
              role="status"
            >
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
              {statusText}
            </span>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-8 w-8 text-slate-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                />
              </svg>
              <span className="text-sm font-medium text-slate-200">{t.import.dropzone}</span>
              <span className="text-xs text-slate-500">{t.import.formats}</span>
            </>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          className="hidden"
          data-testid="import-input"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        {error && (
          <div
            className="mt-4 rounded-lg border border-red-900/50 bg-red-900/10 px-3 py-2 text-sm text-red-300"
            role="alert"
            data-testid="import-error"
          >
            <p>{t.import.errors[error]}</p>
            {error === 'needsAuth' && (
              <a href={`${langPrefix}/sign-in`} className="mt-1 inline-block font-bold underline">
                {t.messages.signIn}
              </a>
            )}
            {error === 'limit' && (
              <a href={`${langPrefix}/pricing`} className="mt-1 inline-block font-bold underline">
                {t.messages.upgrade}
              </a>
            )}
          </div>
        )}

        <div className="mt-5 space-y-2 text-xs text-slate-500">
          <p>{t.import.aiNote}</p>
          <p>{t.import.privacy}</p>
          <details>
            <summary className="cursor-pointer text-slate-400 hover:text-slate-200">
              {t.import.linkedinTitle}
            </summary>
            <p className="mt-1">{t.import.linkedinHelp}</p>
          </details>
        </div>

        <button
          onClick={close}
          disabled={busy}
          className="mt-6 w-full rounded-xl border border-slate-700 py-2.5 text-sm font-bold text-slate-400 transition-colors hover:bg-slate-800 hover:text-white disabled:opacity-40"
        >
          {t.actions.close}
        </button>
      </div>
    </div>
  );
}
