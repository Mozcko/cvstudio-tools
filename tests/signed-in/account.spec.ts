import { clerk, setupClerkTestingToken } from '@clerk/testing/playwright';
import { expect, test, type Page } from '@playwright/test';
import { expectSheetToContain, waitForEditor } from '../helpers';
import {
  API_URL,
  TEST_USER_EMAIL,
  backend,
  listCvs,
  openDashboard,
  resetAccount,
  seedCv,
} from './account';

// Backend answers are read loosely in tests
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Everything behind sign-in, against the real backend (started next to the site; see
 * docs/development.md). One shared test user on the free plan, so the tests run in order
 * and each one resets the account first. AI calls are answered by the test, never by OpenAI.
 */
test.describe.configure({ mode: 'serial' });

const cvIdFromUrl = (page: Page) => new URL(page.url()).searchParams.get('id') || '';

/** Polls the backend until the stored CV satisfies `check`. */
const expectStored = (page: Page, id: string, check: (cv: any) => unknown) =>
  expect
    .poll(async () => check((await backend(page, `/cvs/${id}`)).data), { timeout: 20_000 })
    .toBeTruthy();

test.beforeEach(async ({ page }) => {
  await setupClerkTestingToken({ page });
  await openDashboard(page);
  await resetAccount(page);
});

test.describe('Dashboard', () => {
  test('a new account sees the empty state and creates its first CV', async ({ page }) => {
    await page.reload();
    await expect(page.getByTestId('dashboard-empty')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('heading', { name: 'Aún no tienes currículums' })).toBeVisible();

    await page.getByTestId('create-first-cv').click();

    await page.waitForURL(/\/app\/editor\?id=/, { timeout: 30_000 });
    await waitForEditor(page);
    await expectSheetToContain(page, 'Tu Nombre');
    const stored = await listCvs(page);
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe(cvIdFromUrl(page));

    // Back on the dashboard the CV is listed and the empty state is gone
    await openDashboard(page);
    await expect(page.getByRole('heading', { name: 'Nuevo Currículum' })).toBeVisible();
    await expect(page.getByTestId('dashboard-empty')).toHaveCount(0);
  });

  test('deleting the last CV brings the empty state back', async ({ page }) => {
    await seedCv(page, 'Para borrar');
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Para borrar' })).toBeVisible({
      timeout: 30_000,
    });

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByTitle('Eliminar').click();

    await expect(page.getByTestId('dashboard-empty')).toBeVisible();
    expect(await listCvs(page)).toEqual([]);
  });

  test('the free plan stops at three CVs, on the page and on the server', async ({ page }) => {
    for (const title of ['Uno', 'Dos', 'Tres']) await seedCv(page, title);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Tres' })).toBeVisible({ timeout: 30_000 });

    const refused = await backend(page, '/cvs/', {
      method: 'POST',
      body: { title: 'Cuatro', content: { personal: {} }, language: 'ES' },
    });
    expect(refused.status).toBe(403);

    let alert = '';
    page.once('dialog', async (dialog) => {
      alert = dialog.message();
      await dialog.accept();
    });
    await page.getByRole('button', { name: 'Crear Nuevo' }).click();

    await page.waitForURL(/\/pricing$/, { timeout: 30_000 });
    expect(alert).toContain('límite de CVs del plan gratuito');
    expect(await listCvs(page)).toHaveLength(3);
  });

  test('importing a file creates a CV and opens it', async ({ page }) => {
    await page.reload();
    await expect(page.getByTestId('dashboard-empty')).toBeVisible({ timeout: 30_000 });
    const resume = {
      basics: { name: 'Ada Lovelace', label: 'Mathematician', email: 'ada@example.com' },
      work: [{ name: 'Analytical Engines Ltd', position: 'Lead Analyst', startDate: '2019-03' }],
    };

    await page.getByTestId('import-open').click();
    await page.getByTestId('import-input').setInputFiles({
      name: 'resume.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(resume)),
    });

    await page.waitForURL(/\/app\/editor\?id=/, { timeout: 30_000 });
    await waitForEditor(page);
    await expectSheetToContain(page, 'Ada Lovelace');
    await expectSheetToContain(page, 'Analytical Engines Ltd');
    const stored = await listCvs(page);
    expect(stored.map((cv) => cv.title)).toEqual(['Ada Lovelace']);
    expect(stored[0].content.experience[0].company).toBe('Analytical Engines Ltd');
  });
});

test.describe('Editor', () => {
  test('edits are autosaved to the cloud and survive a reload without the local draft', async ({
    page,
  }) => {
    const id = await seedCv(page, 'Autoguardado');
    await page.goto(`/app/editor?id=${id}`);
    await waitForEditor(page);
    await expectSheetToContain(page, 'Seeded Person');

    await page.locator('input[value="Seeded Person"]').first().fill('Grace Hopper');
    await expectSheetToContain(page, 'Grace Hopper');
    // No click on Save: autosave does it
    await expectStored(page, id, (cv) => cv.content?.personal?.name === 'Grace Hopper');

    await page.locator('#resume-title').fill('Título nuevo');
    await page.getByTitle('Cambiar Tema').click();
    await page.getByRole('button', { name: 'Minimal' }).click();
    await expectStored(page, id, (cv) => cv.title === 'Título nuevo' && cv.theme === 'minimal');

    // Without the browser's own copy, what comes back is what the server has
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await waitForEditor(page);
    await expectSheetToContain(page, 'Grace Hopper');
    await expect(page.locator('#resume-title')).toHaveValue('Título nuevo');
    await expect
      .poll(() =>
        page.evaluate(
          () => getComputedStyle(document.querySelector('.cv-preview-content')!).fontFamily
        )
      )
      .toContain('Courier');
  });

  test('saving a new CV creates it and puts its id in the address', async ({ page }) => {
    await page.goto('/app/editor');
    await waitForEditor(page);
    await page.locator('input[value="John Doe"]').first().fill('Nueva Persona');
    await expectSheetToContain(page, 'Nueva Persona');

    await page.keyboard.press('Control+s');

    await expect.poll(() => cvIdFromUrl(page), { timeout: 20_000 }).not.toBe('');
    const stored = await listCvs(page);
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe(cvIdFromUrl(page));
    expect(stored[0].content.personal.name).toBe('Nueva Persona');
    // The sign-in prompt is for guests only
    await expect(page.getByRole('heading', { name: 'Inicia sesión para continuar' })).toHaveCount(
      0
    );
  });

  test('a CV that does not exist falls back to a new draft', async ({ page }) => {
    await page.goto('/app/editor?id=00000000-0000-0000-0000-000000000000');
    await waitForEditor(page);

    await expect(page.getByText('CV no encontrado')).toBeVisible();
    expect(cvIdFromUrl(page)).toBe('');
  });
});

test.describe('AI on the free plan', () => {
  test('the server keeps Pro tools locked and refunds a failed free run', async ({ page }) => {
    const cv = { personal: { name: 'X' }, experience: [] };
    const before = (await backend(page, '/users/me')).data.usage.free_ai.remaining;

    const translate = await backend(page, '/ai/rewrite', {
      method: 'POST',
      body: { cv_content: cv, action: 'translate', target_language: 'en' },
    });
    const ats = await backend(page, '/ai/ats', {
      method: 'POST',
      body: { cv_content: cv, job_description: 'x' },
    });
    const interview = await backend(page, '/interviews', {
      method: 'POST',
      body: { cv_content: cv, job_description: 'A job posting long enough.', language: 'es' },
    });
    expect([translate.status, ats.status, interview.status]).toEqual([403, 403, 403]);

    // CI has no AI provider: an allowed run fails, and must not use up the weekly allowance
    const enhance = await backend(page, '/ai/rewrite', {
      method: 'POST',
      body: { cv_content: cv, action: 'enhance', target_language: 'es' },
    });
    expect([502, 503]).toContain(enhance.status);
    expect((await backend(page, '/users/me')).data.usage.free_ai.remaining).toBe(before);
  });

  test('Enhance works a few times a week and counts down; Translate asks to upgrade', async ({
    page,
  }) => {
    const id = await seedCv(page, 'IA gratis');
    const remaining = (await backend(page, '/users/me')).data.usage.free_ai.remaining;
    test.skip(remaining < 1, 'The test user has no free AI runs left this week');

    // The AI answers come from here, not from OpenAI
    await page.route(`${API_URL}/ai/rewrite`, async (route) => {
      const sent = route.request().postDataJSON();
      const cv = structuredClone(sent.cv_content);
      cv.personal.summary = 'Resumen mejorado por la prueba.';
      await route.fulfill({ json: { cv, free_remaining: remaining - 1 } });
    });

    await page.goto(`/app/editor?id=${id}`);
    await waitForEditor(page);
    await page.getByRole('button', { name: /Herramientas IA/ }).click();
    await expect(page.getByTestId('free-ai-badge').first()).toHaveText(`${remaining} gratis`);

    await page.getByRole('button', { name: /Mejorar Redacción/ }).click();
    await page.getByRole('button', { name: 'Actualizar Actual' }).click();
    await expectSheetToContain(page, 'Resumen mejorado por la prueba.');

    await page.getByRole('button', { name: /Herramientas IA/ }).click();
    if (remaining - 1 > 0) {
      await expect(page.getByTestId('free-ai-badge').first()).toHaveText(`${remaining - 1} gratis`);
    } else {
      await expect(page.getByTestId('free-ai-badge')).toHaveCount(0);
    }

    await page.getByRole('button', { name: /Traducir/ }).click();
    await expect(page.getByRole('heading', { name: 'Función Pro' })).toBeVisible();
  });
});

test.describe('Mock interview', () => {
  test('plans without it see the upgrade screen', async ({ page }) => {
    await page.goto('/app/interview');
    await expect(page.getByTestId('interview-upsell')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('link', { name: 'Ver planes' })).toHaveAttribute(
      'href',
      '/pricing'
    );
  });

  test('a premium user runs a typed interview through to the report', async ({ page }) => {
    await seedCv(page, 'CV para entrevista');
    const turn = (index: number, role: string, kind: string, question: number, text: string) => ({
      index,
      role,
      kind,
      question,
      text,
      at: new Date().toISOString(),
    });
    const session = {
      id: '11111111-1111-1111-1111-111111111111',
      title: 'Ingeniera Python',
      language: 'es',
      status: 'active',
      question_count: 4,
      overall_score: null,
      created_at: new Date().toISOString(),
      completed_at: null,
      current_question: 0,
      done: false,
      questions: ['¿Puedes presentarte?'],
      turns: [
        turn(0, 'recruiter', 'question', 0, 'Hola, gracias por tu tiempo. ¿Puedes presentarte?'),
      ],
      report: null,
    };
    const answer = turn(
      1,
      'candidate',
      'answer',
      0,
      'Soy ingeniera con cinco años de experiencia.'
    );
    const closing = turn(2, 'recruiter', 'closing', 0, 'Gracias. Eso es todo por mi parte.');
    let started: any = null;

    // The plan and the whole interview API are played by the test (CI has no AI provider)
    await page.route(`${API_URL}/users/me**`, async (route) => {
      const real = await (await route.fetch()).json();
      await route.fulfill({ json: { ...real, is_pro: true, is_premium: true, plan: 'active' } });
    });
    await page.route(`${API_URL}/interviews**`, async (route) => {
      const url = new URL(route.request().url());
      const method = route.request().method();
      if (url.pathname.endsWith('/interviews') && method === 'GET')
        return route.fulfill({ json: [] });
      if (url.pathname.endsWith('/interviews') && method === 'POST') {
        started = route.request().postDataJSON();
        return route.fulfill({ status: 201, json: session });
      }
      if (url.pathname.endsWith('/answer')) {
        return route.fulfill({
          json: { answer, reply: closing, current_question: 4, done: true },
        });
      }
      if (url.pathname.endsWith('/audio'))
        return route.fulfill({ status: 404, json: { detail: 'x' } });
      if (url.pathname.endsWith('/finish')) {
        return route.fulfill({
          json: {
            ...session,
            status: 'completed',
            done: true,
            current_question: 4,
            overall_score: 82,
            turns: [...session.turns, answer, closing],
            report: {
              overall_score: 82,
              summary: 'Respuestas claras y concretas.',
              strengths: ['Claridad'],
              improvements: ['Más cifras'],
              tips: ['Practica el cierre'],
              answers: [
                {
                  question: 0,
                  score: 8,
                  went_well: 'Directa.',
                  improve: 'Añade un logro.',
                  sample_answer: 'Soy Ada, ingeniera con cinco años de experiencia.',
                },
              ],
            },
          },
        });
      }
      return route.fulfill({ status: 404, json: { detail: 'unexpected request' } });
    });

    await page.goto('/app/interview');
    await page
      .getByLabel('Descripción de la oferta')
      .fill('Ingeniera Python para un equipo de pagos. Django, PostgreSQL y guardias.');
    await page.getByTestId('interview-start').click();

    await expect(page.getByTestId('interview-room')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('¿Puedes presentarte?')).toBeVisible();
    expect(started).toMatchObject({ language: 'es', question_count: 6 });
    expect(started.cv_content.personal.name).toBe('Seeded Person');

    // No audio came back, so it is the candidate's turn; answer by typing
    await page.getByRole('button', { name: 'Escribir la respuesta' }).click();
    await page.getByTestId('interview-text').fill('Soy ingeniera con cinco años de experiencia.');
    await page.getByRole('button', { name: 'Enviar', exact: true }).click();

    await expect(page.getByTestId('interview-report')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('82', { exact: true })).toBeVisible();
    await expect(page.getByText('Respuestas claras y concretas.')).toBeVisible();
    await expect(page.getByText('8/10')).toBeVisible();
  });
});

test.describe('Public links', () => {
  /** Removes whatever link the test user still has, so the free limit starts clean. */
  const clearLinks = async (page: Page) => {
    for (const link of (await backend(page, '/links')).data) {
      await backend(page, `/cvs/${link.cv_id}/link`, { method: 'DELETE' });
    }
  };
  /** What follows /u/ for a link the backend returned: "<name>-<key>". */
  const addressOf = (link: { slug: string; key: string }) => `${link.slug}-${link.key}`;
  const publish = async (page: Page, cvId: string, slug: string) => {
    const saved = await backend(page, `/cvs/${cvId}/link`, { method: 'PUT', body: { slug } });
    expect(saved.status, JSON.stringify(saved.data)).toBe(200);
    return saved.data as { slug: string; key: string };
  };

  test('publish from the dashboard, read it signed out, see the view counted, switch it off', async ({
    page,
    browser,
  }) => {
    await clearLinks(page);
    await seedCv(page, 'CV público');
    await page.reload();

    await page.getByTestId('share-open').click();
    await expect(page.getByTestId('share-modal')).toBeVisible();
    // Suggested from the person's name. A very common name is fine: the key makes it unique
    await expect(page.getByLabel('Nombre del enlace')).toHaveValue('seeded-person');
    await page.getByLabel('Nombre del enlace').fill('juan-perez');
    await page.getByTestId('share-save').click();
    await expect(page.getByTestId('share-url')).toContainText(/\/u\/juan-perez-[a-z0-9]{8}$/);
    const address = addressOf((await backend(page, '/links')).data[0]);

    // Someone else, with no session, opens the link
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const visitor = await context.newPage();
    const response = await visitor.goto(`/u/${address}`);
    expect(response?.status()).toBe(200);
    const sheet = visitor.getByTestId('public-cv');
    await expect(sheet.getByRole('heading', { name: 'Seeded Person' })).toBeVisible();
    await expect(sheet).toContainText('Seeded summary.');
    // E-mail shown, and the page tells search engines to stay away by default
    await expect(sheet).toContainText('seed@example.com');
    await expect(visitor.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect(visitor.locator('html')).toHaveAttribute('lang', 'es');
    // Free plan: the badge is there
    await expect(visitor.getByTestId('public-cv-badge')).toBeVisible();
    // The theme's stylesheet arrived with the page
    await expect
      .poll(() =>
        visitor.evaluate(
          () => getComputedStyle(document.querySelector('.cv-preview-content h1')!).textAlign
        )
      )
      .toBe('center');

    // The visit is counted a moment later, once
    await expect
      .poll(async () => (await backend(page, '/links')).data[0]?.views_total, { timeout: 20_000 })
      .toBe(1);
    await visitor.reload();
    await visitor.waitForTimeout(3500);
    expect((await backend(page, '/links')).data[0].views_total).toBe(1);

    // The owner sees it on the dashboard
    await openDashboard(page);
    await expect(page.getByTestId('link-status')).toContainText('1 visitas');
    await expect(page.getByTestId('new-views')).toHaveText('+1 nuevas');

    // Switched off: the page is gone for everyone
    await page.getByTestId('share-open').click();
    await page.getByLabel('Enlace público activo').uncheck();
    await page.getByTestId('share-save').click();
    await expect(page.getByTestId('share-message')).toContainText('Enlace guardado');
    await expect
      .poll(async () => (await visitor.goto(`/u/${address}?${Date.now()}`))?.status(), {
        timeout: 90_000,
      })
      .toBe(404);
    await context.close();
  });

  test('renaming keeps old addresses working: they lead to the current one', async ({
    page,
    request,
  }) => {
    await clearLinks(page);
    const id = await seedCv(page, 'Renombrado');
    const first = await publish(page, id, 'nombre-viejo');
    const renamed = await publish(page, id, 'nombre-nuevo');
    expect(renamed.key).toBe(first.key);
    const current = `/u/nombre-nuevo-${first.key}`;

    for (const old of [
      `/u/nombre-viejo-${first.key}`,
      `/u/${first.key}`,
      `/u/NOMBRE-NUEVO-${first.key.toUpperCase()}`,
    ]) {
      const response = await request.get(old, { maxRedirects: 0 });
      expect(response.status(), old).toBe(301);
      expect(response.headers()['location'], old).toBe(current);
    }
    expect((await request.get(current, { maxRedirects: 0 })).status()).toBe(200);
    // The preview flag survives the redirect, so the owner's preview is still not counted
    const preview = await request.get(`/u/nombre-viejo-${first.key}?preview=1`, {
      maxRedirects: 0,
    });
    expect(preview.headers()['location']).toBe(`${current}?preview=1`);
  });

  test('the same name can be used again: each link has its own address', async ({
    page,
    request,
  }) => {
    await clearLinks(page);
    const id = await seedCv(page, 'Mismo nombre');
    const before = await publish(page, id, 'juan-perez');
    await backend(page, `/cvs/${id}/link`, { method: 'DELETE' });
    const after = await publish(page, id, 'juan-perez');

    expect(after.slug).toBe(before.slug);
    expect(after.key).not.toBe(before.key);
    expect((await request.get(`/u/${addressOf(before)}`, { maxRedirects: 0 })).status()).toBe(404);
    expect((await request.get(`/u/${addressOf(after)}`, { maxRedirects: 0 })).status()).toBe(200);
  });

  test('the owner looking at their own page is not a view, and the phone stays private', async ({
    page,
  }) => {
    await clearLinks(page);
    const created = await backend(page, '/cvs/', {
      method: 'POST',
      body: {
        title: 'Con teléfono',
        language: 'EN',
        theme: 'minimal',
        content: {
          personal: { name: 'Phone Owner', email: 'owner@example.com', phone: '+52 55 1234 5678' },
          experience: [],
        },
      },
    });
    const address = addressOf(await publish(page, created.data.id, 'e2e-telefono'));
    // The dashboard is where the browser learns which links are the user's own
    await openDashboard(page);
    await expect(page.getByTestId('link-status')).toBeVisible();

    await page.goto(`/u/${address}`);
    const sheet = page.getByTestId('public-cv');
    await expect(sheet.getByRole('heading', { name: 'Phone Owner' })).toBeVisible();
    await expect(sheet).not.toContainText('1234 5678');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await page.waitForTimeout(3500);

    expect((await backend(page, '/links')).data[0].views_total).toBe(0);
  });

  test('a published CV cannot run or load anything in the visitor browser', async ({
    page,
    browser,
  }) => {
    await clearLinks(page);
    const hostile = {
      personal: {
        name: 'Mallory<script>window.__pwned = true</script>',
        role: 'Dev<img src=x onerror="window.__pwned = true">',
        email: '',
        phone: '',
        city: '',
        summary:
          'Visible text <iframe src="https://example.com"></iframe>' +
          '<a href="javascript:window.__pwned=true">click me</a>' +
          '<div style="position:fixed;inset:0" onclick="window.__pwned = true">overlay</div>',
        socials: [
          { id: '1', network: 'Site', username: 'x', url: 'javascript:window.__pwned=true' },
        ],
      },
      experience: [],
      education: [],
      skills: [],
      certifications: [],
      languages: '',
      interests: '',
    };
    const created = await backend(page, '/cvs/', {
      method: 'POST',
      body: { title: 'Hostil', content: hostile, language: 'ES' },
    });
    const address = addressOf(await publish(page, created.data.id, 'e2e-hostil'));

    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const visitor = await context.newPage();
    await visitor.goto(`/u/${address}`);
    const sheet = visitor.getByTestId('public-cv');

    await expect(sheet).toContainText('Mallory');
    await expect(sheet).toContainText('Visible text');
    await expect(sheet.locator('script, img, iframe, form, [style], [onclick]')).toHaveCount(0);
    await expect(sheet.locator('a[href^="javascript"]')).toHaveCount(0);
    await sheet.getByText('overlay').click();
    await sheet.getByText('click me').click();
    expect(await visitor.evaluate(() => (window as { __pwned?: boolean }).__pwned)).toBeUndefined();
    await context.close();
  });

  test('the free plan shares one CV; addresses that cannot exist are plain 404s', async ({
    page,
    request,
  }) => {
    await clearLinks(page);
    const first = await seedCv(page, 'Primero');
    await seedCv(page, 'Segundo');
    const one = await publish(page, first, 'e2e-uno');
    await page.reload();

    // "Segundo" is the newest CV, so its share button comes first
    await page.getByTestId('share-open').first().click();
    await page.getByLabel('Nombre del enlace').fill('e2e-dos');
    await page.getByTestId('share-save').click();
    await expect(page.getByTestId('share-message')).toContainText(
      'El plan gratuito incluye un enlace público'
    );
    expect((await backend(page, '/links')).data).toHaveLength(1);

    for (const path of [
      '/u/juan-perez', // a name without a key
      '/u/juan-perez-aaaaaaaa', // a key nobody has
      '/u/aaaaaaaa',
      '/u/x',
      '/u/UPPER_case!',
      `/en/u/${addressOf(one)}`,
    ]) {
      expect((await request.get(path, { maxRedirects: 0 })).status(), path).toBe(404);
    }
  });
});

test.describe('Signing in with work in progress', () => {
  test('what a guest wrote becomes a CV in their account', async ({ page, browser }) => {
    // A second browser with no session: the visitor before they sign in. The empty storage
    // state is explicit because new contexts inherit this project's signed-in one.
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const guest = await context.newPage();
    await setupClerkTestingToken({ page: guest });
    await guest.goto('/app/editor');
    await waitForEditor(guest);
    await expect(guest.getByTestId('guest-banner')).toBeVisible({ timeout: 30_000 });
    await guest.locator('input[value="John Doe"]').first().fill('Invitada Promovida');
    await expect
      .poll(() => guest.evaluate(() => localStorage.getItem('cv-draft:new') || ''))
      .toContain('Invitada Promovida');

    await clerk.signIn({ page: guest, emailAddress: TEST_USER_EMAIL });
    await guest.goto('/app/dashboard');

    await expect
      .poll(async () => (await listCvs(page)).map((cv) => cv.content?.personal?.name), {
        timeout: 30_000,
      })
      .toEqual(['Invitada Promovida']);
    // The local draft was handed over, so it is not uploaded a second time
    await guest.reload();
    await expect(guest.getByRole('heading', { name: 'Mis CVs' })).toBeVisible({ timeout: 30_000 });
    expect(await listCvs(page)).toHaveLength(1);
    await context.close();
  });
});
