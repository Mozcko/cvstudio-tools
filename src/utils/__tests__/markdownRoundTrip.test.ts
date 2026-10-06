import { describe, expect, it } from 'vitest';
import { initialCVData, type CVData, type CVLang } from '../../types/cv';
import { formatMonth, parseMonth, splitDateRange } from '../cvLocale';
import { generateMarkdown } from '../markdownGenerator';
import { parseMarkdownToCV } from '../markdownParser';

const LANGS: CVLang[] = ['es', 'en', 'pt'];
const MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));

const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();

/** generate → parse → generate must reproduce the same document. */
const roundTrip = (data: CVData, lang: CVLang) => {
  const markdown = generateMarkdown(data, lang);
  const parsed = parseMarkdownToCV(markdown);
  expect(parsed.success).toBe(true);
  const regenerated = generateMarkdown(parsed.data as CVData, lang);
  expect(normalize(regenerated)).toBe(normalize(markdown));
  return parsed.data as CVData;
};

const fullCV = (month: string): CVData => ({
  ...initialCVData,
  experience: [
    {
      id: '1',
      company: 'Tech Company Inc.',
      role: 'Senior Developer',
      location: 'Remote',
      startDate: `2023-${month}`,
      endDate: null,
      isCurrent: true,
      description: ['Led a migration - end to end.', 'Mentored 3 developers.'],
    },
    {
      id: '2',
      company: 'Startup',
      role: 'Engineer',
      location: 'Lisbon',
      startDate: `2020-${month}`,
      endDate: `2022-${month}`,
      isCurrent: false,
      description: ['Built APIs.'],
    },
  ],
  education: [
    {
      id: '1',
      institution: 'State University',
      degree: 'MSc Computer Science',
      startDate: `2018-${month}`,
      endDate: `2020-${month}`,
      isCurrent: false,
    },
    {
      id: '2',
      institution: 'City College',
      degree: 'BSc',
      startDate: `2014-${month}`,
      endDate: null,
      isCurrent: true,
    },
  ],
  projects: [
    {
      id: 'p1',
      name: 'Open Source Tool',
      role: 'Maintainer',
      startDate: `2021-${month}`,
      endDate: `2022-${month}`,
      url: 'https://example.com/tool?a=1',
      description: ['Reached 1k stars.'],
    },
    {
      id: 'p2',
      name: 'Side Project',
      role: '',
      startDate: `2024-${month}`,
      endDate: '',
      url: '',
      description: [],
    },
    {
      id: 'p3',
      name: 'Bare Project',
      role: '',
      startDate: '',
      endDate: '',
      url: '',
      description: [],
    },
  ],
  customSections: [
    {
      id: 'c1',
      title: 'Volunteering',
      items: [
        {
          id: 1,
          title: 'Code Club',
          subtitle: 'Mentor, 2022',
          description: 'Taught kids to code.',
        },
        { id: 2, title: 'Food Bank', subtitle: '', description: 'Weekend shifts.\nLogistics.' },
      ],
    },
  ],
  sectionOrder: ['skills', 'experience', 'custom', 'projects', 'education'],
});

describe('cvLocale dates', () => {
  it.each(LANGS)('formatMonth/parseMonth are inverse for every month (%s)', (lang) => {
    for (const month of MONTHS) {
      const iso = `2023-${month}`;
      expect(parseMonth(formatMonth(iso, lang))).toBe(iso);
    }
  });

  it('accepts hand-written variants', () => {
    expect(parseMonth('abril de 2023')).toBe('2023-04');
    expect(parseMonth('Abr. 2023')).toBe('2023-04');
    expect(parseMonth('sept 2023')).toBe('2023-09');
    expect(parseMonth('dez. de 2023')).toBe('2023-12');
    expect(parseMonth('August 2023')).toBe('2023-08');
    expect(parseMonth('2023-8')).toBe('2023-08');
    expect(parseMonth('08/2023')).toBe('2023-08');
    expect(parseMonth('2023')).toBe('2023-01');
    expect(parseMonth('whenever')).toBe('');
    expect(formatMonth('', 'es')).toBe('');
    expect(formatMonth('2023-13', 'es')).toBe('');
  });

  it('splits ranges without breaking ISO dates', () => {
    expect(splitDateRange('abr 2023 - Presente')).toEqual(['abr 2023', 'Presente']);
    expect(splitDateRange('2023-04 - 2024-05')).toEqual(['2023-04', '2024-05']);
    expect(splitDateRange(' - ')).toEqual(['', '']);
    expect(splitDateRange('abr 2023 - ')).toEqual(['abr 2023', '']);
  });
});

describe('markdown round trip', () => {
  it.each(LANGS)('sample CV survives in %s', (lang) => {
    roundTrip(initialCVData, lang);
  });

  it.each(LANGS)('every month survives in %s, with projects and custom sections', (lang) => {
    for (const month of MONTHS) {
      const parsed = roundTrip(fullCV(month), lang);

      expect(parsed.experience[0].startDate).toBe(`2023-${month}`);
      expect(parsed.experience[0].isCurrent).toBe(true);
      expect(parsed.experience[1].endDate).toBe(`2022-${month}`);
      expect(parsed.education[0].endDate).toBe(`2020-${month}`);
      expect(parsed.education[1].isCurrent).toBe(true);
      expect(parsed.projects?.[0].url).toBe('https://example.com/tool?a=1');
      expect(parsed.projects?.[0].startDate).toBe(`2021-${month}`);
      expect(parsed.projects?.[1].endDate).toBe('');
      expect(parsed.customSections?.[0].items).toHaveLength(2);
      expect(parsed.sectionOrder).toEqual([
        'skills',
        'experience',
        'custom',
        'projects',
        'education',
      ]);
    }
  });

  it('a CV written in one language parses while the editor is in another', () => {
    const markdown = generateMarkdown(fullCV('04'), 'pt');
    const parsed = parseMarkdownToCV(markdown).data as CVData;
    expect(parsed.experience).toHaveLength(2);
    expect(parsed.experience[0].startDate).toBe('2023-04');
    expect(parsed.languages).toBe(initialCVData.languages);
    expect(parsed.interests).toBe(initialCVData.interests);
  });

  it('keeps contact details when some are empty', () => {
    const data: CVData = {
      ...initialCVData,
      personal: { ...initialCVData.personal, city: '', socials: [] },
    };
    const parsed = roundTrip(data, 'en');
    expect(parsed.personal.city).toBe('');
    expect(parsed.personal.email).toBe(initialCVData.personal.email);
    expect(parsed.personal.phone).toBe(initialCVData.personal.phone);
    expect(generateMarkdown(data, 'en')).not.toContain('****');
  });

  it('survives a nearly empty CV', () => {
    const data: CVData = {
      personal: {
        name: 'Jane',
        role: '',
        email: '',
        phone: '',
        city: '',
        summary: '',
        socials: [],
      },
      experience: [],
      education: [],
      skills: [],
      certifications: [],
      languages: 'English',
      interests: '',
    };
    const parsed = roundTrip(data, 'es');
    expect(parsed.languages).toBe('English');
    expect(parsed.personal.summary).toBe('');
  });

  it('gives every parsed project and custom item an id', () => {
    const parsed = roundTrip(fullCV('06'), 'en');
    for (const project of parsed.projects || []) expect(project.id).toBeTruthy();
    for (const section of parsed.customSections || []) {
      expect(section.id).toBeTruthy();
      for (const item of section.items) expect(item.id).toBeTruthy();
    }
  });

  it('rejects empty input', () => {
    expect(parseMarkdownToCV('   ').success).toBe(false);
  });
});
