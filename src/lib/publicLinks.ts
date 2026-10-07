/**
 * Public link names (the part after /u/). The backend is the authority; these mirror its rules
 * so the form can answer while the user types.
 */

export const SLUG_MIN = 3;
export const SLUG_MAX = 40;

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

// The names most likely to be tried; the server holds the full list
const RESERVED = new Set([
  'admin',
  'api',
  'app',
  'cv',
  'cvs',
  'cvstudio',
  'dashboard',
  'editor',
  'en',
  'es',
  'help',
  'login',
  'me',
  'pricing',
  'privacy',
  'pt',
  'sign-in',
  'sign-up',
  'support',
  'u',
  'www',
]);

export type SlugProblem = 'length' | 'format' | 'reserved' | 'taken';

export const normalizeSlug = (value: string): string => value.trim().toLowerCase();

/** Why a name cannot be used, or null. Does not know whether it is taken. */
export function slugProblem(value: string): SlugProblem | null {
  const slug = normalizeSlug(value);
  if (slug.length < SLUG_MIN || slug.length > SLUG_MAX) return 'length';
  if (!SLUG_RE.test(slug) || slug.includes('--')) return 'format';
  if (RESERVED.has(slug)) return 'reserved';
  return null;
}

/** A name to start from: "María José Pérez" → "maria-jose-perez". */
export function suggestSlug(name: string, fallback = 'mi-cv'): string {
  const slug = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_MAX)
    .replace(/-+$/g, '');
  return slugProblem(slug) === null ? slug : fallback;
}

/** The address a link is reachable at. */
export const publicUrl = (slug: string, origin?: string): string =>
  `${origin ?? (typeof window !== 'undefined' ? window.location.origin : '')}/u/${slug}`;

// The owner's own link names, so their visits are not counted as views
const OWN_LINKS_KEY = 'cvstudio:own-links';

export function rememberOwnLinks(slugs: string[]): void {
  try {
    localStorage.setItem(OWN_LINKS_KEY, JSON.stringify(slugs));
  } catch {
    // Storage may be unavailable; the only cost is counting the owner's own visits
  }
}
