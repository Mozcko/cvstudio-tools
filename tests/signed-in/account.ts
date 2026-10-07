import { expect, type Page } from '@playwright/test';
import { clerk } from '@clerk/testing/playwright';

/** Where the signed-in session is kept between the setup step and the tests. */
export const AUTH_FILE = 'playwright/.auth/user.json';

export const API_URL = process.env.PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

export const TEST_USER_EMAIL = process.env.E2E_USER_EMAIL || '';

/** A session token for calling the backend directly, as the signed-in test user. */
export async function sessionToken(page: Page): Promise<string> {
  await clerk.loaded({ page });
  const token = await page.evaluate(() => window.Clerk.session?.getToken());
  if (!token) throw new Error('The test user is not signed in');
  return token;
}

// Backend answers are read loosely in tests
/* eslint-disable @typescript-eslint/no-explicit-any */

/** Calls the backend as the test user. `path` starts with a slash, e.g. `/cvs/`. */
export async function backend(
  page: Page,
  path: string,
  init: { method?: string; body?: unknown } = {}
): Promise<{ status: number; data: any }> {
  const response = await page.request.fetch(`${API_URL}${path}`, {
    method: init.method || 'GET',
    headers: {
      Authorization: `Bearer ${await sessionToken(page)}`,
      'Content-Type': 'application/json',
    },
    data: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const text = await response.text();
  const parse = () => {
    try {
      return text ? JSON.parse(text) : null;
    } catch {
      return text;
    }
  };
  return { status: response.status(), data: parse() };
}

export const listCvs = async (page: Page): Promise<any[]> => (await backend(page, '/cvs/')).data;

/**
 * Empties the test account (the page must be on the app, signed in). Tests share one user,
 * so each starts from a known state instead of trusting the one before it.
 */
export async function resetAccount(page: Page): Promise<void> {
  for (const cv of await listCvs(page)) {
    await backend(page, `/cvs/${cv.id}`, { method: 'DELETE' });
  }
  expect(await listCvs(page)).toEqual([]);
  // Drafts and flags of the previous test live in the browser
  await page.evaluate(() => localStorage.clear());
}

const SAMPLE = {
  personal: {
    name: 'Seeded Person',
    role: 'Engineer',
    email: 'seed@example.com',
    phone: '',
    city: '',
    summary: 'Seeded summary.',
    socials: [],
  },
  experience: [],
  education: [],
  skills: [],
  certifications: [],
  languages: '',
  interests: '',
};

/** Creates a CV through the API and returns its id. */
export async function seedCv(page: Page, title: string): Promise<string> {
  const created = await backend(page, '/cvs/', {
    method: 'POST',
    body: { title, content: SAMPLE, language: 'ES', theme: 'hardvard' },
  });
  expect(created.status, JSON.stringify(created.data)).toBe(201);
  return created.data.id;
}

/** Opens the dashboard and waits until the list (or the empty state) has loaded. */
export async function openDashboard(page: Page): Promise<void> {
  await page.goto('/app/dashboard');
  await expect(page.getByRole('heading', { name: 'Mis CVs' })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('Cargando...')).toHaveCount(0, { timeout: 30_000 });
}
