/**
 * Public link addresses: /u/<key>/<name>, e.g. /u/k7f2m9qx/juan-perez.
 *
 * The key (8 random characters, given by the backend) identifies the link. The name is chosen
 * by the owner so the address reads well; it does not have to be unique. The backend is the
 * authority on both; the rules here let the form answer while the user types.
 */

export const SLUG_MIN = 3;
export const SLUG_MAX = 40;

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const KEY_RE = /^[a-z0-9]{8}$/;

export type SlugProblem = 'length' | 'format';

export const normalizeSlug = (value: string): string => value.trim().toLowerCase();

/** Why a name cannot be used, or null. */
export function slugProblem(value: string): SlugProblem | null {
  const slug = normalizeSlug(value);
  if (slug.length < SLUG_MIN || slug.length > SLUG_MAX) return 'length';
  if (!SLUG_RE.test(slug) || slug.includes('--')) return 'format';
  return null;
}

/** A name to start from: "María José Pérez" → "maria-jose-perez". */
export function suggestSlug(name: string, fallback = 'mi-cv'): string {
  const slug = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_MAX)
    .replace(/-+$/g, '');
  return slugProblem(slug) === null ? slug : fallback;
}

/** What follows /u/ for a link: "<key>/<name>". */
export const publicRef = (link: { slug: string; key: string }): string =>
  `${link.key}/${link.slug}`;

/** The address a link is reachable at. */
export const publicUrl = (link: { slug: string; key: string }, origin?: string): string =>
  `${origin ?? (typeof window !== 'undefined' ? window.location.origin : '')}/u/${publicRef(link)}`;

export const isLinkKey = (value: string): boolean => KEY_RE.test(value);

/**
 * The key in the first part of an address. Normally that part *is* the key; the shape
 * "<name>-<key>", used briefly before, is still understood so such an address can be redirected.
 * Returns null when there is no valid key, which means the address cannot exist.
 */
export function keyFromAddress(firstSegment: string): string | null {
  const value = firstSegment.trim().toLowerCase();
  if (KEY_RE.test(value)) return value;
  const tail = value.slice(value.lastIndexOf('-') + 1);
  return value.includes('-') && KEY_RE.test(tail) ? tail : null;
}

// The keys of the owner's own links, so their visits are not counted as views
const OWN_LINKS_KEY = 'cvstudio:own-links';

export function rememberOwnLinks(keys: string[]): void {
  try {
    localStorage.setItem(OWN_LINKS_KEY, JSON.stringify(keys));
  } catch {
    // Storage may be unavailable; the only cost is counting the owner's own visits
  }
}
