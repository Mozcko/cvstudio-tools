import { expect, test } from '@playwright/test';

/** Pages and redirects that must work for a signed-out visitor. */
test.describe('Public pages and routing', () => {
  test('landing page renders in Spanish by default', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1').first()).toContainText('Tu currículum profesional');
    await expect(page.locator('#pricing')).toBeAttached({ timeout: 30_000 });
  });

  test('landing page is served in English and Portuguese under their prefixes', async ({
    page,
  }) => {
    await page.goto('/en/');
    await expect(page.locator('h1').first()).not.toContainText('Tu currículum');
    await page.goto('/pt/');
    await expect(page.locator('h1').first()).not.toContainText('Tu currículum');
  });

  test('/login redirects to sign-in', async ({ request }) => {
    const response = await request.get('/login', { maxRedirects: 0 });
    expect(response.status()).toBe(302);
    expect(response.headers()['location']).toContain('/sign-in');
  });

  test('the dashboard sends signed-out visitors to sign in', async ({ request }) => {
    const response = await request.get('/app/dashboard', { maxRedirects: 0 });
    expect([302, 307]).toContain(response.status());
    expect(response.headers()['location']).toContain('sign-in');
  });

  test('the locale redirect keeps the query string', async ({ request }) => {
    const response = await request.get('/app/editor?id=abc-123', {
      maxRedirects: 0,
      headers: { 'Accept-Language': 'en-US,en;q=0.9' },
    });
    expect(response.status()).toBe(302);
    expect(response.headers()['location']).toMatch(/\/en\/app\/editor\?id=abc-123$/);
  });

  test('/privacy is public in every locale and follows the browser language', async ({
    request,
  }) => {
    for (const path of ['/privacy', '/en/privacy', '/pt/privacy']) {
      expect((await request.get(path, { maxRedirects: 0 })).status(), path).toBe(200);
    }
    const redirected = await request.get('/privacy', {
      maxRedirects: 0,
      headers: { 'Accept-Language': 'en-US,en;q=0.9' },
    });
    expect(redirected.status()).toBe(302);
    expect(redirected.headers()['location']).toMatch(/\/en\/privacy$/);
  });

  test('/login has no localized twin and is not locale-redirected', async ({ request }) => {
    const response = await request.get('/login', {
      maxRedirects: 0,
      headers: { 'Accept-Language': 'en-US,en;q=0.9' },
    });
    expect(response.headers()['location']).not.toContain('/en/login');
  });

  test('the document language matches the route', async ({ page }) => {
    for (const [path, lang] of [
      ['/', 'es'],
      ['/en/', 'en'],
      ['/pt/', 'pt'],
      ['/en/app/editor', 'en'],
    ]) {
      await page.goto(path);
      await expect(page.locator('html'), path).toHaveAttribute('lang', lang);
    }
  });

  test('unknown pages get the 404 page in the visitor language', async ({ page, request }) => {
    const response = await page.goto('/no-existe/para-nada');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'Oops, página no encontrada' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Volver al Inicio' })).toHaveAttribute('href', '/');

    const english = await page.goto('/en/not-a-page');
    expect(english?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'Oops, page not found' })).toBeVisible();
    await page.getByRole('link', { name: 'Back to Home' }).click();
    await expect(page).toHaveURL(/\/en\/?$/);

    // Signed-out visitors are not bounced to sign-in for pages that do not exist
    for (const path of ['/nope', '/pt/nope', '/fr', '/fr/pricing', '/fr/sign-in']) {
      const answer = await request.get(path, { maxRedirects: 0 });
      expect(answer.status(), path).toBe(404);
    }
  });

  test('the app area stays private, also behind a mistyped locale', async ({ request }) => {
    for (const path of [
      '/app',
      '/app/settings',
      '/app/interview',
      '/en/app/interview',
      '/pt/app/interview',
      '/en/app/dashboard',
      '/fr/app/dashboard',
      '/fr/app/editor',
    ]) {
      const answer = await request.get(path, { maxRedirects: 0 });
      expect([302, 307], path).toContain(answer.status());
      expect(answer.headers()['location'], path).toContain('sign-in');
    }
  });

  test('the editor is reachable without an account in every locale', async ({ request }) => {
    for (const path of ['/app/editor', '/en/app/editor', '/pt/app/editor']) {
      expect((await request.get(path, { maxRedirects: 0 })).status(), path).toBe(200);
    }
  });
});
