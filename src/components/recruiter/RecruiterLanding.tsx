import React from 'react';
import { locales } from '../../i18n/locales';
import RecruiterPlans from './RecruiterPlans';
import { primaryButton } from './shared';

/** The public page that explains the recruiter area and its plans. */
export default function RecruiterLanding({ lang = 'es' }: { lang?: string }) {
  const t = locales[lang as keyof typeof locales] || locales.es;
  const text = t.recruiter.landing;
  const appUrl = `${lang === 'es' ? '' : `/${lang}`}/app/recruiter`;
  const heading = 'mb-8 text-center text-3xl font-bold text-white';
  const tile = 'rounded-2xl border border-slate-700 bg-slate-800/60 p-6 text-left';

  return (
    <div className="mx-auto w-full max-w-5xl space-y-20 text-center">
      <section>
        <p className="mb-4 text-sm font-bold tracking-widest text-violet-300 uppercase">
          {t.recruiter.nav}
        </p>
        <h1 className="mb-6 text-4xl font-bold tracking-tight text-white md:text-6xl">
          {text.title}
          <br />
          <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            {text.titleAccent}
          </span>
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-slate-400">
          {text.subtitle}
        </p>
        <a href={appUrl} className={`${primaryButton} inline-block px-8 py-4 text-lg`}>
          {text.cta}
        </a>
        <p className="mt-3 text-sm text-slate-400">{text.trialNote}</p>
      </section>

      <section>
        <h2 className={heading}>{text.stepsTitle}</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {text.steps.map((step) => (
            <div key={step.title} className={tile}>
              <h3 className="mb-2 font-bold text-white">{step.title}</h3>
              <p className="text-sm leading-relaxed text-slate-400">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className={heading}>{text.howTitle}</h2>
        <div className="grid gap-5 md:grid-cols-2">
          {text.how.map((item) => (
            <div key={item.title} className={tile}>
              <h3 className="mb-2 font-bold text-violet-300">{item.title}</h3>
              <p className="text-sm leading-relaxed text-slate-400">{item.text}</p>
            </div>
          ))}
        </div>
        <div className={`${tile} mt-5 border-violet-500/40`}>
          <h3 className="mb-2 font-bold text-white">{text.humanTitle}</h3>
          <p className="text-sm leading-relaxed text-slate-400">{text.humanText}</p>
        </div>
      </section>

      <section id="plans">
        <h2 className="mb-2 text-center text-3xl font-bold text-white">{text.plansTitle}</h2>
        <p className="mb-8 text-slate-400">{text.plansNote}</p>
        <RecruiterPlans t={t} href={appUrl} />
      </section>

      <section id="terms" className="text-left">
        <h2 className="mb-4 text-xl font-bold text-white">{text.termsTitle}</h2>
        <ul className="list-disc space-y-3 pl-5 text-sm leading-relaxed text-slate-400">
          {text.terms.map((term) => (
            <li key={term}>{term}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
