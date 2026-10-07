import { parseMonth } from '../../utils/cvLocale';
import {
  DEFAULT_SECTION_ORDER,
  type CVData,
  type CustomSection,
  type Education,
  type Experience,
  type Project,
  type SkillItem,
  type SocialLink,
} from '../../types/cv';
import type { MissingPart } from './types';

/**
 * The single gate between imported data and the editor. Whatever a parser or the AI
 * produced, the result is a well-formed CVData: right types, fresh ids, clean text,
 * dates as YYYY-MM, bounded sizes.
 */

const LIMITS = { short: 300, long: 4000, line: 1000, rows: 40, bullets: 30, socials: 10 };

type Row = Record<string, unknown>;

const isRow = (value: unknown): value is Row =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const rows = (value: unknown, limit = LIMITS.rows): Row[] =>
  Array.isArray(value) ? value.filter(isRow).slice(0, limit) : [];

let counter = 0;
const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `imp-${Date.now()}-${counter++}`;

/** Plain, trimmed text. Markup is dropped: the CV sheet renders raw HTML. */
export const cleanText = (value: unknown, limit = LIMITS.short): string => {
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  return (
    String(value)
      .replace(/<\/?[a-zA-Z!][^>]*>/g, ' ')
      // A "<" that could still open a tag goes; "< 100 ms" and "a > b" stay
      .replace(/<(?=[a-zA-Z/!?])/g, '')
      .replace(/[ \t\u00a0]+/g, ' ')
      .replace(/ *\n */g, '\n')
      .trim()
      .slice(0, limit)
  );
};

/** Only http(s) links (and bare domains) survive; anything else could be a script URL. */
export const cleanUrl = (value: unknown): string => {
  const url = cleanText(value).replace(/\s+/g, '');
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return '';
  return /^[\w-]+(\.[\w-]+)+([/?#].*)?$/.test(url) ? `https://${url}` : '';
};

/** 'YYYY-MM' or ''. Accepts ISO dates, 'Jan 2020', '03/2021', '2019', Date objects. */
export const toMonth = (value: unknown): string => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 7);
  }
  const text = cleanText(value, 40);
  if (!text) return '';
  const iso = text.match(/^(\d{4})-(\d{1,2})(?:-\d{1,2})?(?:T.*)?$/);
  if (iso) {
    const month = Number(iso[2]);
    return month >= 1 && month <= 12 ? `${iso[1]}-${iso[2].padStart(2, '0')}` : '';
  }
  const parsed = parseMonth(text);
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(parsed) ? parsed : '';
};

/** Bullets from a list, or from a paragraph split on line breaks and bullet characters. */
export const toBullets = (value: unknown): string[] => {
  const parts = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/\r?\n|(?:^|\s)[•▪●◦·]\s/)
      : [];
  return parts
    .map((part) => cleanText(part, LIMITS.line).replace(/^[-–—*•▪●◦·]\s*/, ''))
    .filter(Boolean)
    .slice(0, LIMITS.bullets);
};

const isPresentWord = (value: unknown): boolean =>
  typeof value === 'string' &&
  /^(present|current|now|today|actual(idad)?|presente|atual(mente)?|hoy)$/i.test(value.trim());

const period = (row: Row) => {
  const startDate = toMonth(row.startDate);
  const endDate = toMonth(row.endDate);
  const isCurrent = !endDate && (row.isCurrent === true || isPresentWord(row.endDate));
  return { startDate, endDate, isCurrent };
};

const toExperience = (row: Row): Experience | null => {
  const company = cleanText(row.company);
  const role = cleanText(row.role);
  const description = toBullets(row.description);
  if (!company && !role && description.length === 0) return null;
  const { startDate, endDate, isCurrent } = period(row);
  return {
    id: newId(),
    company,
    role,
    location: cleanText(row.location),
    startDate,
    endDate: endDate || null,
    isCurrent,
    description,
  };
};

const toEducation = (row: Row): Education | null => {
  const institution = cleanText(row.institution);
  const degree = cleanText(row.degree);
  if (!institution && !degree) return null;
  const { startDate, endDate, isCurrent } = period(row);
  return { id: newId(), institution, degree, startDate, endDate: endDate || null, isCurrent };
};

const toSkill = (row: Row): SkillItem | null => {
  const category = cleanText(row.category);
  const items = cleanText(Array.isArray(row.items) ? row.items.join(', ') : row.items, LIMITS.line);
  return category || items ? { id: newId(), category, items } : null;
};

const toProject = (row: Row): Project | null => {
  const name = cleanText(row.name);
  const description = toBullets(row.description);
  if (!name && description.length === 0) return null;
  return {
    id: newId(),
    name,
    role: cleanText(row.role),
    startDate: toMonth(row.startDate),
    endDate: toMonth(row.endDate),
    url: cleanUrl(row.url),
    description,
  };
};

const toSocial = (row: Row): SocialLink | null => {
  // The CV prints socials as links, so one without a usable address is dropped
  const url = cleanUrl(row.url) || cleanUrl(row.username);
  if (!url) return null;
  // The visible text of a link must not be a script URL either
  const rawName = cleanText(row.username);
  const username = /^(?!https?:)[a-z][a-z0-9+.-]*:/i.test(rawName) ? '' : rawName;
  return { id: newId(), network: cleanText(row.network, 60) || 'Web', username, url };
};

const toCustomSection = (row: Row): CustomSection | null => {
  const title = cleanText(row.title);
  const items = rows(row.items)
    .map((item) => ({
      id: newId(),
      title: cleanText(item.title),
      subtitle: cleanText(item.subtitle),
      description: cleanText(item.description, LIMITS.long),
    }))
    .filter((item) => item.title || item.subtitle || item.description);
  return title && items.length > 0 ? { id: newId(), title, items } : null;
};

const compact = <T>(items: (T | null)[]): T[] => items.filter((item): item is T => item !== null);

const toLanguageCode = (value: unknown): string | undefined => {
  const code = typeof value === 'string' ? value.trim().toUpperCase().slice(0, 2) : '';
  return ['ES', 'EN', 'PT'].includes(code) ? code : undefined;
};

export function normalizeImported(input: unknown): { data: CVData; missing: MissingPart[] } {
  const source = isRow(input) ? input : {};
  const personal = isRow(source.personal) ? source.personal : {};

  const data: CVData = {
    personal: {
      name: cleanText(personal.name),
      role: cleanText(personal.role),
      email: cleanText(personal.email).replace(/\s+/g, ''),
      phone: cleanText(personal.phone, 60),
      city: cleanText(personal.city),
      summary: cleanText(personal.summary, LIMITS.long),
      socials: compact(rows(personal.socials, LIMITS.socials).map(toSocial)),
    },
    experience: compact(rows(source.experience).map(toExperience)),
    education: compact(rows(source.education).map(toEducation)),
    skills: compact(rows(source.skills).map(toSkill)),
    certifications: compact(rows(source.certifications).map(toSkill)),
    languages: cleanText(source.languages, LIMITS.line),
    interests: cleanText(source.interests, LIMITS.line),
    projects: compact(rows(source.projects).map(toProject)),
    customSections: compact(rows(source.customSections, 10).map(toCustomSection)),
    sectionOrder: [...DEFAULT_SECTION_ORDER],
  };
  const language = toLanguageCode(source.language);
  if (language) data.language = language;

  const missing: MissingPart[] = [];
  if (!data.personal.name) missing.push('name');
  if (data.experience.length === 0) missing.push('experience');
  if (data.education.length === 0) missing.push('education');
  if (data.skills.length === 0) missing.push('skills');

  return { data, missing };
}

/** True when nothing recognisable as a CV came out. */
export const isEmptyImport = (data: CVData): boolean =>
  !data.personal.name &&
  !data.personal.summary &&
  data.experience.length === 0 &&
  data.education.length === 0 &&
  data.skills.length === 0;
