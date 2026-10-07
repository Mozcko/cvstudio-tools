import { test, expect } from '@playwright/test';

test.describe('Data Privacy E2E Tests', () => {
  test('Cookie consent banner workflow', async ({ page }) => {
    // 1. Navigate to the landing page
    await page.goto('/');

    // 2. Locate the banner (using the specific emoji/text for identification)
    const banner = page.locator('text=Respetamos tu privacidad');

    // 3. Verify it becomes visible (it has a 1000ms delay in code, so we wait)
    await expect(banner).toBeVisible({ timeout: 5000 });

    // 4. Locate and click the "Accept" button ("Entendido")
    const acceptButton = page.getByRole('button', { name: 'Entendido' });
    await acceptButton.click();

    // 5. Verify the banner is hidden
    await expect(banner).toBeHidden();

    // 6. Assert that localStorage has the correct consent key
    const consent = await page.evaluate(() => localStorage.getItem('cvstudio_consent'));
    expect(consent).toBe('true');
  });

  test('Cookie banner and privacy policy are translated', async ({ page }) => {
    await page.goto('/en/');
    await expect(page.getByText('We respect your privacy')).toBeVisible({ timeout: 5000 });
    await page.getByRole('link', { name: 'privacy policy' }).click();

    await expect(page).toHaveURL(/\/en\/privacy$/);
    await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible();
    await expect(page.getByText('automatic anonymisation')).toBeVisible();

    await page.goto('/pt/privacy');
    await expect(page.getByRole('heading', { name: 'Política de Privacidade' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Entendi', exact: true })).toBeVisible({
      timeout: 5000,
    });
  });

  test('Privacy policy page accessibility', async ({ page }) => {
    await page.goto('/privacy');

    // Verify the main header exists
    const header = page.getByRole('heading', { name: 'Política de Privacidad' });
    await expect(header).toBeVisible();

    // Verify critical sections are present
    await expect(page.getByText('anonimización automática')).toBeVisible();
    await expect(page.locator('text=Derecho al Olvido')).toBeVisible();
  });
});
