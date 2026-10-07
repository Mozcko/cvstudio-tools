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

  test('/privacy has no localized twin and is not redirected', async ({ request }) => {
    const response = await request.get('/privacy', {
      maxRedirects: 0,
      headers: { 'Accept-Language': 'en-US,en;q=0.9' },
    });
    expect(response.status()).toBe(200);
  });

  test('the editor is reachable without an account in every locale', async ({ request }) => {
    for (const path of ['/app/editor', '/en/app/editor', '/pt/app/editor']) {
      expect((await request.get(path, { maxRedirects: 0 })).status(), path).toBe(200);
    }
  });
});
