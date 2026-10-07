/**
 * Which paths can be visited without signing in. Kept free of framework imports so the
 * rules can be unit tested; src/middleware.ts enforces them.
 */

// Locales that live under a URL prefix (the default locale, es, has none)
export const PREFIXED_LOCALES = ['en', 'pt'];

// Pages that exist only at the root (no /en or /pt twin under src/pages/[lang])
export const UNLOCALIZED_PATHS = ['/login'];

const LOCALE = `(?:/(?:${PREFIXED_LOCALES.join('|')}))?`;

const PUBLIC_ROUTES: RegExp[] = [
  new RegExp(`^${LOCALE}/?$`), // landing
  new RegExp(`^${LOCALE}/pricing/?$`),
  new RegExp(`^${LOCALE}/privacy/?$`),
  new RegExp(`^${LOCALE}/sign-in(?:/.*)?$`),
  new RegExp(`^${LOCALE}/sign-up(?:/.*)?$`),
  new RegExp(`^${LOCALE}/app/editor(?:/.*)?$`), // guests can try the editor
  ...UNLOCALIZED_PATHS.map((path) => new RegExp(`^${path}/?$`)),
];

export const isPublicPath = (pathname: string): boolean =>
  PUBLIC_ROUTES.some((route) => route.test(pathname));
