import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/astro/react';
import { api, isApiError, type RecruiterStatus, type ScreeningSummary } from '../../lib/api';
import { locales, type Translation } from '../../i18n/locales';
import type { CVLang } from '../../types/cv';
import RecruiterPlans from './RecruiterPlans';
import ScreeningView from './ScreeningView';
import UsageMeter from './UsageMeter';
import {
  blockedState,
  card,
  field,
  fill,
  formatDate,
  label,
  primaryButton,
  quietButton,
} from './shared';

const LANGS: CVLang[] = ['es', 'en', 'pt'];
const LANGUAGE_NAMES: Record<CVLang, string> = { es: 'Español', en: 'English', pt: 'Português' };
const MIN_JOB_CHARS = 50;
const MAX_JOB_CHARS = 20_000;

const query = (name: string) =>
  typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get(name);

// ── New screening ────────────────────────────────────────────────────────────

function NewScreening({
  t,
  lang,
  onCreate,
}: {
  t: Translation;
  lang: CVLang;
  onCreate: (title: string, job: string, language: CVLang) => Promise<void>;
}) {
  const text = t.recruiter.app;
  const [title, setTitle] = useState('');
  const [job, setJob] = useState('');
  const [language, setLanguage] = useState<CVLang>(lang);
  const [busy, setBusy] = useState(false);
  const ready = !!title.trim() && job.trim().length >= MIN_JOB_CHARS && !busy;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!ready) return;
    setBusy(true);
    try {
      await onCreate(title.trim(), job.trim(), language);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className={card} onSubmit={submit} data-testid="new-screening">
      <h2 className="mb-5 text-xl font-bold text-white">{text.newTitle}</h2>
      <div className="grid gap-4 md:grid-cols-[1fr_12rem]">
        <div>
          <label className={label} htmlFor="screening-title">
            {text.role}
          </label>
          <input
            id="screening-title"
            className={field}
            maxLength={150}
            placeholder={text.rolePlaceholder}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>
        <div>
          <label className={label} htmlFor="screening-language">
            {text.language}
          </label>
          <select
            id="screening-language"
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
      </div>
      <div className="mt-4">
        <label className={label} htmlFor="screening-job">
          {text.job}
        </label>
        <textarea
          id="screening-job"
          className={`${field} h-40 resize-y`}
          maxLength={MAX_JOB_CHARS}
          placeholder={text.jobPlaceholder}
          value={job}
          onChange={(event) => setJob(event.target.value)}
        />
        <p className="mt-1 text-xs text-slate-500">{text.jobHint}</p>
      </div>
      <button type="submit" className={`${primaryButton} mt-5`} disabled={!ready}>
        {busy ? text.creating : text.create}
      </button>
    </form>
  );
}

// ── Home ─────────────────────────────────────────────────────────────────────

function Home({ t, lang }: { t: Translation; lang: CVLang }) {
  const { getToken, isLoaded, userId } = useAuth();
  const text = t.recruiter.app;
  const [status, setStatus] = useState<RecruiterStatus | null>(null);
  const [screenings, setScreenings] = useState<ScreeningSummary[] | null>(null);
  const [error, setError] = useState('');
  const [showPlans, setShowPlans] = useState(false);
  const [paying, setPaying] = useState(false);
  const justSubscribed = query('subscribed') === '1';

  const load = useCallback(async () => {
    try {
      const token = await getToken();
      const [plan, list] = await Promise.all([
        api.recruiterStatus(token),
        api.listScreenings(token),
      ]);
      setStatus(plan);
      setScreenings(list);
    } catch {
      setError(t.recruiter.errors.load);
    }
  }, [getToken, t]);

  useEffect(() => {
    if (!isLoaded || !userId) return;
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [isLoaded, userId, load]);

  const leaveTo = async (ask: (token: string | null) => Promise<{ url: string }>) => {
    setPaying(true);
    setError('');
    try {
      const { url } = await ask(await getToken());
      window.location.assign(url);
    } catch {
      setError(t.recruiter.errors.checkout);
      setPaying(false);
    }
  };

  const create = async (title: string, job: string, language: CVLang) => {
    setError('');
    try {
      const screening = await api.createScreening(
        { title, job_description: job, language },
        await getToken()
      );
      window.location.assign(`${window.location.pathname}?id=${screening.id}`);
    } catch (problem) {
      setError(isApiError(problem, 403) ? t.recruiter.errors.limit : t.recruiter.errors.create);
    }
  };

  const remove = async (screening: ScreeningSummary) => {
    if (!window.confirm(text.confirmDelete)) return;
    try {
      await api.deleteScreening(screening.id, await getToken());
      setScreenings((list) => (list || []).filter((item) => item.id !== screening.id));
    } catch {
      setError(t.recruiter.errors.load);
    }
  };

  const blocked = blockedState(status);
  const subscribed = status?.status === 'active' || status?.status === 'past_due';
  const plansOpen = showPlans || blocked === 'trialOver' || blocked === 'ended';

  return (
    <div className="mx-auto max-w-4xl space-y-6" data-testid="recruiter-home">
      <header>
        <h1 className="text-3xl font-bold text-white">{text.title}</h1>
        <p className="mt-1 text-slate-400">{text.subtitle}</p>
      </header>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200"
        >
          {error}
        </p>
      )}
      {justSubscribed && subscribed && (
        <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">
          {text.subscribed}
        </p>
      )}

      {status && (
        <section className={card}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <UsageMeter t={t} lang={lang} status={status} />
            </div>
            <div className="flex gap-2">
              {status.has_billing && (
                <button
                  type="button"
                  className={quietButton}
                  disabled={paying}
                  onClick={() => leaveTo(api.recruiterPortal)}
                >
                  {text.manage}
                </button>
              )}
              {!subscribed && !plansOpen && (
                <button type="button" className={quietButton} onClick={() => setShowPlans(true)}>
                  {text.seePlans}
                </button>
              )}
            </div>
          </div>
          {blocked && (
            <p
              className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100"
              data-testid="recruiter-blocked"
            >
              {text.states[blocked]}
            </p>
          )}
        </section>
      )}

      {status && !subscribed && plansOpen && (
        <RecruiterPlans
          t={t}
          busy={paying}
          onChoose={(plan) => leaveTo((token) => api.recruiterCheckout(plan, token))}
        />
      )}

      {status && !blocked && <NewScreening t={t} lang={lang} onCreate={create} />}

      <section>
        <h2 className="mb-3 text-xl font-bold text-white">{text.listTitle}</h2>
        {screenings && screenings.length === 0 && (
          <p className="text-sm text-slate-400" data-testid="no-screenings">
            {text.empty}
          </p>
        )}
        <ul className="space-y-3">
          {(screenings || []).map((screening) => (
            <li
              key={screening.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-800/60 p-4"
              data-testid="screening-row"
            >
              <div className="min-w-0">
                <a
                  href={`?id=${screening.id}`}
                  className="font-bold text-white hover:text-violet-300"
                >
                  {screening.title}
                </a>
                <p className="mt-1 text-xs text-slate-400">
                  {fill(text.candidates, { n: screening.candidates })}
                  {screening.top_score !== null &&
                    ` · ${fill(text.best, { n: screening.top_score })}`}
                  {` · ${fill(text.expires, { date: formatDate(screening.expires_at, lang) })}`}
                </p>
              </div>
              <div className="flex gap-2">
                <a href={`?id=${screening.id}`} className={quietButton}>
                  {text.open}
                </a>
                <button type="button" className={quietButton} onClick={() => remove(screening)}>
                  {text.delete}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/** The recruiter area: the list of screenings, or one of them when the address has ?id=. */
export default function RecruiterApp({ lang = 'es' }: { lang?: string }) {
  const language = (lang in locales ? lang : 'es') as CVLang;
  const t = locales[language];
  const id = query('id');
  return id ? <ScreeningView t={t} lang={language} id={id} /> : <Home t={t} lang={language} />;
}
