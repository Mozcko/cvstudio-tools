import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { clerk, clerkSetup } from '@clerk/testing/playwright';
import { expect, test as setup, type APIRequestContext } from '@playwright/test';
import { AUTH_FILE, TEST_USER_EMAIL, backend } from './account';

/**
 * Signs the test user in once and stores the session for the signed-in tests.
 * Needs a Clerk DEVELOPMENT instance: PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY and the
 * test user's e-mail address in E2E_USER_EMAIL (the user is created if it does not exist).
 */
const CLERK_API = 'https://api.clerk.com/v1';

/**
 * Makes sure the test user exists in the Clerk development instance, creating it when it
 * does not (a fresh instance, or one whose users were cleared). Never touches production.
 */
async function ensureTestUser(request: APIRequestContext): Promise<void> {
  const secretKey = process.env.CLERK_SECRET_KEY || '';
  if (!secretKey.startsWith('sk_test_')) {
    throw new Error('The signed-in tests only run against a Clerk development instance');
  }
  const headers = { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' };

  const found = await request.get(`${CLERK_API}/users`, {
    headers,
    params: { email_address: TEST_USER_EMAIL },
  });
  expect(found.status(), 'looking up the test user in Clerk').toBe(200);
  if ((await found.json()).length > 0) return;

  const created = await request.post(`${CLERK_API}/users`, {
    headers,
    data: {
      email_address: [TEST_USER_EMAIL],
      // Sign-in in tests goes through a one-time ticket, so the password is never typed
      password: process.env.E2E_USER_PASSWORD || `E2e-${randomUUID()}`,
      skip_password_checks: true,
    },
  });
  expect(created.status(), `creating the test user: ${await created.text()}`).toBe(200);
}

setup('sign in as the test user', async ({ page, request }) => {
  await clerkSetup({ publishableKey: process.env.PUBLIC_CLERK_PUBLISHABLE_KEY });
  await ensureTestUser(request);

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
