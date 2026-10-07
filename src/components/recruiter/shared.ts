import type { RecruiterStatus } from '../../lib/api';

// The recruiter area has its own accent (violet) so it never looks like the job-seeker side
export const card = 'rounded-2xl border border-slate-700 bg-slate-800/60 p-6 md:p-8';
export const primaryButton =
  'rounded-lg bg-violet-600 px-5 py-2.5 font-bold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40';
export const quietButton =
  'rounded-lg border border-slate-600 px-4 py-2 text-sm font-bold text-slate-200 transition-colors hover:border-slate-400 hover:text-white disabled:opacity-40';
export const field =
  'w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-violet-500';
export const label = 'mb-1 block text-xs font-bold tracking-wider text-slate-400 uppercase';

/** Replaces {name} placeholders in a translated text. */
export const fill = (template: string, values: Record<string, string | number>): string =>
  template.replace(/\{(\w+)\}/g, (whole, key) => (key in values ? String(values[key]) : whole));

export const formatDate = (iso: string, lang: string) =>
  new Date(iso).toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' });

export type BlockedState = 'trialOver' | 'quota' | 'pastDue' | 'ended';

/** Why new evaluations are refused, if they are. */
export function blockedState(status: RecruiterStatus | null): BlockedState | null {
  if (!status || status.can_evaluate) return null;
  if (status.status === 'past_due') return 'pastDue';
  if (status.status === 'canceled') return 'ended';
  return status.status === 'trial' ? 'trialOver' : 'quota';
}

/** Where "Contáctanos" writes to. Without it the Enterprise card has no button. */
export const SALES_EMAIL: string = import.meta.env.PUBLIC_SALES_EMAIL || '';
