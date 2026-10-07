import React from 'react';
import { locales } from '../../i18n/locales';

/** "Are you a recruiter?": the way into the recruiter area from the job-seeker side. */
export default function RecruiterAsk({
  lang = 'es',
  className = '',
}: {
  lang?: string;
  className?: string;
}) {
  const t = (locales[lang as keyof typeof locales] || locales.es).recruiter;
  return (
    <p className={`text-sm text-slate-400 ${className}`} data-testid="recruiter-ask">
      {t.ask}{' '}
      <a
        href={`${lang === 'es' ? '' : `/${lang}`}/recruiters`}
        className="font-bold text-violet-300 underline-offset-2 hover:text-violet-200 hover:underline"
      >
        {t.askCta} →
      </a>
    </p>
  );
}
