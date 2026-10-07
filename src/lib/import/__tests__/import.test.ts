import { strToU8, zipSync } from 'fflate';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../api';
import { detectKind, checkSize, MAX_TEXT_BYTES } from '../detect';
import { importFile, prepareImport, ImportError } from '../index';
import { cleanText, cleanUrl, normalizeImported, toBullets, toMonth } from '../normalize';
import { mapStructured, parseStructured } from '../structured';

const importCV = vi.hoisted(() => vi.fn());
vi.mock('../../api', async (original) => {
  const actual = await original<typeof import('../../api')>();
  return { ...actual, api: { ...actual.api, importCV } };
});

const file = (name: string, content: string | Uint8Array) => new File([content as BlobPart], name);
const bytes = (text: string) => new TextEncoder().encode(text);
const codeOf = async (promise: Promise<unknown>) =>
  promise.then(
    () => 'resolved',
    (error) => (error instanceof ImportError ? error.code : `other: ${error}`)
  );

const JSON_RESUME = {
  basics: {
    name: 'Ada Lovelace',
    label: 'Mathematician',
    email: 'ada@example.com',
    phone: '+44 20 7946 0000',
    url: 'https://ada.dev',
    summary: 'First programmer.',
    location: { city: 'London', countryCode: 'GB' },
    profiles: [{ network: 'GitHub', username: 'ada', url: 'https://github.com/ada' }],
  },
  work: [
    {
      name: 'Analytical Engines Ltd',
      position: 'Lead Analyst',
      startDate: '1842-03-01',
      summary: 'Wrote the notes.',
      highlights: ['Published the first algorithm'],
    },
    { company: 'Old Co', position: 'Clerk', startDate: '1838', endDate: '1841-12' },
  ],
  education: [{ institution: 'Home', area: 'Mathematics', studyType: 'Private', endDate: '1835' }],
  skills: [{ name: 'Languages', keywords: ['Notes', 'Diagrams'] }],
  languages: [{ language: 'English', fluency: 'Native' }, { language: 'French' }],
  interests: [{ name: 'Music' }, { name: 'Flying machines' }],
  projects: [{ name: 'Note G', highlights: ['Bernoulli numbers'], url: 'ada.dev/note-g' }],
  certificates: [{ name: 'Royal Society', issuer: 'RS' }],
  awards: [{ title: 'Medal', awarder: 'Queen', date: '1843' }],
};

const RENDERCV = `
cv:
  name: Grace Hopper
  location: Arlington, VA
  email: grace@example.com
  phone: tel:+1-555-0100
  website: https://grace.dev
  social_networks:
    - network: LinkedIn
      username: gracehopper
  sections:
    summary:
      - Compiler pioneer.
    experience:
      - company: US Navy
        position: Rear Admiral
        location: Washington
        start_date: 1943-12
        end_date: present
        highlights:
          - Built the first compiler
    education:
      - institution: Yale
        area: Mathematics
        degree: PhD
        start_date: 1930-09
        end_date: 1934-06
    skills:
      - label: Languages
        details: COBOL, FLOW-MATIC
    side_projects:
      - name: A-0 System
        date: 1952-05
        highlights:
          - Linker and loader
    publications:
      - title: The Education of a Computer
        authors: [Grace Hopper]
        date: 1952
`;

describe('detectKind', () => {
  it.each([
    ['cv.pdf', '%PDF-1.7', 'pdf'],
    ['renamed.json', '%PDF-1.7', 'pdf'],
    ['export.zip', 'PK\u0003\u0004', 'zip'],
    ['resume.JSON', '{}', 'json'],
    ['cv.yml', 'cv:', 'yaml'],
    ['cv.yaml', 'cv:', 'yaml'],
    ['resume.toml', '[basics]', 'toml'],
    ['cv.xml', '<cv/>', 'xml'],
    ['noextension', '  {"basics":{}}', 'json'],
    ['noextension', '\uFEFF<resume/>', 'xml'],
  ])('%s starting with %j is %s', (name, head, kind) => {
    expect(detectKind(name, bytes(head))).toBe(kind);
  });

  it('rejects what it cannot read', () => {
    expect(() => detectKind('cv.docx', bytes('hello'))).toThrow(ImportError);
    expect(() => detectKind('notes', bytes('plain text'))).toThrow(ImportError);
    // Says it is a PDF but is not one
    expect(() => detectKind('fake.pdf', bytes('<html>'))).toThrow(ImportError);
  });

  it('enforces size limits', () => {
    expect(() => checkSize('json', 0)).toThrow(ImportError);
    expect(() => checkSize('json', MAX_TEXT_BYTES + 1)).toThrow(ImportError);
    expect(() => checkSize('pdf', MAX_TEXT_BYTES + 1)).not.toThrow();
  });
});

describe('normalize helpers', () => {
  it.each([
    ['2020-05', '2020-05'],
    ['2020-5', '2020-05'],
    ['2020-05-17', '2020-05'],
    ['2020-05-17T10:00:00Z', '2020-05'],
    ['2019', '2019-01'],
    [2019, '2019-01'],
    ['Jan 2020', '2020-01'],
    ['abril de 2021', '2021-04'],
    ['03/2021', '2021-03'],
    ['2020-13', ''],
    ['present', ''],
    ['', ''],
    [null, ''],
    [{ year: 2020 }, ''],
  ])('toMonth(%j) → %j', (input, expected) => {
    expect(toMonth(input)).toBe(expected);
  });

  it('reads Date objects (YAML and TOML produce them)', () => {
    expect(toMonth(new Date('2021-07-15T00:00:00Z'))).toBe('2021-07');
  });

  it('strips markup but keeps comparisons', () => {
    expect(cleanText('<b>Bold</b> <script>alert(1)</script> text')).toBe('Bold alert(1) text');
    expect(cleanText('latency < 100 ms and a > b')).toBe('latency < 100 ms and a > b');
    expect(cleanText('<img src=x onerror=alert(1)')).not.toContain('<');
    expect(cleanText('x'.repeat(500))).toHaveLength(300);
    expect(cleanText({ a: 1 })).toBe('');
  });

  it('only lets web links through', () => {
    expect(cleanUrl('https://a.dev/x')).toBe('https://a.dev/x');
    expect(cleanUrl('github.com/ada')).toBe('https://github.com/ada');
    expect(cleanUrl('javascript:alert(1)')).toBe('');
    expect(cleanUrl('data:text/html,x')).toBe('');
    expect(cleanUrl('not a url')).toBe('');
  });

  it('turns paragraphs into bullets', () => {
    expect(toBullets('• First\n- Second\n\n* Third')).toEqual(['First', 'Second', 'Third']);
    expect(toBullets('One • Two • Three')).toEqual(['One', 'Two', 'Three']);
    expect(toBullets(['a', '', 3, null, { x: 1 }])).toEqual(['a', '3']);
    expect(toBullets(undefined)).toEqual([]);
  });
});

describe('normalizeImported', () => {
  it('always returns a well-formed CV', () => {
    for (const input of [null, undefined, 'text', 42, [], { personal: 'x', experience: 'y' }]) {
      const { data, missing } = normalizeImported(input);
      expect(data.personal.socials).toEqual([]);
      expect(data.experience).toEqual([]);
      expect(data.sectionOrder).toEqual([
        'experience',
        'projects',
        'education',
        'skills',
        'custom',
      ]);
      expect(missing).toEqual(['name', 'experience', 'education', 'skills']);
    }
  });

  it('caps sizes, drops junk rows and assigns unique ids', () => {
    const { data } = normalizeImported({
      personal: {
        name: 'A',
        socials: Array.from({ length: 50 }, (_, i) => ({ url: `a${i}.dev` })),
      },
      experience: [
        'junk',
        null,
        {},
        ...Array.from({ length: 100 }, (_, i) => ({
          company: `C${i}`,
          description: Array.from({ length: 80 }, (_, j) => `b${j}`),
        })),
      ],
      skills: [{ category: 'Lang', items: ['a', 'b'] }, { nothing: true }],
      language: 'pt-BR',
    });

    expect(data.personal.socials).toHaveLength(10);
    expect(data.experience.length).toBeLessThanOrEqual(40);
    expect(data.experience[0].description).toHaveLength(30);
    expect(new Set(data.experience.map((item) => item.id)).size).toBe(data.experience.length);
    expect(data.skills).toEqual([expect.objectContaining({ category: 'Lang', items: 'a, b' })]);
    expect(data.language).toBe('PT');
  });

  it('works out current positions', () => {
    const { data } = normalizeImported({
      experience: [
        { company: 'A', startDate: '2020-01', isCurrent: true },
        { company: 'B', startDate: '2018-01', endDate: 'Present' },
        { company: 'C', startDate: '2015-01', endDate: '2017-12', isCurrent: true },
        { company: 'D', startDate: '2014-01' },
      ],
    });
    expect(data.experience.map((job) => [job.endDate, job.isCurrent])).toEqual([
      [null, true],
      [null, true],
      ['2017-12', false],
      [null, false],
    ]);
  });
});

describe('structured files', () => {
  it('maps JSON Resume', async () => {
    const result = await importFile(file('resume.json', JSON.stringify(JSON_RESUME)), {
      lang: 'en',
      getToken: async () => null,
    });

    expect(result.source).toBe('json-resume');
    expect(result.missing).toEqual([]);
    const { data } = result;
    expect(data.personal).toMatchObject({
      name: 'Ada Lovelace',
      role: 'Mathematician',
      email: 'ada@example.com',
      city: 'London, GB',
    });
    expect(data.personal.socials.map((social) => social.url)).toEqual([
      'https://github.com/ada',
      'https://ada.dev',
    ]);
    expect(data.experience[0]).toMatchObject({
      company: 'Analytical Engines Ltd',
      role: 'Lead Analyst',
      startDate: '1842-03',
      endDate: null,
      isCurrent: true,
      description: ['Wrote the notes.', 'Published the first algorithm'],
    });
    expect(data.experience[1]).toMatchObject({
      company: 'Old Co',
      startDate: '1838-01',
      endDate: '1841-12',
      isCurrent: false,
    });
    expect(data.education[0]).toMatchObject({
      institution: 'Home',
      degree: 'Private — Mathematics',
    });
    expect(data.skills[0]).toMatchObject({ category: 'Languages', items: 'Notes, Diagrams' });
    expect(data.languages).toBe('English (Native), French');
    expect(data.interests).toBe('Music, Flying machines');
    expect(data.projects?.[0]).toMatchObject({ name: 'Note G', url: 'https://ada.dev/note-g' });
    expect(data.certifications[0]).toMatchObject({ category: 'RS', items: 'Royal Society' });
    expect(data.customSections?.[0]).toMatchObject({ title: 'Awards' });
    expect(importCV).not.toHaveBeenCalled();
  });

  it('maps the same data written as YAML or TOML', async () => {
    const yaml = (await import('yaml')).stringify(JSON_RESUME);
    const toml = (await import('smol-toml')).stringify(JSON_RESUME);
    for (const [name, text] of [
      ['resume.yaml', yaml],
      ['resume.toml', toml],
    ]) {
      const { data, source } = await importFile(file(name, text), {
        lang: 'en',
        getToken: async () => null,
      });
      expect(source, name).toBe('json-resume');
      expect(data.personal.name, name).toBe('Ada Lovelace');
      expect(data.experience, name).toHaveLength(2);
    }
  });

  it('maps RenderCV', async () => {
    const { data, source } = await importFile(file('Grace_CV.yaml', RENDERCV), {
      lang: 'en',
      getToken: async () => null,
    });

    expect(source).toBe('rendercv');
    expect(data.personal).toMatchObject({
      name: 'Grace Hopper',
      phone: '+1-555-0100',
      city: 'Arlington, VA',
      summary: 'Compiler pioneer.',
    });
    expect(data.personal.socials[0]).toMatchObject({
      network: 'LinkedIn',
      url: 'https://linkedin.com/in/gracehopper',
    });
    expect(data.experience[0]).toMatchObject({
      company: 'US Navy',
      role: 'Rear Admiral',
      startDate: '1943-12',
      endDate: null,
      isCurrent: true,
      description: ['Built the first compiler'],
    });
    expect(data.education[0]).toMatchObject({ institution: 'Yale', degree: 'PhD — Mathematics' });
    expect(data.skills[0]).toMatchObject({ category: 'Languages', items: 'COBOL, FLOW-MATIC' });
    expect(data.projects?.[0]).toMatchObject({ name: 'A-0 System', startDate: '1952-05' });
    expect(data.customSections?.[0]).toMatchObject({ title: 'Publications' });
    expect(data.customSections?.[0].items[0].title).toBe('The Education of a Computer');
  });

  it("accepts CVStudio's own data", async () => {
    const own = {
      personal: { name: 'Own Format', socials: [] },
      experience: [{ company: 'X', role: 'Y', startDate: '2020-01', description: ['z'] }],
    };
    const { source, data } = await importFile(file('cv.json', JSON.stringify(own)), {
      lang: 'es',
      getToken: async () => null,
    });
    expect(source).toBe('cvstudio');
    expect(data.experience[0].company).toBe('X');
  });

  it('hands unknown schemas to the AI as text', async () => {
    const xml = '<resume><person><fullName>Linus</fullName></person></resume>';
    expect(await prepareImport(file('cv.xml', xml), 'en')).toEqual({
      kind: 'needsAi',
      text: xml,
      source: 'structured',
    });
    expect(mapStructured(await parseStructured('[1, 2]', 'json'))).toBeNull();
    expect(mapStructured({ profile: { name: 'x' } })).toBeNull();
  });

  it.each([
    ['broken.json', '{"basics": '],
    ['broken.yaml', 'a: [1, 2'],
    ['broken.toml', 'a = = 1'],
    ['broken.xml', '<a><b></a>'],
  ])('%s is reported as unreadable', async (name, text) => {
    expect(await codeOf(prepareImport(file(name, text), 'en'))).toBe('unreadable');
  });

  it('reports a known format with nothing in it as empty', async () => {
    const empty = JSON.stringify({ basics: {}, work: [] });
    expect(await codeOf(prepareImport(file('resume.json', empty), 'en'))).toBe('empty');
  });

  it('does not let a hostile file through', async () => {
    const hostile = {
      basics: {
        name: '<img src=x onerror=alert(1)>Mallory',
        summary: '<script>steal()</script>Hi',
        url: 'javascript:alert(1)',
        profiles: [{ network: 'X', url: 'data:text/html,boom' }],
      },
      work: [{ name: 'Evil <iframe src="//x">', highlights: ['<a href="javascript:x">click</a>'] }],
      __proto__: { polluted: true },
    };
    const { data } = await importFile(file('resume.json', JSON.stringify(hostile)), {
      lang: 'en',
      getToken: async () => null,
    });

    const everything = JSON.stringify(data);
    expect(everything).not.toMatch(/<\s*(img|script|iframe|a)\b/i);
    expect(everything).not.toContain('javascript:');
    expect(data.personal.name).toBe('Mallory');
    expect(data.personal.socials).toEqual([]);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});

describe('LinkedIn data export', () => {
  const csv = (rows: string[][]) =>
    rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');

  const exportZip = () =>
    zipSync({
      'Profile.csv': strToU8(
        '\uFEFF' +
          csv([
            [
              'First Name',
              'Last Name',
              'Headline',
              'Summary',
              'Geo Location',
              'Websites',
              'Twitter Handles',
            ],
            [
              'Katherine',
              'Johnson',
              'Research Mathematician',
              'Orbital mechanics.\nSecond line, with "quotes".',
              'Hampton, Virginia',
              '[PERSONAL:https://kj.dev,COMPANY:https://nasa.gov]',
              '[kjohnson]',
            ],
          ])
      ),
      'Positions.csv': strToU8(
        csv([
          ['Company Name', 'Title', 'Description', 'Location', 'Started On', 'Finished On'],
          ['NASA', 'Mathematician', '• Trajectories\n• Launch windows', 'Hampton', 'Jun 1953', ''],
          ['NACA', 'Computer', '', 'Hampton', 'Jan 1950', 'May 1953'],
        ])
      ),
      'Education.csv': strToU8(
        csv([
          ['School Name', 'Start Date', 'End Date', 'Notes', 'Degree Name', 'Activities'],
          ['West Virginia State', '1933', '1937', '', 'BSc Mathematics', ''],
        ])
      ),
      'Skills.csv': strToU8(csv([['Name'], ['Geometry'], ['Fortran']])),
      'Languages.csv': strToU8(
        csv([
          ['Name', 'Proficiency'],
          ['English', 'Native or bilingual'],
          ['French', ''],
        ])
      ),
      'Certifications.csv': strToU8(
        csv([
          ['Name', 'Url', 'Authority'],
          ['Flight Dynamics', '', 'NASA'],
        ])
      ),
      'Email Addresses.csv': strToU8(
        csv([
          ['Email Address', 'Confirmed', 'Primary'],
          ['old@example.com', 'Yes', 'No'],
          ['kj@example.com', 'Yes', 'Yes'],
        ])
      ),
      'PhoneNumbers.csv': strToU8(
        csv([
          ['Extension', 'Number', 'Type'],
          ['', '+1 757 555 0100', 'Mobile'],
        ])
      ),
      // Present in real exports and never read
      'Connections.csv': strToU8('Notes:\n"secret"\n\nFirst Name,Last Name\nA,B'),
      'media/photo.jpg': new Uint8Array(1024),
    });

  it('builds a CV without calling the AI', async () => {
    const result = await importFile(file('Basic_LinkedInDataExport.zip', exportZip()), {
      lang: 'es',
      getToken: async () => null,
    });

    expect(result.source).toBe('linkedin');
    expect(result.missing).toEqual([]);
    const { data } = result;
    expect(data.personal).toMatchObject({
      name: 'Katherine Johnson',
      role: 'Research Mathematician',
      email: 'kj@example.com',
      phone: '+1 757 555 0100',
      city: 'Hampton, Virginia',
    });
    expect(data.personal.summary).toContain('with "quotes"');
    expect(data.personal.socials.map((social) => social.url)).toEqual([
      'https://kj.dev',
      'https://nasa.gov',
      'https://x.com/kjohnson',
    ]);
    expect(data.experience).toHaveLength(2);
    expect(data.experience[0]).toMatchObject({
      company: 'NASA',
      startDate: '1953-06',
      endDate: null,
      isCurrent: true,
      description: ['Trajectories', 'Launch windows'],
    });
    expect(data.experience[1]).toMatchObject({ endDate: '1953-05', isCurrent: false });
    expect(data.education[0]).toMatchObject({
      institution: 'West Virginia State',
      degree: 'BSc Mathematics',
      startDate: '1933-01',
      endDate: '1937-01',
    });
    expect(data.skills).toEqual([
      expect.objectContaining({ category: 'Habilidades', items: 'Geometry, Fortran' }),
    ]);
    expect(data.languages).toBe('English (Native or bilingual), French');
    expect(data.certifications[0]).toMatchObject({ category: 'NASA', items: 'Flight Dynamics' });
    expect(JSON.stringify(data)).not.toContain('secret');
    expect(importCV).not.toHaveBeenCalled();
  });

  it('finds the files inside a folder and survives missing ones', async () => {
    const zip = zipSync({
      'export/Profile.csv': strToU8(
        csv([
          ['First Name', 'Last Name'],
          ['Only', 'Name'],
        ])
      ),
    });
    const { data, missing } = await importFile(file('export.zip', zip), {
      lang: 'en',
      getToken: async () => null,
    });
    expect(data.personal.name).toBe('Only Name');
    expect(missing).toEqual(['experience', 'education', 'skills']);
  });

  it('rejects other ZIP files and corrupt ones', async () => {
    const other = zipSync({ 'readme.txt': strToU8('hello') });
    expect(await codeOf(prepareImport(file('photos.zip', other), 'en'))).toBe('notLinkedin');

    const corrupt = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(await codeOf(prepareImport(file('bad.zip', corrupt), 'en'))).toBe('unreadable');
  });
});

describe('AI import', () => {
  const unknown = file('cv.xml', '<resume><name>Linus Torvalds</name></resume>');
  const signedIn = { lang: 'pt' as const, getToken: async () => 'token-1' };

  beforeEach(() => {
    importCV.mockReset();
  });

  it('asks guests to sign in without calling the server', async () => {
    expect(await codeOf(importFile(unknown, { lang: 'en', getToken: async () => null }))).toBe(
      'needsAuth'
    );
    expect(importCV).not.toHaveBeenCalled();
  });

  it('sends the text and normalizes what comes back', async () => {
    importCV.mockResolvedValue({
      cv: {
        personal: { name: 'Linus <b>Torvalds</b>', email: 'l@example.com' },
        experience: [{ company: 'Linux Foundation', startDate: '2003', isCurrent: true }],
        language: 'EN',
        extra: 'ignored',
      },
      remaining_free_imports: 1,
    });

    const result = await importFile(unknown, signedIn);

    expect(importCV).toHaveBeenCalledWith(
      {
        text: '<resume><name>Linus Torvalds</name></resume>',
        source: 'structured',
        language: 'pt',
      },
      'token-1'
    );
    expect(result).toMatchObject({
      source: 'ai',
      remainingFreeImports: 1,
      missing: ['education', 'skills'],
    });
    expect(result.data.personal.name).toBe('Linus Torvalds');
    expect(result.data.experience[0]).toMatchObject({ startDate: '2003-01', isCurrent: true });
    expect(result.data.experience[0].id).toBeTruthy();
    expect(result.data.language).toBe('EN');
  });

  it('caps the text sent to the server', async () => {
    importCV.mockResolvedValue({ cv: { personal: { name: 'Big' } }, remaining_free_imports: null });
    const big = file('cv.xml', `<r>${'x'.repeat(100_000)}</r>`);
    await importFile(big, signedIn);
    expect(importCV.mock.calls[0][0].text.length).toBe(58_000);
  });

  it.each([
    [401, 'needsAuth'],
    [403, 'limit'],
    [429, 'rateLimited'],
    [422, 'empty'],
    [502, 'failed'],
  ])('maps a %i from the server to "%s"', async (status, code) => {
    importCV.mockRejectedValue(new ApiError('nope', status));
    expect(await codeOf(importFile(unknown, signedIn))).toBe(code);
  });

  it('treats an empty answer and a network failure as errors', async () => {
    importCV.mockResolvedValue({ cv: {}, remaining_free_imports: 1 });
    expect(await codeOf(importFile(unknown, signedIn))).toBe('empty');

    importCV.mockRejectedValue(new TypeError('Failed to fetch'));
    expect(await codeOf(importFile(unknown, signedIn))).toBe('failed');
  });
});
