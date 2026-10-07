import { ImportError } from './types';

/**
 * LinkedIn data export ("Get a copy of your data"): a ZIP of CSV files.
 * Returns loosely-shaped data for normalizeImported().
 */

type CsvRow = Record<string, string>;

const WANTED = [
  'profile.csv',
  'positions.csv',
  'education.csv',
  'skills.csv',
  'languages.csv',
  'certifications.csv',
  'projects.csv',
  'email addresses.csv',
  'phonenumbers.csv',
];

const baseName = (path: string) => (path.split('/').pop() || '').toLowerCase();

const SKILLS_LABEL: Record<string, string> = {
  es: 'Habilidades',
  en: 'Skills',
  pt: 'Habilidades',
};

const full = (...parts: (string | undefined)[]) =>
  parts
    .map((part) => (part || '').trim())
    .filter(Boolean)
    .join(' ');

const networkOf = (url: string): string => {
  const host = url
    .replace(/^https?:\/\//i, '')
    .split('/')[0]
    .replace(/^www\./, '');
  if (/github\.com$/i.test(host)) return 'GitHub';
  if (/(twitter|x)\.com$/i.test(host)) return 'Twitter';
  return host || 'Web';
};

/** "[PERSONAL:https://a.dev,COMPANY:https://b.com]" → urls */
const parseWebsites = (value: string | undefined): string[] =>
  (value || '')
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map((entry) => entry.trim().replace(/^[A-Z_]+:/, ''))
    .filter((entry) => /^(https?:\/\/|www\.)/i.test(entry));

export async function parseLinkedinZip(bytes: Uint8Array, lang = 'en'): Promise<unknown> {
  const [{ unzipSync, strFromU8 }, { default: Papa }] = await Promise.all([
    import('fflate'),
    import('papaparse'),
  ]);

  let files: Record<string, Uint8Array>;
  try {
    // Only the files we read are inflated; an export can also hold megabytes of media
    files = unzipSync(bytes, { filter: (file) => WANTED.includes(baseName(file.name)) });
  } catch {
    throw new ImportError('unreadable');
  }

  const tables: Record<string, CsvRow[]> = {};
  for (const [path, content] of Object.entries(files)) {
    const parsed = Papa.parse<CsvRow>(strFromU8(content).replace(/^\uFEFF/, ''), {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });
    tables[baseName(path)] = parsed.data;
  }

  const profile = tables['profile.csv']?.[0];
  if (!profile && !tables['positions.csv']) throw new ImportError('notLinkedin');

  const emails = tables['email addresses.csv'] || [];
  const email = (emails.find((row) => row.Primary === 'Yes') || emails[0])?.['Email Address'];

  const socials = parseWebsites(profile?.Websites).map((url) => ({
    network: networkOf(url),
    username: url.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, ''),
    url,
  }));
  const twitter = (profile?.['Twitter Handles'] || '')
    .replace(/^\[|\]$/g, '')
    .split(',')[0]
    .trim();
  if (twitter) {
    socials.push({ network: 'Twitter', username: twitter, url: `https://x.com/${twitter}` });
  }

  const skillNames = (tables['skills.csv'] || []).map((row) => row.Name).filter(Boolean);

  return {
    personal: {
      name: full(profile?.['First Name'], profile?.['Last Name']),
      role: profile?.Headline,
      email,
      phone: tables['phonenumbers.csv']?.[0]?.Number,
      city: profile?.['Geo Location'],
      summary: profile?.Summary,
      socials,
    },
    experience: (tables['positions.csv'] || []).map((row) => ({
      company: row['Company Name'],
      role: row.Title,
      location: row.Location,
      startDate: row['Started On'],
      endDate: row['Finished On'],
      isCurrent: !row['Finished On'],
      description: row.Description,
    })),
    education: (tables['education.csv'] || []).map((row) => ({
      institution: row['School Name'],
      degree: full(row['Degree Name'], row.Notes ? `— ${row.Notes}` : ''),
      startDate: row['Start Date'],
      endDate: row['End Date'],
    })),
    skills:
      skillNames.length > 0
        ? [{ category: SKILLS_LABEL[lang] || SKILLS_LABEL.en, items: skillNames.join(', ') }]
        : [],
    certifications: (tables['certifications.csv'] || []).map((row) => ({
      category: row.Authority,
      items: row.Name,
    })),
    projects: (tables['projects.csv'] || []).map((row) => ({
      name: row.Title,
      url: row.Url,
      startDate: row['Started On'],
      endDate: row['Finished On'],
      description: row.Description,
    })),
    languages: (tables['languages.csv'] || [])
      .map((row) => (row.Proficiency ? `${row.Name} (${row.Proficiency})` : row.Name))
      .filter(Boolean)
      .join(', '),
  };
}
