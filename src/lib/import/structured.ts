import { ImportError, type ImportKind, type ImportSource } from './types';

/**
 * Resumes kept as data files by code-based CV builders. The syntax (JSON, YAML, TOML, XML)
 * only decides how the file is parsed; the mapping is chosen from the shape of the data.
 * Shapes we do not know are handed to the AI import as text.
 */

type Row = Record<string, unknown>;

const isRow = (value: unknown): value is Row =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const rowsOf = (value: unknown): Row[] => list(value).filter(isRow);
const str = (value: unknown): string =>
  typeof value === 'string' || typeof value === 'number' ? String(value) : '';
const joined = (parts: unknown[], separator = ', ') =>
  parts.map(str).filter(Boolean).join(separator);

export async function parseStructured(text: string, kind: ImportKind): Promise<unknown> {
  try {
    if (kind === 'json') return JSON.parse(text);
    if (kind === 'yaml') return (await import('yaml')).parse(text);
    if (kind === 'toml') return (await import('smol-toml')).parse(text);
    if (kind === 'xml') {
      const { XMLParser, XMLValidator } = await import('fast-xml-parser');
      if (XMLValidator.validate(text) !== true) throw new Error('invalid xml');
      // Entities are left alone: nothing in a resume needs them expanded
      return new XMLParser({ ignoreAttributes: false, processEntities: false }).parse(text);
    }
  } catch {
    throw new ImportError('unreadable');
  }
  throw new ImportError('unsupported');
}

// ── JSON Resume (jsonresume.org) ────────────────────────────────────────────

const isJsonResume = (data: Row) =>
  isRow(data.basics) &&
  ('work' in data || 'education' in data || 'skills' in data || 'name' in data.basics);

const customFrom = (title: string, items: Row[], map: (row: Row) => Row) =>
  items.length > 0 ? [{ title, items: items.map(map) }] : [];

function fromJsonResume(data: Row): unknown {
  const basics = data.basics as Row;
  const location = isRow(basics.location) ? basics.location : {};

  const socials = rowsOf(basics.profiles).map((profile) => ({
    network: profile.network,
    username: profile.username,
    url: profile.url,
  }));
  if (basics.url) socials.push({ network: 'Web', username: basics.url, url: basics.url });

  return {
    personal: {
      name: basics.name,
      role: basics.label,
      email: basics.email,
      phone: basics.phone,
      city: joined([location.city, location.region, location.countryCode]),
      summary: basics.summary,
      socials,
    },
    experience: rowsOf(data.work).map((job) => ({
      company: job.name ?? job.company,
      role: job.position,
      location: job.location,
      startDate: job.startDate,
      endDate: job.endDate,
      isCurrent: !job.endDate,
      description: [...(job.summary ? [job.summary] : []), ...list(job.highlights)],
    })),
    education: rowsOf(data.education).map((school) => ({
      institution: school.institution,
      degree: joined([school.studyType, school.area], ' — '),
      startDate: school.startDate,
      endDate: school.endDate,
    })),
    skills: rowsOf(data.skills).map((skill) => ({
      category: skill.name,
      items: joined(list(skill.keywords)) || str(skill.level),
    })),
    certifications: rowsOf(data.certificates).map((certificate) => ({
      category: certificate.issuer,
      items: certificate.name,
    })),
    projects: rowsOf(data.projects).map((project) => ({
      name: project.name,
      role: joined(list(project.roles)),
      url: project.url,
      startDate: project.startDate,
      endDate: project.endDate,
      description: [
        ...(project.description ? [project.description] : []),
        ...list(project.highlights),
      ],
    })),
    languages: rowsOf(data.languages)
      .map((entry) =>
        entry.fluency ? `${str(entry.language)} (${str(entry.fluency)})` : str(entry.language)
      )
      .filter(Boolean)
      .join(', '),
    interests: joined(rowsOf(data.interests).map((interest) => interest.name)),
    customSections: [
      ...customFrom('Volunteer', rowsOf(data.volunteer), (row) => ({
        title: row.organization,
        subtitle: joined([row.position, joined([row.startDate, row.endDate], ' – ')], ' · '),
        description: joined([row.summary, ...list(row.highlights)], '\n'),
      })),
      ...customFrom('Awards', rowsOf(data.awards), (row) => ({
        title: row.title,
        subtitle: joined([row.awarder, row.date], ' · '),
        description: row.summary,
      })),
      ...customFrom('Publications', rowsOf(data.publications), (row) => ({
        title: row.name,
        subtitle: joined([row.publisher, row.releaseDate], ' · '),
        description: row.summary,
      })),
    ],
  };
}

// ── RenderCV (rendercv.com) ─────────────────────────────────────────────────

const isRenderCv = (data: Row) => isRow(data.cv) && ('sections' in data.cv || 'name' in data.cv);

const SOCIAL_URLS: Record<string, string> = {
  linkedin: 'https://linkedin.com/in/',
  github: 'https://github.com/',
  gitlab: 'https://gitlab.com/',
  x: 'https://x.com/',
  twitter: 'https://x.com/',
};

function fromRenderCv(data: Row): unknown {
  const cv = data.cv as Row;
  const result = {
    personal: {
      name: cv.name,
      role: cv.headline ?? cv.label,
      email: cv.email,
      phone: str(cv.phone).replace(/^tel:/, ''),
      city: cv.location,
      summary: '',
      socials: rowsOf(cv.social_networks).map((entry): Row => ({
        network: entry.network,
        username: entry.username,
        url: `${SOCIAL_URLS[str(entry.network).toLowerCase()] || ''}${str(entry.username)}`,
      })),
    },
    experience: [] as Row[],
    education: [] as Row[],
    skills: [] as Row[],
    certifications: [] as Row[],
    projects: [] as Row[],
    languages: '',
    customSections: [] as Row[],
  };
  if (cv.website) {
    result.personal.socials.push({ network: 'Web', username: cv.website, url: cv.website });
  }

  const dates = (entry: Row) => ({
    startDate: entry.start_date ?? entry.date,
    endDate: entry.end_date,
    isCurrent: str(entry.end_date).toLowerCase() === 'present',
  });
  const bullets = (entry: Row) => [
    ...(entry.summary ? [entry.summary] : []),
    ...list(entry.highlights),
  ];

  const sections = isRow(cv.sections) ? cv.sections : {};
  for (const [key, value] of Object.entries(sections)) {
    const title = key.replace(/_/g, ' ').replace(/^\w/, (letter) => letter.toUpperCase());
    const entries = list(value);
    const texts = entries.filter((entry) => typeof entry === 'string') as string[];
    const objects = entries.filter(isRow);
    const first = objects[0] || {};

    if (texts.length > 0 && objects.length === 0) {
      if (
        !result.personal.summary &&
        /summary|about|profile|objective|resumen|perfil|sobre/i.test(key)
      ) {
        result.personal.summary = texts.join('\n\n');
      } else {
        result.customSections.push({ title, items: texts.map((text) => ({ description: text })) });
      }
    } else if ('company' in first) {
      result.experience.push(
        ...objects.map((entry) => ({
          company: entry.company,
          role: entry.position,
          location: entry.location,
          ...dates(entry),
          description: bullets(entry),
        }))
      );
    } else if ('institution' in first) {
      result.education.push(
        ...objects.map((entry) => ({
          institution: entry.institution,
          degree: joined([entry.degree, entry.area], ' — '),
          ...dates(entry),
        }))
      );
    } else if ('label' in first) {
      const target = /certif/i.test(key) ? result.certifications : result.skills;
      if (/^(spoken )?languages?$|idiomas/i.test(key)) {
        result.languages = objects
          .map((entry) => joined([entry.label, entry.details], ': '))
          .join(', ');
      } else {
        target.push(...objects.map((entry) => ({ category: entry.label, items: entry.details })));
      }
    } else if ('name' in first && /project|proyecto|projeto/i.test(key)) {
      result.projects.push(
        ...objects.map((entry) => ({
          name: entry.name,
          url: entry.url,
          ...dates(entry),
          description: bullets(entry),
        }))
      );
    } else if (objects.length > 0) {
      result.customSections.push({
        title,
        items: objects.map((entry) => ({
          title: entry.name ?? entry.title ?? entry.bullet,
          subtitle: joined([entry.location, entry.journal, entry.date ?? entry.start_date], ' · '),
          description: joined([joined(list(entry.authors)), ...bullets(entry)], '\n'),
        })),
      });
    }
  }
  return result;
}

// ── CVStudio's own data ─────────────────────────────────────────────────────

const isCvStudio = (data: Row) => isRow(data.personal) && 'experience' in data;

/** Returns loosely-shaped CV data when the schema is known, or null to let the AI read it. */
export function mapStructured(data: unknown): { source: ImportSource; data: unknown } | null {
  if (!isRow(data)) return null;
  if (isJsonResume(data)) return { source: 'json-resume', data: fromJsonResume(data) };
  if (isRenderCv(data)) return { source: 'rendercv', data: fromRenderCv(data) };
  if (isCvStudio(data)) return { source: 'cvstudio', data };
  return null;
}
