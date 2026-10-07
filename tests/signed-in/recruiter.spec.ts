import { setupClerkTestingToken } from '@clerk/testing/playwright';
import { expect, test, type Page, type Route } from '@playwright/test';
import { API_URL } from './account';

// The fake backend below is read loosely
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * The recruiter area, signed in. The recruiter endpoints are answered by a small fake kept in
 * the test (no AI and no Stripe are involved), so what is checked here is the browser side:
 * reading files, sending only their text, the ranking, and the plan gates.
 */
const TRIAL_CVS = 3;

const cv = (name: string, body: string) => ({
  name,
  mimeType: 'text/plain',
  buffer: Buffer.from(`${body}\n${'Experience building and running backend services. '.repeat(4)}`),
});

async function fakeRecruiterBackend(page: Page) {
  const state = { used: 0, screening: null as any, sent: [] as any[] };

  const status = () => ({
    plan: 'trial',
    status: 'trial',
    can_evaluate: state.used < TRIAL_CVS,
    used: state.used,
    limit: TRIAL_CVS,
    remaining: TRIAL_CVS - state.used,
    period_end: null,
    retention_days: 90,
    reason: state.used < TRIAL_CVS ? null : 'trial used',
    has_billing: false,
  });
  const ranked = () => {
    const ranking = [...state.screening.ranking]
      .sort((a: any, b: any) => b.score - a.score)
      .map((item: any, index: number) => ({ ...item, rank: index + 1, top: index < 5 }));
    return {
      ...state.screening,
      ranking,
      candidates: ranking.length,
      top_score: ranking[0]?.score ?? null,
      rubric_locked: ranking.length > 0,
    };
  };

  await page.route(`${API_URL}/recruiter/**`, async (route: Route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace(/^.*\/recruiter/, '');
    const method = request.method();

    if (path === '/me') return route.fulfill({ json: status() });
    if (path === '/screenings' && method === 'GET') {
      return route.fulfill({ json: state.screening ? [ranked()] : [] });
    }
    if (path === '/screenings' && method === 'POST') {
      const body = request.postDataJSON();
      state.screening = {
        id: 'scr-1',
        title: body.title,
        language: body.language,
        job_description: body.job_description,
        created_at: '2026-10-01T00:00:00Z',
        expires_at: '2026-12-30T00:00:00Z',
        rubric: [
          { id: 'r1', text: 'Python en producción', kind: 'must' },
          { id: 'r2', text: 'Docker', kind: 'nice' },
        ],
        ranking: [],
      };
      return route.fulfill({ status: 201, json: ranked() });
    }
    if (path === '/screenings/scr-1' && method === 'GET') return route.fulfill({ json: ranked() });
    if (path === '/screenings/scr-1' && method === 'DELETE') {
      state.screening = null;
      return route.fulfill({ status: 204 });
    }
    if (path === '/screenings/scr-1/candidates' && method === 'POST') {
      if (state.used >= TRIAL_CVS) {
        return route.fulfill({ status: 403, json: { detail: 'trial used' } });
      }
      const body = request.postDataJSON();
      state.sent.push(body);
      state.used += 1;
      // The first line of each test CV is "<name> <score>"
      const [, name, score] = /^(.+) (\d+)\n/.exec(body.text) || [];
      const candidate = {
        id: `cand-${state.used}`,
        display_name: name,
        file_name: body.file_name,
        contact: { emails: [`${body.file_name}@example.com`] },
        score: Number(score),
        missing_musts: 0,
        flagged: body.file_name === 'tramposo.txt',
        result: {
          requirements: [
            {
              id: 'r1',
              text: 'Python en producción',
              kind: 'must',
              status: 'met',
              evidence: 'Experience building and running backend services.',
              verified: true,
            },
          ],
          strengths: ['Experiencia sólida'],
          concerns: [],
          summary: `Resumen de ${name}`,
        },
        note: '',
        created_at: `2026-10-01T00:00:0${state.used}Z`,
      };
      state.screening.ranking.push(candidate);
      const answer = ranked().ranking.find((item: any) => item.id === candidate.id);
      return route.fulfill({ status: 201, json: { candidate: answer, duplicate: false } });
    }
    const one = /^\/screenings\/scr-1\/candidates\/(cand-\d+)$/.exec(path);
    if (one && method === 'DELETE') {
      state.screening.ranking = state.screening.ranking.filter((item: any) => item.id !== one[1]);
      return route.fulfill({ status: 204 });
    }
    return route.fulfill({ status: 404, json: { detail: 'not faked' } });
  });

  return state;
}

test.beforeEach(async ({ page }) => {
  await setupClerkTestingToken({ page });
});

test.describe('Recruiter area', () => {
  test('the dashboard leads to the recruiter area', async ({ page }) => {
    await fakeRecruiterBackend(page);
    await page.goto('/app/dashboard');
    await page.getByTestId('recruiter-link').click({ timeout: 30_000 });

    await expect(page).toHaveURL(/\/app\/recruiter$/);
    await expect(page.getByTestId('recruiter-home')).toBeVisible({ timeout: 30_000 });
  });

  test('trial: create a screening, rank three CVs, then hit the plan gate', async ({ page }) => {
    const state = await fakeRecruiterBackend(page);
    await page.goto('/app/recruiter');

    await expect(page.getByTestId('recruiter-usage')).toContainText(
      `0 de ${TRIAL_CVS} CVs de la prueba gratuita`,
      { timeout: 30_000 }
    );
    await expect(page.getByTestId('no-screenings')).toBeVisible();

    // A new screening opens on its criteria
    await page.getByLabel('Puesto').fill('Ingeniera backend');
    await page
      .getByLabel('Descripción de la oferta')
      .fill('Buscamos una ingeniera backend con Python en producción, Docker y bases de datos.');
    await page.getByRole('button', { name: 'Crear y generar criterios' }).click();
    await page.waitForURL(/\/app\/recruiter\?id=scr-1$/);
    await expect(page.getByRole('heading', { name: 'Ingeniera backend' })).toBeVisible();
    await expect(page.locator('input[value="Python en producción"]')).toBeVisible();
    await expect(page.getByTestId('empty-ranking')).toBeVisible();

    // Three CVs at once, one of them in a format we cannot read
    await page
      .getByTestId('cv-files')
      .setInputFiles([
        cv('media.txt', 'Marta Media 60'),
        cv('tramposo.txt', 'Tomás Tramposo 95'),
        { name: 'foto.png', mimeType: 'image/png', buffer: Buffer.from('not a cv') },
        cv('buena.txt', 'Berta Buena 80'),
      ]);

    await expect(page.getByText('4 de 4 procesados')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('uploads')).toContainText('Formato no compatible');
    const rows = page.getByTestId('candidate');
    await expect(rows).toHaveCount(3);
    await expect(rows.nth(0)).toContainText('Tomás Tramposo');
    await expect(rows.nth(0)).toContainText('Revisar a mano');
    await expect(rows.nth(1)).toContainText('Berta Buena');
    await expect(rows.nth(2)).toContainText('Marta Media');

    // Only the text of each file left the browser
    expect(state.sent).toHaveLength(3);
    expect(Object.keys(state.sent[0]).sort()).toEqual(['file_name', 'text']);
    expect(state.sent.map((item) => item.file_name).sort()).toEqual([
      'buena.txt',
      'media.txt',
      'tramposo.txt',
    ]);

    // The detail shows the evidence; criteria are now fixed
    await rows.nth(1).getByRole('button', { name: 'Ver detalle' }).click();
    const detail = page.getByTestId('candidate-detail');
    await expect(detail).toContainText('Resumen de Berta Buena');
    await expect(detail).toContainText('Experience building and running backend services.');
    await expect(detail).toContainText('buena.txt@example.com');
    await expect(page.getByText('Los criterios quedaron fijos')).toBeVisible();

    // The trial is used up: no more uploads here...
    await expect(page.getByTestId('recruiter-blocked')).toBeVisible();
    await expect(page.getByTestId('cv-dropzone')).toHaveCount(0);

    // ...deleting a candidate works and the order follows
    page.once('dialog', (dialog) => dialog.accept());
    await detail.getByRole('button', { name: 'Eliminar candidato' }).click();
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(1)).toContainText('Marta Media');

    // ...and the home shows the plans instead of the form
    await page.getByRole('link', { name: /Todas las selecciones/ }).click();
    await expect(page.getByTestId('recruiter-plans')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('new-screening')).toHaveCount(0);
    await expect(page.getByTestId('screening-row')).toContainText('2 candidatos');
    await expect(page.getByTestId('recruiter-plan-pro')).toContainText('1,000 CVs al mes');

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByTestId('screening-row').getByRole('button', { name: 'Eliminar' }).click();
    await expect(page.getByTestId('no-screenings')).toBeVisible();
  });
});
