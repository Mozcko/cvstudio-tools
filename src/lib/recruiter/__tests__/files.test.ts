import { strToU8, zipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import type { Screening } from '../../api';
import { csvCell, rankingToCsv } from '../csv';
import {
  CandidateFileProblem,
  docxXmlToText,
  MAX_FILE_BYTES,
  MAX_TEXT_CHARS,
  odtXmlToText,
  readCandidateFile,
  rtfToText,
} from '../files';

const BODY =
  'Seven years building Python services for payments at Acme. Designed PostgreSQL schemas and tuned queries.';

const file = (name: string, content: string | Uint8Array) => new File([content as BlobPart], name);
const codeOf = (promise: Promise<unknown>) =>
  promise.then(
    () => 'resolved',
    (error) => (error instanceof CandidateFileProblem ? error.code : `other: ${error}`)
  );

const docx = (paragraphs: string[]) =>
  zipSync({
    '[Content_Types].xml': strToU8('<Types/>'),
    'word/document.xml': strToU8(
      `<?xml version="1.0"?><w:document><w:body>${paragraphs
        .map(
          (text) =>
            `<w:p><w:pPr><w:jc w:val="left"/></w:pPr><w:r><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`
        )
        .join('')}</w:body></w:document>`
    ),
    'word/media/photo.png': new Uint8Array(2048),
  });

const odt = (paragraphs: string[]) =>
  zipSync({
    mimetype: strToU8('application/vnd.oasis.opendocument.text'),
    'content.xml': strToU8(
      `<?xml version="1.0"?><office:document-content><office:automatic-styles><style:style style:name="P1">ignored</style:style></office:automatic-styles><office:body><office:text>${paragraphs
        .map((text) => `<text:p text:style-name="P1">${text}</text:p>`)
        .join('')}</office:text></office:body></office:document-content>`
    ),
  });

describe('document text', () => {
  it('reads Word XML: paragraphs, tabs, breaks, tables, entities; skips deleted text', () => {
    const xml =
      '<w:body><w:p><w:r><w:t>Ana</w:t></w:r><w:r><w:tab/><w:t>Torres</w:t></w:r></w:p>' +
      '<w:p><w:r><w:t>R&amp;D &lt;lead&gt; &#233;quipe &#x41;</w:t><w:br/><w:t>second line</w:t></w:r></w:p>' +
      '<w:p><w:del><w:r><w:delText>removed</w:delText></w:r></w:del><w:r><w:t>kept</w:t></w:r></w:p>' +
      '<w:tbl><w:tr><w:tc><w:p><w:r><w:t>Python</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>5 years</w:t></w:r></w:p></w:tc></w:tr></w:tbl></w:body>';

    const text = docxXmlToText(xml);

    // Tabs and runs of spaces come out as single spaces
    expect(text).toContain('Ana Torres');
    expect(text).toContain('R&D <lead> équipe A\nsecond line');
    expect(text).toContain('kept');
    expect(text).not.toContain('removed');
    expect(text).toMatch(/Python\s+5 years/);
    expect(text).not.toMatch(/<w:|&amp;/);
  });

  it('reads OpenDocument XML and ignores styles and tracked changes', () => {
    const xml =
      '<office:automatic-styles>style noise</office:automatic-styles><office:body><office:text>' +
      '<text:tracked-changes><text:p>old wording</text:p></text:tracked-changes>' +
      '<text:h>Experiencia</text:h><text:p>Línea<text:s/>uno<text:line-break/>dos<text:tab/>tres</text:p>' +
      '<text:list><text:list-item><text:p>Python</text:p></text:list-item></text:list>' +
      '</office:text></office:body>';

    const text = odtXmlToText(xml);

    expect(text).toBe('Experiencia\nLínea uno\ndos tres\nPython');
  });

  it('reduces rich text to its words', () => {
    const rtf =
      '{\\rtf1\\ansi{\\fonttbl{\\f0 Arial;}}{\\colortbl;\\red0\\green0\\blue0;}' +
      "\\f0\\fs24 Ana Torres\\par Ingenier\\'eda de datos\\par \\b Python\\b0  y SQL\\line \\u241?o\\tab fin}";

    const text = rtfToText(rtf);

    expect(text).toContain('Ana Torres\nIngeniería de datos\nPython y SQL');
    expect(text).toContain('ño');
    expect(text).not.toMatch(/\\|\{|\}|Arial|red0/);
  });
});

describe('readCandidateFile', () => {
  it.each([
    ['ana.docx', docx(['Ana Torres', BODY])],
    ['ana.odt', odt(['Ana Torres', BODY])],
    // The content decides, not the name
    ['renamed.pdf.docx', odt(['Ana Torres', BODY])],
    ['ana.txt', `Ana Torres\n${BODY}`],
    ['ana.md', `# Ana Torres\n\n${BODY}`],
    ['ana.rtf', `{\\rtf1 Ana Torres\\par ${BODY}}`],
  ])('reads %s', async (name, content) => {
    const text = await readCandidateFile(file(name, content));
    expect(text).toContain('Ana Torres');
    expect(text).toContain('Seven years building Python services');
    expect(text).not.toMatch(/<|\\par/);
  });

  it('cuts very long documents to what the server accepts', async () => {
    const text = await readCandidateFile(file('long.txt', 'word '.repeat(40_000)));
    expect(text.length).toBe(MAX_TEXT_CHARS);
  });

  it.each([
    [
      'legacy.doc',
      new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, 1, 2, 3]),
      'legacyDoc',
    ],
    ['photo.jpg', new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]), 'unsupported'],
    ['sheet.xlsx', zipSync({ 'xl/workbook.xml': strToU8('<x/>') }), 'unsupported'],
    ['broken.docx', new Uint8Array([0x50, 0x4b, 0x03, 0x04, 9, 9, 9, 9, 9, 9]), 'unreadable'],
    ['fake.pdf', '<html>not a pdf</html>'.repeat(10), 'unreadable'],
    ['empty.txt', '', 'noText'],
    ['blank.docx', docx(['', '   ']), 'noText'],
    ['short.txt', 'Ana Torres, engineer.', 'tooShort'],
    ['notes', 'x'.repeat(200), 'unsupported'],
  ])('%s → %s', async (name, content, code) => {
    expect(await codeOf(readCandidateFile(file(name, content)))).toBe(code);
  });

  it('refuses files that are too large without reading them', async () => {
    const big = {
      name: 'big.pdf',
      size: MAX_FILE_BYTES + 1,
      arrayBuffer: () => Promise.reject(new Error('read')),
    };
    expect(await codeOf(readCandidateFile(big as unknown as File))).toBe('tooLarge');
  });
});

describe('CSV export', () => {
  it('quotes what needs quoting and defuses spreadsheet formulas', () => {
    expect(csvCell('plain')).toBe('plain');
    expect(csvCell(42)).toBe('42');
    expect(csvCell(null)).toBe('');
    expect(csvCell('a, b')).toBe('"a, b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('two\nlines')).toBe('"two\nlines"');
    for (const formula of ['=HYPERLINK("http://evil")', '+1+1', '-2', '@SUM(A1)']) {
      expect(csvCell(formula).replace(/^"/, '')[0]).toBe("'");
    }
  });

  it('writes one candidate per line with the requirements as columns', () => {
    const screening = {
      rubric: [
        { id: 'r1', text: 'Python, 5+ years', kind: 'must' },
        { id: 'r2', text: 'Kubernetes', kind: 'nice' },
      ],
      ranking: [
        {
          rank: 1,
          display_name: 'Ana Torres',
          file_name: 'ana.pdf',
          contact: { emails: ['ana@example.com'], phones: ['+34 600'], links: [] },
          score: 88,
          missing_musts: 0,
          flagged: false,
          note: 'Call "Monday"',
          result: {
            requirements: [
              { id: 'r1', status: 'met' },
              { id: 'r2', status: 'missing' },
            ],
            strengths: ['Python', 'SQL'],
            concerns: [],
            summary: 'Strong.',
          },
        },
        {
          rank: 2,
          display_name: '=cmd|calc',
          file_name: 'x.pdf',
          contact: {},
          score: 10,
          missing_musts: 1,
          flagged: true,
          note: '',
          result: { requirements: [], strengths: [], concerns: ['Thin'], summary: '' },
        },
      ],
    } as unknown as Screening;
    const labels = {
      rank: '#',
      name: 'Name',
      score: 'Score',
      missingMusts: 'Missing',
      flagged: 'Flagged',
      yes: 'yes',
      no: 'no',
      email: 'E-mail',
      phone: 'Phone',
      links: 'Links',
      summary: 'Summary',
      strengths: 'Strengths',
      concerns: 'Concerns',
      note: 'Note',
      file: 'File',
    };

    const csv = rankingToCsv(screening, labels);
    const lines = csv.replace('\uFEFF', '').split('\r\n');

    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe(
      '#,Name,Score,Missing,Flagged,"Python, 5+ years",Kubernetes,E-mail,Phone,Links,Summary,Strengths,Concerns,Note,File'
    );
    expect(lines[1]).toBe(
      '1,Ana Torres,88,0,no,met,missing,ana@example.com,\'+34 600,,Strong.,Python · SQL,,"Call ""Monday""",ana.pdf'
    );
    expect(lines[2].startsWith("2,'=cmd|calc,10,1,yes,,,")).toBe(true);
  });
});
