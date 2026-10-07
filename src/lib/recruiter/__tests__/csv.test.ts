import { describe, expect, it } from 'vitest';
import type { Screening } from '../../api';
import { locales } from '../../../i18n/locales';
import { csvCell, rankingToCsv } from '../csv';

describe('csvCell', () => {
  it('quotes commas, quotes and line breaks', () => {
    expect(csvCell('plain')).toBe('plain');
    expect(csvCell('a, b')).toBe('"a, b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('two\nlines')).toBe('"two\nlines"');
    expect(csvCell(null)).toBe('');
    expect(csvCell(87)).toBe('87');
  });

  it('defuses cells a spreadsheet would run as formulas', () => {
    for (const start of ['=', '+', '-', '@']) {
      expect(csvCell(`${start}cmd()`)).toBe(`'${start}cmd()`);
    }
    expect(csvCell('=1,2')).toBe(`"'=1,2"`);
  });
});

describe('rankingToCsv', () => {
  const screening = {
    id: 's1',
    title: 'Backend',
    language: 'es',
    candidates: 1,
    top_score: 80,
    created_at: '2026-10-01T00:00:00Z',
    expires_at: '2026-12-30T00:00:00Z',
    job_description: '',
    rubric_locked: true,
    rubric: [
      { id: 'r1', text: 'Python, 3 años', kind: 'must' },
      { id: 'r2', text: 'Docker', kind: 'nice' },
    ],
    ranking: [
      {
        id: 'c1',
        rank: 1,
        top: true,
        display_name: '=Ada Lovelace',
        file_name: 'ada.pdf',
        contact: { emails: ['ada@example.com'], phones: [], links: ['example.com/ada'] },
        score: 80,
        missing_musts: 0,
        flagged: true,
        result: {
          requirements: [
            {
              id: 'r1',
              text: 'Python, 3 años',
              kind: 'must',
              status: 'met',
              evidence: '',
              verified: true,
            },
          ],
          strengths: ['Rigor', 'Claridad'],
          concerns: [],
          summary: 'Buen perfil',
        },
        note: '',
        created_at: '2026-10-01T00:00:00Z',
      },
    ],
  } as Screening;

  it('writes a header, one line per candidate and a column per requirement', () => {
    const csv = rankingToCsv(screening, locales.es.recruiter.screening.csv);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    const [header, row] = csv.slice(1).split('\r\n');
    expect(header).toContain('Posición,Nombre,Puntuación');
    expect(header).toContain('"Python, 3 años",Docker');
    // The name that starts with = is defused; r2 was not judged, so its column is empty
    expect(row).toBe(
      "1,'=Ada Lovelace,80,0,sí,met,,ada@example.com,,example.com/ada,Buen perfil,Rigor · Claridad,,,ada.pdf"
    );
  });
});
