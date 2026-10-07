import React from 'react';
import type { RecruiterStatus } from '../../lib/api';
import type { Translation } from '../../i18n/locales';
import { fill, formatDate } from './shared';

/** The plan, how much of it is used and when it renews. */
export default function UsageMeter({
  t,
  lang,
  status,
}: {
  t: Translation;
  lang: string;
  status: RecruiterStatus;
}) {
  const text = t.recruiter.app;
  const values = { used: status.used, limit: status.limit ?? 0 };
  const usage =
    status.limit === null
      ? fill(text.usageUnlimited, values)
      : fill(status.status === 'trial' ? text.trialUsage : text.usage, values);
  const share = status.limit ? Math.min(100, Math.round((status.used / status.limit) * 100)) : 0;

  return (
    <div data-testid="recruiter-usage">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="rounded-full bg-violet-500/20 px-3 py-1 text-xs font-bold text-violet-200">
          {text.planNames[status.plan]}
        </span>
        <span className="text-sm text-slate-300">{usage}</span>
        {status.period_end && (
          <span className="text-xs text-slate-500">
            {fill(status.status === 'canceled' ? text.endsOn : text.renews, {
              date: formatDate(status.period_end, lang),
            })}
          </span>
        )}
      </div>
      {status.limit !== null && status.limit > 0 && (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-700">
          <div
            className={`h-full rounded-full ${share >= 100 ? 'bg-amber-400' : 'bg-violet-500'}`}
            style={{ width: `${share}%` }}
          />
        </div>
      )}
    </div>
  );
}
