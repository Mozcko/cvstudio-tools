/**
 * Public link addresses: /u/<name>-<key>, e.g. /u/juan-perez-k7f2m9qx.
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

/** What follows /u/ for a link: "<name>-<key>". */
export const publicRef = (link: { slug: string; key: string }): string =>
  `${link.slug}-${link.key}`;

/** The address a link is reachable at. */
export const publicUrl = (link: { slug: string; key: string }, origin?: string): string =>
  `${origin ?? (typeof window !== 'undefined' ? window.location.origin : '')}/u/${publicRef(link)}`;

/**
 * Splits what follows /u/ into the name and the key. Returns null when there is no valid key,
 * which means the address cannot exist. The name may be empty ("/u/<key>").
 */
export function parsePublicRef(ref: string): { name: string; key: string } | null {
  const value = ref.trim().toLowerCase();
  const cut = value.lastIndexOf('-');
  const key = value.slice(cut + 1);
  if (!KEY_RE.test(key)) return null;
  return { name: cut === -1 ? '' : value.slice(0, cut), key };
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
