import { expect, test, type Page } from '@playwright/test';
import { strToU8, zipSync } from 'fflate';
import { locales } from '../src/i18n/locales';
import { expectSheetToContain, openGuestEditor } from './helpers';

const t = locales.es.import;

const JSON_RESUME = JSON.stringify({
  basics: {
    name: 'Ada Lovelace',
    label: 'Mathematician',
    email: 'ada@example.com',
    summary: 'First programmer.',
  },
  work: [
    {
      name: 'Analytical Engines Ltd',
      position: 'Lead Analyst',
      startDate: '2019-03',
      highlights: ['Published the first algorithm'],
    },
  ],
  education: [{ institution: 'University of London', area: 'Mathematics', endDate: '2018' }],
  skills: [{ name: 'Languages', keywords: ['Notes', 'Diagrams'] }],
});

const upload = async (page: Page, name: string, content: string | Buffer, mimeType: string) => {
  await page.getByTestId('import-open').click();
  await page.getByTestId('import-input').setInputFiles({
    name,
    mimeType,
    buffer: typeof content === 'string' ? Buffer.from(content) : content,
  });
};

/** A real PDF, printed by the browser from the given HTML. */
const makePdf = async (page: Page, html: string): Promise<Buffer> => {
  const tab = await page.context().newPage();
  await tab.setContent(html);
  const pdf = await tab.pdf({ format: 'A4' });
  await tab.close();
  return pdf;
};

/** Importing without an account: everything that does not need the AI. */
test.describe('CV import (guest)', () => {
  test('a JSON Resume file fills the editor, and undo brings the previous CV back', async ({
    page,
  }) => {
    await openGuestEditor(page);
    await expectSheetToContain(page, 'John Doe');

    await upload(page, 'resume.json', JSON_RESUME, 'application/json');

    await expectSheetToContain(page, 'Ada Lovelace');
    await expectSheetToContain(page, 'Analytical Engines Ltd');
    await expectSheetToContain(page, 'Published the first algorithm');
    await expectSheetToContain(page, 'University of London');
    await expect(page.getByTestId('import-input')).toHaveCount(0);
    await expect(page.locator('input[value="Ada Lovelace"]').first()).toBeVisible();

    await page.keyboard.press('Control+z');
    await expectSheetToContain(page, 'John Doe');
  });

  test('the same resume as YAML and as TOML', async ({ page }) => {
    const yaml = `basics:\n  name: Yaml Person\nwork:\n  - name: Yaml Corp\n    position: Engineer\n    startDate: 2020-01\n`;
    const toml = `[basics]\nname = "Toml Person"\n\n[[work]]\nname = "Toml Corp"\nposition = "Engineer"\nstartDate = "2020-01"\n`;

    await openGuestEditor(page);
    await upload(page, 'resume.yaml', yaml, 'application/yaml');
    await expectSheetToContain(page, 'Yaml Person');
    await expectSheetToContain(page, 'Yaml Corp');

    await upload(page, 'resume.toml', toml, 'application/toml');
    await expectSheetToContain(page, 'Toml Person');
    await expectSheetToContain(page, 'Toml Corp');
  });

  test('a LinkedIn data export is read in the browser', async ({ page }) => {
    const zip = zipSync({
      'Profile.csv': strToU8(
        'First Name,Last Name,Headline,Summary\nKatherine,Johnson,Research Mathematician,Orbital mechanics.'
      ),
      'Positions.csv': strToU8(
        'Company Name,Title,Description,Location,Started On,Finished On\nNASA,Mathematician,Trajectories,Hampton,Jun 2015,'
      ),
      'Skills.csv': strToU8('Name\nGeometry\nFortran'),
    });
    let apiCalls = 0;
    await page.route('**/ai/import', (route) => {
      apiCalls++;
      return route.abort();
    });

    await openGuestEditor(page);
    await upload(page, 'Basic_LinkedInDataExport.zip', Buffer.from(zip), 'application/zip');

    await expectSheetToContain(page, 'Katherine Johnson');
    await expectSheetToContain(page, 'NASA');
    await expectSheetToContain(page, 'jun 2015');
    await expectSheetToContain(page, 'Geometry, Fortran');
    expect(apiCalls).toBe(0);
  });

  test('a PDF is read locally, then a guest is asked to sign in', async ({ page }) => {
    await openGuestEditor(page);
    const pdf = await makePdf(
      page,
      '<h1>Grace Hopper</h1><p>Rear Admiral, US Navy. Built the first compiler and helped design COBOL.</p>' +
        '<h2>Experience</h2><p>US Navy — Programmer — 1943 to 1986</p>'
    );
    let apiCalls = 0;
    await page.route('**/ai/import', (route) => {
      apiCalls++;
      return route.abort();
    });

    await upload(page, 'cv.pdf', pdf, 'application/pdf');

    // Getting this far means the text layer was extracted in the browser
    await expect(page.getByTestId('import-error')).toContainText(t.errors.needsAuth);
    await expect(
      page.getByTestId('import-error').getByRole('link', { name: locales.es.messages.signIn })
    ).toHaveAttribute('href', '/sign-in');
    expect(apiCalls).toBe(0);
    // Nothing was changed
    await expectSheetToContain(page, 'John Doe');
  });

  test('a PDF without text is explained, not sent anywhere', async ({ page }) => {
    await openGuestEditor(page);
    const scan = await makePdf(
      page,
      '<div style="width:300px;height:400px;background:#ccc"></div>'
    );

    await upload(page, 'scan.pdf', scan, 'application/pdf');

    await expect(page.getByTestId('import-error')).toContainText(t.errors.noText);
  });

  test('unreadable and unsupported files are rejected with a reason', async ({ page }) => {
    await openGuestEditor(page);

    await upload(page, 'cv.docx', 'not really a document', 'application/octet-stream');
    await expect(page.getByTestId('import-error')).toContainText(t.errors.unsupported);

    await page.getByTestId('import-input').setInputFiles({
      name: 'broken.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{"basics": '),
    });
    await expect(page.getByTestId('import-error')).toContainText(t.errors.unreadable);

    await page.getByTestId('import-input').setInputFiles({
      name: 'photos.zip',
      mimeType: 'application/zip',
      buffer: Buffer.from(zipSync({ 'readme.txt': strToU8('hello') })),
    });
    await expect(page.getByTestId('import-error')).toContainText(t.errors.notLinkedin);
    await expectSheetToContain(page, 'John Doe');
  });

  test('an imported file cannot inject markup into the page', async ({ page }) => {
    const hostile = JSON.stringify({
      basics: {
        name: 'Mallory<img src=x onerror="window.__pwned = true">',
        summary: '<script>window.__pwned = true</script>Summary text',
        profiles: [{ network: 'Site', url: 'javascript:window.__pwned=true' }],
      },
      work: [{ name: 'Evil Corp', highlights: ['<iframe src="javascript:window.__pwned=true">'] }],
    });

    await openGuestEditor(page);
    await upload(page, 'resume.json', hostile, 'application/json');

    await expectSheetToContain(page, 'Mallory');
    await expectSheetToContain(page, 'Summary text');
    const sheet = page.locator('.cv-preview-content');
    await expect(sheet.locator('img, script, iframe')).toHaveCount(0);
    await expect(sheet.locator('a[href^="javascript"]')).toHaveCount(0);
    expect(await page.evaluate(() => (window as { __pwned?: boolean }).__pwned)).toBeUndefined();
  });
});
