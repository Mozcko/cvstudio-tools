import React from 'react';
import type { Translation } from '../../i18n/locales';
import { primaryButton, quietButton, SALES_EMAIL } from './shared';

type PaidPlan = 'starter' | 'pro';

/**
 * The three recruiter plans. With `onChoose` the buttons start a checkout; without it they
 * lead to `href` (the public page sends visitors into the app, where the trial starts).
 */
export default function RecruiterPlans({
  t,
  onChoose,
  href,
  busy = false,
  salesEmail = SALES_EMAIL,
}: {
  t: Translation;
  onChoose?: (plan: PaidPlan) => void;
  href?: string;
  busy?: boolean;
  salesEmail?: string;
}) {
  const text = t.recruiter.landing;
  const planCard = 'flex flex-col rounded-2xl border bg-slate-800/60 p-6 text-left';

  const paid = (plan: PaidPlan, highlighted: boolean) => (
    <div
      className={`${planCard} ${highlighted ? 'border-violet-500 shadow-lg shadow-violet-900/30' : 'border-slate-700'}`}
      data-testid={`recruiter-plan-${plan}`}
    >
      <h3 className="text-lg font-bold text-white">{text.plans[plan].name}</h3>
      <p className="mt-2 text-4xl font-bold text-white">
        {text.plans[plan].price}
        <span className="ml-1 text-sm font-normal text-slate-400">{text.perMonth}</span>
      </p>
      <p className="mt-1 font-bold text-violet-300">{text.plans[plan].cvs}</p>
      <ul className="my-5 flex-1 space-y-2 text-sm text-slate-300">
        {text.features.map((feature) => (
          <li key={feature} className="flex gap-2">
            <span className="text-violet-400">✓</span> {feature}
          </li>
        ))}
      </ul>
      {onChoose ? (
        <button
          type="button"
          className={highlighted ? primaryButton : quietButton}
          disabled={busy}
          onClick={() => onChoose(plan)}
        >
          {text.choose} {text.plans[plan].name}
        </button>
      ) : (
        <a href={href} className={`${highlighted ? primaryButton : quietButton} text-center`}>
          {text.cta}
        </a>
      )}
    </div>
  );

  return (
    <div className="grid gap-5 md:grid-cols-3" data-testid="recruiter-plans">
      {paid('starter', false)}
      {paid('pro', true)}
      <div className={`${planCard} border-slate-700`} data-testid="recruiter-plan-enterprise">
        <h3 className="text-lg font-bold text-white">{text.plans.enterprise.name}</h3>
        <p className="mt-2 text-4xl font-bold text-white">{text.plans.enterprise.price}</p>
        <p className="mt-1 font-bold text-violet-300">{text.plans.enterprise.cvs}</p>
        <ul className="my-5 flex-1 space-y-2 text-sm text-slate-300">
          {text.enterpriseFeatures.map((feature) => (
            <li key={feature} className="flex gap-2">
              <span className="text-violet-400">✓</span> {feature}
            </li>
          ))}
        </ul>
        {salesEmail ? (
          <a
            href={`mailto:${salesEmail}?subject=${encodeURIComponent('CVStudio Enterprise')}`}
            className={`${quietButton} text-center`}
          >
            {text.contact}
          </a>
        ) : (
          <p className="text-sm text-slate-400">{text.contactNote}</p>
        )}
      </div>
    </div>
  );
}
