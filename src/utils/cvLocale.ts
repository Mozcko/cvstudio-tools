import type { CVLang } from '../types/cv';

/**
 * Everything language-dependent in the generated CV document lives here, so that
 * markdownGenerator.ts and markdownParser.ts can never disagree about it.
 */

export const CV_LANGS: CVLang[] = ['es', 'en', 'pt'];

export type TitleKey = 'exp' | 'skills' | 'edu' | 'certs' | 'lang' | 'int' | 'projects';

export const titlesMap: Record<CVLang, Record<TitleKey, string>> = {
  es: {
    exp: 'Experiencia Profesional',
    skills: 'Habilidades Técnicas',
    edu: 'Educación',
    certs: 'Certificaciones',
    lang: 'Idiomas',
    int: 'Intereses',
    projects: 'Proyectos Destacados',
  },
  en: {
    exp: 'Professional Experience',
    skills: 'Technical Skills',
    edu: 'Education',
    certs: 'Certifications',
    lang: 'Languages',
    int: 'Interests',
    projects: 'Key Projects',
  },
  pt: {
    exp: 'Experiência Profissional',
    skills: 'Habilidades Técnicas',
    edu: 'Educação',
    certs: 'Certificações',
    lang: 'Idiomas',
    int: 'Interesses',
    projects: 'Projetos em Destaque',
  },
};

/** Localised section title (any language) → section key. */
export const titleToKey: Map<string, TitleKey> = new Map(
  CV_LANGS.flatMap((lang) =>
    (Object.entries(titlesMap[lang]) as [TitleKey, string][]).map(
      ([key, title]) => [title.toLowerCase(), key] as [string, TitleKey]
    )
  )
);

export const presentLabel: Record<CVLang, string> = {
  es: 'Presente',
  en: 'Present',
  pt: 'Presente',
};

const PRESENT_WORDS = ['presente', 'present', 'actual', 'atual', 'current'];

export const isPresent = (value: string): boolean =>
  PRESENT_WORDS.includes(value.trim().toLowerCase());

const SHORT_MONTHS: Record<CVLang, string[]> = {
  es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  pt: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'],
};

const LONG_MONTHS: string[][] = [
  [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december',
  ],
  [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ],
  [
    'janeiro',
    'fevereiro',
    'março',
    'abril',
    'maio',
    'junho',
    'julho',
    'agosto',
    'setembro',
    'outubro',
    'novembro',
    'dezembro',
  ],
];

/** Any month name we may meet (short or long, any language, plus common variants) → 1..12 */
const MONTH_LOOKUP: Record<string, number> = (() => {
  const lookup: Record<string, number> = { sept: 9, set: 9 };
  for (const names of [...Object.values(SHORT_MONTHS), ...LONG_MONTHS]) {
    names.forEach((name, index) => {
      lookup[name.toLowerCase()] = index + 1;
    });
  }
  return lookup;
})();

/** '2023-04' → 'abr 2023' / 'Apr 2023' / 'abr 2023'. Empty or malformed input → ''. */
export const formatMonth = (value: string | null | undefined, lang: CVLang): string => {
  if (!value) return '';
  const match = value.match(/^(\d{4})-(\d{1,2})$/);
  if (!match) return '';
  const month = parseInt(match[2], 10);
  if (month < 1 || month > 12) return '';
  const names = SHORT_MONTHS[lang] || SHORT_MONTHS.en;
  return `${names[month - 1]} ${match[1]}`;
};

/**
 * Inverse of formatMonth, tolerant of what people type by hand:
 * 'abr 2023', 'Abr. 2023', 'abril de 2023', 'April 2023', '2023-04', '04/2023', '2023'.
 * Returns 'YYYY-MM', or '' when no date can be recognised.
 */
export const parseMonth = (value: string): string => {
  const text = value.trim();
  if (!text) return '';

  const iso = text.match(/^(\d{4})-(\d{1,2})$/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}`;

  const numeric = text.match(/^(\d{1,2})[/.](\d{4})$/);
  if (numeric) return `${numeric[2]}-${numeric[1].padStart(2, '0')}`;

  const named = text.match(/^([^\d\s.,]+)\.?,?\s+(?:de\s+|of\s+)?(\d{4})$/i);
  if (named) {
    const month = MONTH_LOOKUP[named[1].toLowerCase()];
    if (month) return `${named[2]}-${String(month).padStart(2, '0')}`;
  }

  const yearOnly = text.match(/^(\d{4})$/);
  if (yearOnly) return `${yearOnly[1]}-01`;

  return '';
};

/** Splits 'abr 2023 - Presente' into its two halves. */
export const splitDateRange = (range: string): [string, string] => {
  // The dash must stand alone, so ISO dates like 2023-04 are not split
  const parts = range.split(/(?:^|\s+)[-–—](?:\s+|$)/);
  if (parts.length < 2) return [range.trim(), ''];
  return [parts[0].trim(), parts.slice(1).join(' - ').trim()];
};
