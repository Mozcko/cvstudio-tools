import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { clerk, clerkSetup } from '@clerk/testing/playwright';
import { expect, test as setup } from '@playwright/test';
import { AUTH_FILE, TEST_USER_EMAIL, backend } from './account';

/**
 * Signs the test user in once and stores the session for the signed-in tests.
 * Needs a Clerk DEVELOPMENT instance: PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY and the
 * e-mail address of an existing user in E2E_USER_EMAIL.
 */
setup('sign in as the test user', async ({ page }) => {
  await clerkSetup({ publishableKey: process.env.PUBLIC_CLERK_PUBLISHABLE_KEY });

  // Any public page that loads Clerk
  await page.goto('/app/editor');
  await clerk.signIn({ page, emailAddress: TEST_USER_EMAIL });

  // The server recognises the session...
  await page.goto('/app/dashboard');
  await expect(page).toHaveURL(/\/app\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'Mis CVs' })).toBeVisible({ timeout: 30_000 });

  // ...and so does the backend, which verifies the token on its own
  const profile = await backend(page, '/users/me');
  expect(profile.status, JSON.stringify(profile.data)).toBe(200);
  expect(profile.data.plan).toBe('free');

  mkdirSync(dirname(AUTH_FILE), { recursive: true });
  await page.context().storageState({ path: AUTH_FILE });
});
