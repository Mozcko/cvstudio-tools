import React from 'react';
import UserMenu from '../auth/UserMenu';
import LanguagePicker from './LanguagePicker';
import { locales } from '../../i18n/locales';
import useProStatus from '../../hooks/useProStatus';

export default function SiteHeader({ lang = 'es' }: { lang?: string }) {
  const { isPro } = useProStatus();
  const t = locales[lang as keyof typeof locales]?.ui.nav || locales.es.ui.nav;
  const recruiterNav = (locales[lang as keyof typeof locales] || locales.es).recruiter.nav;
  const langPrefix = lang === 'es' ? '' : `/${lang}`;

  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-slate-900/50 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <a href={`${langPrefix}/`} className="group flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-lg shadow-blue-900/20 transition-transform group-hover:scale-105">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="h-5 w-5 text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            CVStudio<span className="text-blue-500">.tools</span>
          </span>
        </a>

        {/* Nav Links + Auth */}
        <div className="flex items-center gap-6">
          <nav className="hidden gap-6 text-sm font-medium text-slate-300 lg:flex">
            <a href={`${langPrefix}/#features`} className="transition-colors hover:text-white">
              {t.features}
            </a>
            <a href={`${langPrefix}/#pricing`} className="transition-colors hover:text-white">
              {t.pricing}
            </a>
            <a
              href={`${langPrefix}/recruiters`}
              className="text-violet-300 transition-colors hover:text-violet-200"
              data-testid="recruiters-nav"
            >
              {recruiterNav}
            </a>
          </nav>
          <div className="hidden h-4 w-px bg-white/20 lg:block"></div>
          <LanguagePicker currentLang={lang} />
          <div className="hidden h-4 w-px bg-white/20 md:block"></div>
          <UserMenu lang={lang} isPro={isPro} />
        </div>
      </div>
    </header>
  );
}
