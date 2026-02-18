import React, { useState } from 'react';
import type { Translation } from '../../i18n/locales';

interface ATSResult {
  final_ats_score: number;
  overall_interview_probability: number;
  tier_classification: string;
  hard_requirements_analysis: { requirement: string; status: string; comment: string }[];
  missing_keywords: string[];
  top_improvement_actions: string[];
}

interface ATSModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: Translation;
  onAnalyze: (jd: string) => Promise<ATSResult | null>;
}

export default function ATSModal({ isOpen, onClose, t, onAnalyze }: ATSModalProps) {
  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ATSResult | null>(null);

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    if (!jd.trim()) return;
    setLoading(true);
    const data = await onAnalyze(jd);
    setResult(data);
    setLoading(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400 border-green-500';
    if (score >= 60) return 'text-yellow-400 border-yellow-500';
    return 'text-red-400 border-red-500';
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-700 bg-slate-800/50 p-6 backdrop-blur-md">
          <h2 className="flex items-center gap-2 text-xl font-bold text-white">{t.ai.ats.title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-6 p-6">
          {!result ? (
            // Input Mode
            <div className="space-y-4">
              <p className="text-slate-300">{t.ai.ats.description}</p>
              <textarea
                className="h-64 w-full rounded-lg border border-slate-700 bg-slate-950 p-4 text-sm text-slate-200 outline-none focus:border-purple-500"
                placeholder={t.ai.ats.placeholder}
                value={jd}
                onChange={(e) => setJd(e.target.value)}
              />
              <button
                onClick={handleAnalyze}
                disabled={loading || !jd.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 py-3 font-bold text-white transition-all hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⏳</span> {t.ai.ats.analyzing}
                  </>
                ) : (
                  <>{t.ai.ats.analyze}</>
                )}
              </button>
            </div>
          ) : (
            // Results Mode
            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-500">
              {/* Score Cards */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div
                  className={`flex flex-col items-center justify-center rounded-lg border bg-slate-950/50 p-6 text-center ${getScoreColor(result.final_ats_score)}`}
                >
                  <span className="text-4xl font-black">{result.final_ats_score}/100</span>
                  <span className="mt-1 text-sm font-medium tracking-wider uppercase">
                    {t.ai.ats.score}
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center rounded-lg border border-slate-700 bg-slate-950/50 p-6 text-center text-blue-400">
                  <span className="text-4xl font-black">
                    {result.overall_interview_probability}%
                  </span>
                  <span className="mt-1 text-sm font-medium tracking-wider uppercase">
                    {t.ai.ats.probability}
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center rounded-lg border border-slate-700 bg-slate-950/50 p-6 text-center text-purple-400">
                  <span className="text-xl font-bold">{result.tier_classification}</span>
                  <span className="mt-1 text-sm font-medium tracking-wider uppercase">
                    Nivel Competitivo
                  </span>
                </div>
              </div>

              {/* Hard Requirements */}
              <div>
                <h3 className="mb-3 text-lg font-bold text-white">{t.ai.ats.requirements}</h3>
                <div className="space-y-2">
                  {result.hard_requirements_analysis.map((req, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded border border-slate-700 bg-slate-800/50 p-3"
                    >
                      <span className="mt-1">
                        {req.status === 'match' ? '✅' : req.status === 'missing' ? '❌' : '⚠️'}
                      </span>
                      <div>
                        <p className="font-medium text-slate-200">{req.requirement}</p>
                        <p className="text-xs text-slate-400">{req.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Missing Keywords */}
                <div className="rounded-lg border border-red-900/30 bg-red-900/10 p-4">
                  <h3 className="mb-3 font-bold text-red-400">🔑 {t.ai.ats.missingKeywords}</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.missing_keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="rounded border border-red-800 bg-red-900/30 px-2 py-1 text-xs text-red-200"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="rounded-lg border border-blue-900/30 bg-blue-900/10 p-4">
                  <h3 className="mb-3 font-bold text-blue-400">🚀 {t.ai.ats.improvements}</h3>
                  <ul className="list-inside list-disc space-y-1 text-sm text-slate-300">
                    {result.top_improvement_actions.map((act, i) => (
                      <li key={i}>{act}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <button
                onClick={() => {
                  setResult(null);
                  setJd('');
                }}
                className="w-full rounded border border-slate-600 bg-slate-800 py-2 text-slate-300 transition-colors hover:bg-slate-700"
              >
                ← Analizar otra oferta
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
