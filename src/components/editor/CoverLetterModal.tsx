import React, { useState } from 'react';
import type { Translation } from '../../i18n/locales';

interface CoverLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: Translation;
  onGenerate: (jd: string) => Promise<string | null>;
}

export default function CoverLetterModal({
  isOpen,
  onClose,
  t,
  onGenerate,
}: CoverLetterModalProps) {
  const [jd, setJd] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!jd.trim()) {
      alert(t.ai.coverLetter.emptyWarning);
      return;
    }
    setLoading(true);
    const text = await onGenerate(jd);
    if (text) setResult(text);
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = () => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    // Formateo básico para negritas de Markdown si la IA las incluye
    const formattedText = result.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

    const html = `
      <html>
        <head>
          <title>Cover Letter</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&display=swap');
            body {
              font-family: 'Merriweather', 'Times New Roman', serif; /* Harvard Classic Style */
              line-height: 1.6;
              color: #000;
              max-width: 800px;
              margin: 0 auto;
              padding: 40px;
              font-size: 11pt;
            }
            .content {
              white-space: pre-wrap;
            }
            @media print {
              @page { margin: 0; }
              body { 
                margin: 2cm;
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="content">${formattedText}</div>
        </body>
      </html>
    `;

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between rounded-t-xl border-b border-slate-700 bg-slate-800/50 p-5">
          <h2 className="flex items-center gap-2 text-xl font-bold text-white">
            📝 {t.ai.coverLetter.title}
          </h2>
          <button onClick={onClose} className="text-slate-400 transition-colors hover:text-white">
            ✕
          </button>
        </div>

        <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-6">
          {!result ? (
            // STATE 1: INPUT
            <div className="space-y-4">
              <p className="text-sm text-slate-300">{t.ai.coverLetter.description}</p>
              <textarea
                className="h-60 w-full resize-none rounded-lg border border-slate-700 bg-slate-950 p-4 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-purple-500"
                placeholder={t.ai.coverLetter.placeholder}
                value={jd}
                onChange={(e) => setJd(e.target.value)}
              />
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-linear-to-r from-purple-600 to-indigo-600 py-3 font-bold text-white shadow-lg shadow-purple-900/20 transition-all hover:from-purple-500 hover:to-indigo-500"
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⏳</span> {t.ai.coverLetter.generating}
                  </>
                ) : (
                  <>{t.ai.coverLetter.generate}</>
                )}
              </button>
            </div>
          ) : (
            // STATE 2: RESULT
            <div className="flex h-full flex-col space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-green-400">✨ Generada exitosamente</p>
                <button
                  onClick={() => setResult('')}
                  className="text-xs text-slate-500 underline hover:text-slate-300"
                >
                  Generar nueva
                </button>
              </div>

              <textarea
                className="min-h-100 w-full flex-1 resize-y rounded-lg border border-slate-700 bg-slate-950 p-6 font-serif text-sm leading-relaxed text-slate-200 outline-none focus:border-purple-500"
                value={result}
                onChange={(e) => setResult(e.target.value)}
              />

              <div className="flex gap-3">
                <button
                  onClick={handleCopy}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-3 font-bold transition-all ${copied ? 'border-green-500 bg-green-900/20 text-green-400' : 'border-slate-600 bg-slate-800 text-white hover:bg-slate-700'}`}
                >
                  {copied ? '✅ ' + t.ai.coverLetter.copied : '📋 ' + t.ai.coverLetter.copy}
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-800 py-3 font-bold text-white transition-all hover:bg-slate-700"
                >
                  📄 {t.header.download}
                </button>
                <button
                  onClick={onClose}
                  className="rounded-lg border border-slate-700 px-6 py-3 font-bold text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                >
                  {t.actions.close}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
