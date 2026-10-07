import { expect, type Page } from '@playwright/test';

/** Text of the rendered CV sheet. (textContent, not innerText: themes may upper-case headings.) */
export const sheetText = (page: Page) =>
  page.evaluate(() => document.querySelector('.cv-preview-content')?.textContent || '');

export const expectSheetToContain = (page: Page, text: string) =>
  expect.poll(() => sheetText(page), { timeout: 10_000 }).toContain(text);

/** Opens the editor as a guest with empty storage and waits until the form is interactive. */
export async function openGuestEditor(page: Page, path = '/app/editor') {
  await page.goto(path);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await waitForEditor(page);
}

/**
 * The sheet renders before Clerk has reported the visitor as signed out. Actions that depend
 * on that (save, download, AI imports) do nothing until the guest banner is up.
 */
export async function waitForGuestState(page: Page) {
  await expect(page.getByTestId('guest-banner')).toBeVisible({ timeout: 30_000 });
}

/** The React islands only hydrate once Clerk has initialised, which can take a few seconds. */
export async function waitForEditor(page: Page) {
  await expect(page.locator('.cv-preview-content')).toBeAttached({ timeout: 30_000 });
}

/** Unexpected browser errors. Clerk noise about the test origin is not our concern. */
export function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/clerk|status of 4\d\d/i.test(m.text())) {
      errors.push(`console: ${m.text()}`);
    }
  });
  return errors;
}
