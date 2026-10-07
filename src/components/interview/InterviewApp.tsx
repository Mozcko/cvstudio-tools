import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@clerk/astro/react';
import { api, type CVRecord, type InterviewSession, type InterviewSummary } from '../../lib/api';
import { locales, type Translation } from '../../i18n/locales';
import { localePrefixFromPath } from '../../i18n/utils';
import { isMarkdownContent, type CVData, type CVLang } from '../../types/cv';
import useProStatus from '../../hooks/useProStatus';
import useInterview, { type InterviewPhase } from '../../hooks/useInterview';
import useRecorder, { canRecord, MAX_RECORDING_SECONDS } from '../../hooks/useRecorder';

const LANGS: CVLang[] = ['es', 'en', 'pt'];
const LANGUAGE_NAMES: Record<CVLang, string> = { es: 'Español', en: 'English', pt: 'Português' };
const QUESTION_COUNTS = [4, 6, 8];
const MIN_JOB_CHARS = 20;

const card = 'rounded-2xl border border-slate-700 bg-slate-800/60 p-6 md:p-8';
const primaryButton =
  'rounded-lg bg-blue-600 px-5 py-2.5 font-bold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40';
const quietButton =
  'rounded-lg border border-slate-600 px-4 py-2 text-sm font-bold text-slate-200 transition-colors hover:border-slate-400 hover:text-white disabled:opacity-40';

const formatDate = (iso: string, lang: string) =>
  new Date(iso).toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' });

// ── Upsell ───────────────────────────────────────────────────────────────────

function Upsell({ t }: { t: Translation }) {
  return (
    <div className={`${card} mx-auto max-w-xl text-center`} data-testid="interview-upsell">
      <div className="mb-3 text-4xl">🎙️</div>
      <h2 className="mb-2 text-2xl font-bold text-white">{t.interview.upsell.title}</h2>
      <p className="mb-5 text-slate-400">{t.interview.upsell.description}</p>
      <ul className="mx-auto mb-6 max-w-sm space-y-2 text-left text-sm text-slate-300">
        {t.interview.upsell.points.map((point) => (
          <li key={point} className="flex gap-2">
            <span className="text-emerald-400">✓</span> {point}
          </li>
        ))}
      </ul>
      <a href={`${localePrefixFromPath()}/pricing`} className={`${primaryButton} inline-block`}>
        {t.interview.upsell.action}
      </a>
    </div>
  );
}

// ── Setup ────────────────────────────────────────────────────────────────────

function Setup({
  t,
  lang,
  cvs,
  remainingToday,
  busy,
  onStart,
}: {
  t: Translation;
  lang: CVLang;
  cvs: CVRecord[];
  remainingToday: number | null;
  busy: boolean;
  onStart: (cv: CVData, job: string, language: CVLang, count: number) => void;
}) {
  const usable = useMemo(() => cvs.filter((cv) => !isMarkdownContent(cv.content)), [cvs]);
  const preselected =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('cv') : null;
  const [cvId, setCvId] = useState<string>(
    usable.find((cv) => cv.id === preselected)?.id ?? usable[0]?.id ?? ''
  );
  const [job, setJob] = useState('');
  const [language, setLanguage] = useState<CVLang>(lang);
  const [count, setCount] = useState(6);

  const chosen = usable.find((cv) => cv.id === cvId);
  const outOfInterviews = remainingToday !== null && remainingToday <= 0;
  const ready = !!chosen && job.trim().length >= MIN_JOB_CHARS && !busy && !outOfInterviews;
  const field =
    'w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-500';
  const label = 'mb-1 block text-xs font-bold tracking-wider text-slate-400 uppercase';

  if (cvs.length === 0) {
    return (
      <div className={`${card} text-center`}>
        <p className="mb-4 text-slate-400">{t.interview.setup.noCvs}</p>
        <a
          href={`${localePrefixFromPath()}/app/dashboard`}
          className={`${primaryButton} inline-block`}
        >
          {t.ui.nav.dashboard}
        </a>
      </div>
    );
  }

  return (
    <form
      className={`${card} space-y-5`}
      onSubmit={(event) => {
        event.preventDefault();
        if (ready && chosen) onStart(chosen.content as CVData, job.trim(), language, count);
      }}
    >
      <div>
        <label className={label} htmlFor="interview-cv">
          {t.interview.setup.cv}
        </label>
        <select
          id="interview-cv"
          className={field}
          value={cvId}
          onChange={(event) => setCvId(event.target.value)}
        >
          {!chosen && <option value="">{t.interview.setup.cvPlaceholder}</option>}
          {cvs.map((cv) => {
            const markdown = isMarkdownContent(cv.content);
            return (
              <option key={cv.id} value={cv.id} disabled={markdown}>
                {cv.title || t.dashboard.untitled} {markdown ? t.interview.setup.markdownCv : ''}
              </option>
            );
          })}
        </select>
      </div>

      <div>
        <label className={label} htmlFor="interview-job">
          {t.interview.setup.job}
        </label>
        <textarea
          id="interview-job"
          className={`${field} min-h-40 resize-y`}
          value={job}
          maxLength={20000}
          onChange={(event) => setJob(event.target.value)}
          placeholder={t.interview.setup.jobPlaceholder}
        />
        <p className="mt-1 text-xs text-slate-500">{t.interview.setup.jobHint}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="interview-language">
            {t.interview.setup.language}
          </label>
          <select
            id="interview-language"
            className={field}
            value={language}
            onChange={(event) => setLanguage(event.target.value as CVLang)}
          >
            {LANGS.map((code) => (
              <option key={code} value={code}>
                {LANGUAGE_NAMES[code]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="interview-count">
            {t.interview.setup.questions}
          </label>
          <select
            id="interview-count"
            className={field}
            value={count}
            onChange={(event) => setCount(Number(event.target.value))}
          >
            {QUESTION_COUNTS.map((n) => (
              <option key={n} value={n}>
                {n} · {t.interview.setup.duration.replace('{n}', String(n * 2))}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1 text-xs text-slate-500">
          <p>{t.interview.setup.micNote}</p>
          {remainingToday !== null && (
            <p className={outOfInterviews ? 'text-amber-400' : ''}>
              {outOfInterviews
                ? t.interview.errors.dailyLimit
                : t.interview.setup.remaining.replace('{n}', String(remainingToday))}
            </p>
          )}
        </div>
        <button
          type="submit"
          className={primaryButton}
          disabled={!ready}
          data-testid="interview-start"
        >
          {busy ? t.interview.setup.preparing : t.interview.setup.start}
        </button>
      </div>
    </form>
  );
}

// ── Room ─────────────────────────────────────────────────────────────────────

function Room({
  t,
  session,
  phase,
  needsTap,
  voiceOn,
  onToggleVoice,
  onSubmit,
  onReplay,
  onSkip,
  onEnd,
}: {
  t: Translation;
  session: InterviewSession;
  phase: InterviewPhase;
  needsTap: boolean;
  voiceOn: boolean;
  onToggleVoice: () => void;
  onSubmit: (answer: Blob | string) => void;
  onReplay: () => void;
  onSkip: () => void;
  onEnd: () => void;
}) {
  const recorder = useRecorder((recording) => {
    // The two-minute limit was reached: send what there is
    if (recording) onSubmit(recording);
  });
  const [typing, setTyping] = useState(() => !canRecord());
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const micUnavailable = recorder.status === 'denied' || recorder.status === 'unsupported';
  const typed = typing || micUnavailable;
  const listening = phase === 'listening';
  const recording = recorder.status === 'recording';

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' });
  }, [session.turns.length, phase]);

  const toggleRecording = async () => {
    if (recording) {
      const result = await recorder.stop();
      if (result) onSubmit(result);
    } else {
      await recorder.start();
    }
  };

  const sendText = () => {
    if (!text.trim()) return;
    onSubmit(text.trim());
    setText('');
  };

  const status = {
    speaking: t.interview.room.speaking,
    listening: recording ? t.interview.room.recording : t.interview.room.listening,
    thinking: t.interview.room.thinking,
    finishing: t.interview.room.finishing,
  }[phase as 'speaking' | 'listening' | 'thinking' | 'finishing'];

  const shown = Math.min(session.current_question + 1, session.question_count);

  return (
    <div className={`${card} flex flex-col gap-4`} data-testid="interview-room">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 pb-3">
        <div>
          <p className="text-xs font-bold tracking-wider text-blue-400 uppercase">
            {t.interview.room.progress
              .replace('{n}', String(shown))
              .replace('{total}', String(session.question_count))}
          </p>
          {session.title && <p className="text-sm text-slate-300">{session.title}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={quietButton}
            onClick={onToggleVoice}
            aria-pressed={voiceOn}
          >
            {voiceOn ? `🔊 ${t.interview.room.voiceOn}` : `🔇 ${t.interview.room.voiceOff}`}
          </button>
          <button
            type="button"
            className="rounded-lg px-3 py-2 text-sm font-bold text-red-300 transition-colors hover:bg-red-500/10"
            disabled={phase === 'finishing' || phase === 'thinking'}
            onClick={() => {
              if (window.confirm(t.interview.room.confirmEnd)) onEnd();
            }}
          >
            {t.interview.room.end}
          </button>
        </div>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-slate-700" aria-hidden="true">
        <div
          className="h-full bg-blue-500 transition-all"
          style={{ width: `${(session.current_question / session.question_count) * 100}%` }}
        />
      </div>

      <ol className="max-h-[45vh] space-y-3 overflow-y-auto pr-1" aria-live="polite">
        {session.turns.map((turn) => (
          <li
            key={turn.index}
            className={`flex ${turn.role === 'candidate' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                turn.role === 'candidate'
                  ? 'rounded-br-sm bg-blue-600 text-white'
                  : 'rounded-bl-sm bg-slate-700 text-slate-100'
              }`}
            >
              <p className="mb-0.5 text-[10px] font-bold tracking-wider uppercase opacity-70">
                {turn.role === 'candidate' ? t.interview.room.you : t.interview.room.recruiter}
              </p>
              <p className="whitespace-pre-wrap">{turn.text}</p>
            </div>
          </li>
        ))}
        <div ref={endRef} />
      </ol>

      <div className="border-t border-slate-700 pt-4">
        <p
          className="mb-3 flex items-center justify-center gap-2 text-sm font-medium text-slate-300"
          role="status"
        >
          {(phase === 'thinking' || phase === 'finishing') && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
          )}
          {recording && <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />}
          {status}
          {recording && (
            <span className="text-slate-500 tabular-nums">
              {recorder.seconds}s / {MAX_RECORDING_SECONDS}s
            </span>
          )}
        </p>

        {phase === 'speaking' && (
          <div className="flex justify-center gap-2">
            {needsTap && (
              <button type="button" className={primaryButton} onClick={onReplay}>
                ▶ {t.interview.room.play}
              </button>
            )}
            <button type="button" className={quietButton} onClick={onSkip}>
              {t.interview.room.skip}
            </button>
          </div>
        )}

        {listening && micUnavailable && (
          <p className="mb-3 text-center text-xs text-amber-400">
            {recorder.status === 'denied'
              ? t.interview.room.micDenied
              : t.interview.room.micUnsupported}
          </p>
        )}

        {listening && !typed && (
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={toggleRecording}
              data-testid="interview-record"
              className={`flex h-20 w-20 items-center justify-center rounded-full text-3xl shadow-lg transition-all ${
                recording
                  ? 'bg-red-600 shadow-red-900/40 hover:bg-red-500'
                  : 'bg-blue-600 shadow-blue-900/40 hover:bg-blue-500'
              }`}
              aria-label={recording ? t.interview.room.stop : t.interview.room.record}
            >
              {recording ? '■' : '🎙️'}
            </button>
            <p className="text-xs text-slate-400">
              {recording ? t.interview.room.stop : t.interview.room.record}
            </p>
          </div>
        )}

        {listening && typed && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <textarea
              className="min-h-20 flex-1 resize-y rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
              value={text}
              maxLength={4000}
              onChange={(event) => setText(event.target.value)}
              placeholder={t.interview.room.typePlaceholder}
              data-testid="interview-text"
            />
            <button
              type="button"
              className={primaryButton}
              disabled={!text.trim()}
              onClick={sendText}
            >
              {t.interview.room.send}
            </button>
          </div>
        )}

        {listening && !recording && (
          <div className="mt-3 flex flex-wrap justify-center gap-3 text-xs">
            {voiceOn && (
              <button
                type="button"
                className="text-slate-400 underline hover:text-white"
                onClick={onReplay}
              >
                {t.interview.room.replay}
              </button>
            )}
            {!micUnavailable && canRecord() && (
              <button
                type="button"
                className="text-slate-400 underline hover:text-white"
                onClick={() => setTyping((current) => !current)}
              >
                {typing ? t.interview.room.useMic : t.interview.room.typeInstead}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Report ───────────────────────────────────────────────────────────────────

function Report({
  t,
  session,
  onAgain,
}: {
  t: Translation;
  session: InterviewSession;
  onAgain: () => void;
}) {
  const report = session.report;
  if (!report) return null;

  const scoreColor =
    report.overall_score >= 75
      ? 'text-emerald-400'
      : report.overall_score >= 50
        ? 'text-amber-400'
        : 'text-red-400';
  const answersTo = (question: number) =>
    session.turns
      .filter((turn) => turn.role === 'candidate' && turn.question === question)
      .map((turn) => turn.text)
      .join('\n\n');
  const list = (title: string, items: string[], color: string) =>
    items.length > 0 && (
      <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
        <h3 className={`mb-2 text-sm font-bold ${color}`}>{title}</h3>
        <ul className="list-inside list-disc space-y-1 text-sm text-slate-300">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    );

  return (
    <div className="space-y-6" data-testid="interview-report">
      <div
        className={`${card} flex flex-col items-center gap-4 text-center md:flex-row md:text-left`}
      >
        <div className="shrink-0">
          <p className={`text-6xl font-black tabular-nums ${scoreColor}`}>{report.overall_score}</p>
          <p className="text-xs font-bold tracking-wider text-slate-500 uppercase">
            {t.interview.report.overall}
          </p>
        </div>
        <div>
          <h2 className="mb-1 text-xl font-bold text-white">
            {session.title || t.interview.report.title}
          </h2>
          <p className="text-sm text-slate-300">{report.summary}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {list(t.interview.report.strengths, report.strengths, 'text-emerald-400')}
        {list(t.interview.report.improvements, report.improvements, 'text-amber-400')}
        {list(t.interview.report.tips, report.tips, 'text-blue-400')}
      </div>

      {report.answers.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-white">{t.interview.report.answers}</h3>
          {report.answers.map((feedback) => (
            <details
              key={feedback.question}
              className={`${card} !p-5`}
              open={report.answers.length <= 4}
            >
              <summary className="flex cursor-pointer items-start justify-between gap-3">
                <span className="text-sm font-bold text-white">
                  <span className="mr-2 text-blue-400">
                    {t.interview.report.question.replace('{n}', String(feedback.question + 1))}
                  </span>
                  {session.questions[feedback.question] || ''}
                </span>
                <span className="shrink-0 rounded bg-slate-700 px-2 py-0.5 text-xs font-bold text-white tabular-nums">
                  {feedback.score}/10
                </span>
              </summary>
              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <p className="mb-1 text-xs font-bold tracking-wider text-slate-500 uppercase">
                    {t.interview.report.yourAnswer}
                  </p>
                  <p className="whitespace-pre-wrap text-slate-400">
                    {answersTo(feedback.question)}
                  </p>
                </div>
                {feedback.went_well && (
                  <p className="text-slate-300">
                    <strong className="text-emerald-400">{t.interview.report.wentWell}: </strong>
                    {feedback.went_well}
                  </p>
                )}
                {feedback.improve && (
                  <p className="text-slate-300">
                    <strong className="text-amber-400">{t.interview.report.improve}: </strong>
                    {feedback.improve}
                  </p>
                )}
                {feedback.sample_answer && (
                  <div className="rounded-lg border border-blue-500/30 bg-blue-900/20 p-3">
                    <p className="mb-1 text-xs font-bold tracking-wider text-blue-400 uppercase">
                      {t.interview.report.sample}
                    </p>
                    <p className="whitespace-pre-wrap text-slate-200">{feedback.sample_answer}</p>
                  </div>
                )}
              </div>
            </details>
          ))}
        </div>
      )}

      <div className="flex justify-center">
        <button type="button" className={primaryButton} onClick={onAgain}>
          {t.interview.report.again}
        </button>
      </div>
    </div>
  );
}

// ── History ──────────────────────────────────────────────────────────────────

function History({
  t,
  lang,
  items,
  onOpen,
  onDelete,
}: {
  t: Translation;
  lang: string;
  items: InterviewSummary[];
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <section className="mt-10" data-testid="interview-history">
      <h2 className="mb-3 text-lg font-bold text-white">{t.interview.history.title}</h2>
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-500">
          {t.interview.history.empty}
        </p>
      ) : (
        <ul className="divide-y divide-slate-700 rounded-xl border border-slate-700">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-4 py-3">
              <span
                className={`w-12 shrink-0 text-center text-lg font-black tabular-nums ${
                  item.overall_score === null ? 'text-slate-600' : 'text-white'
                }`}
              >
                {item.overall_score ?? '—'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">
                  {item.title || t.interview.history.untitled}
                </p>
                <p className="text-xs text-slate-500">
                  {formatDate(item.created_at, lang)}
                  {item.status !== 'completed' && ` · ${t.interview.history.inProgress}`}
                </p>
              </div>
              <button type="button" className={quietButton} onClick={() => onOpen(item.id)}>
                {t.interview.history.open}
              </button>
              <button
                type="button"
                className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-700 hover:text-red-400"
                title={t.interview.history.delete}
                aria-label={t.interview.history.delete}
                onClick={() => {
                  if (window.confirm(t.interview.history.confirmDelete)) onDelete(item.id);
                }}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function InterviewApp({ lang = 'es' }: { lang?: string }) {
  const safeLang = (LANGS.includes(lang as CVLang) ? lang : 'es') as CVLang;
  const t: Translation = locales[safeLang];
  const { getToken, userId, isLoaded } = useAuth();
  const { isPremium, usage, loading: loadingPlan } = useProStatus();
  const interview = useInterview(getToken);

  const [cvs, setCvs] = useState<CVRecord[] | null>(null);
  const [history, setHistory] = useState<InterviewSummary[]>([]);
  const [loadFailed, setLoadFailed] = useState(false);
  const [startedHere, setStartedHere] = useState(0);

  const loadHistory = useCallback(async () => {
    try {
      setHistory(await api.listInterviews(await getToken()));
    } catch (err) {
      console.error(err);
    }
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded || !userId || loadingPlan || !isPremium) return;
    let cancelled = false;
    (async () => {
      try {
        const records = await api.getCVs(await getToken());
        if (!cancelled) setCvs(records || []);
      } catch (err) {
        console.error(err);
        if (!cancelled) setLoadFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, userId, loadingPlan, isPremium, getToken]);

  // The history is loaded on arrival and again whenever an interview is finished or left
  const phaseForHistory = interview.phase;
  useEffect(() => {
    if (!isPremium || (phaseForHistory !== 'report' && phaseForHistory !== 'setup')) return;
    const timer = setTimeout(() => loadHistory(), 0);
    return () => clearTimeout(timer);
  }, [isPremium, phaseForHistory, loadHistory]);

  const remainingToday =
    usage?.interviews_daily !== undefined
      ? Math.max(0, usage.interviews_daily.remaining - startedHere)
      : null;

  const { phase, session, error } = interview;
  const inRoom = session && ['speaking', 'listening', 'thinking', 'finishing'].includes(phase);

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-white">{t.interview.title}</h1>
        <p className="text-slate-400">{t.interview.subtitle}</p>
      </header>

      {!isLoaded || loadingPlan ? (
        <p className="animate-pulse py-10 text-center text-slate-500">{t.messages.loading}</p>
      ) : !isPremium || error === 'premium' ? (
        <Upsell t={t} />
      ) : (
        <>
          {error && (
            <div
              className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-red-900/50 bg-red-900/10 px-4 py-3 text-sm text-red-300"
              role="alert"
              data-testid="interview-error"
            >
              <span>{t.interview.errors[error]}</span>
              {phase === 'finishing' && session && (
                <button
                  type="button"
                  className={quietButton}
                  onClick={() => interview.finish(session)}
                >
                  {t.interview.room.retry}
                </button>
              )}
            </div>
          )}

          {inRoom && session ? (
            <Room
              t={t}
              session={session}
              phase={phase}
              needsTap={interview.needsTap}
              voiceOn={interview.voiceOn}
              onToggleVoice={() => interview.setVoiceOn(!interview.voiceOn)}
              onSubmit={interview.submit}
              onReplay={interview.replay}
              onSkip={interview.skipSpeech}
              onEnd={() => interview.finish(session)}
            />
          ) : phase === 'report' && session ? (
            <Report t={t} session={session} onAgain={interview.reset} />
          ) : loadFailed ? (
            <p className="py-10 text-center text-red-400">{t.interview.errors.load}</p>
          ) : cvs === null ? (
            <p className="animate-pulse py-10 text-center text-slate-500">{t.messages.loading}</p>
          ) : (
            <Setup
              t={t}
              lang={safeLang}
              cvs={cvs}
              remainingToday={remainingToday}
              busy={phase === 'starting'}
              onStart={async (cv, job, language, count) => {
                await interview.start({ cv, jobDescription: job, language, questionCount: count });
                setStartedHere((n) => n + 1);
              }}
            />
          )}

          {!inRoom && (
            <History
              t={t}
              lang={safeLang}
              items={history}
              onOpen={interview.open}
              onDelete={async (id) => {
                try {
                  await api.deleteInterview(id, await getToken());
                  setHistory((items) => items.filter((item) => item.id !== id));
                  if (session?.id === id) interview.reset();
                } catch (err) {
                  console.error(err);
                }
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
