/**
 * Which paths can be visited without signing in. Kept free of framework imports so the
 * rules can be unit tested; src/middleware.ts enforces them.
 */

// Locales that live under a URL prefix (the default locale, es, has none)
export const PREFIXED_LOCALES = ['en', 'pt'];

// Pages that exist only at the root (no /en or /pt twin under src/pages/[lang])
export const UNLOCALIZED_PATHS = ['/login'];

// A published CV: /u/<name>. It has no /en or /pt twin; the page uses the CV's own language
export const PUBLIC_CV = /^\/u\/[^/]+\/?$/;

const LOCALE = `(?:/(?:${PREFIXED_LOCALES.join('|')}))?`;

const PUBLIC_ROUTES: RegExp[] = [
  new RegExp(`^${LOCALE}/?$`), // landing
  new RegExp(`^${LOCALE}/pricing/?$`),
  new RegExp(`^${LOCALE}/privacy/?$`),
  new RegExp(`^${LOCALE}/sign-in(?:/.*)?$`),
  new RegExp(`^${LOCALE}/sign-up(?:/.*)?$`),
  new RegExp(`^${LOCALE}/app/editor(?:/.*)?$`), // guests can try the editor
  ...UNLOCALIZED_PATHS.map((path) => new RegExp(`^${path}/?$`)),
  PUBLIC_CV, // published CVs
];

export const isPublicPath = (pathname: string): boolean =>
  PUBLIC_ROUTES.some((route) => route.test(pathname));

// Everything that needs an account lives under /app (any first segment may precede it, so a
// mistyped locale such as /fr/app/dashboard is still treated as private)
const APP_AREA = /^(?:\/[^/]+)?\/app(?:\/.*)?$/;

/**
 * True when a signed-out visitor must be sent to sign in. Paths that are neither public nor
 * in the app area do not exist: they are let through so the 404 page can answer them.
 * New private pages must be created under /app.
 */
export const requiresSignIn = (pathname: string): boolean =>
  APP_AREA.test(pathname) && !isPublicPath(pathname);

/** The locale a [lang] page was requested with, or null when it is not one we serve. */
export const prefixedLocale = (lang: string | undefined): 'en' | 'pt' | null =>
  lang === 'en' || lang === 'pt' ? lang : null;
