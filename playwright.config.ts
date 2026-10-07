import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests run against the production build (`pnpm build` first).
 *
 * The app cannot render without Clerk, so the build needs real keys from a Clerk
 * DEVELOPMENT instance:
 *   PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY
 * The signed-in tests also need E2E_USER_EMAIL (an existing user of that instance) and the
 * backend listening at PUBLIC_API_URL.
 * See docs/development.md > End-to-end tests.
 */
const PORT = Number(process.env.E2E_PORT || 4399);
const baseURL = `http://127.0.0.1:${PORT}`;

const chrome = { ...devices['Desktop Chrome'], viewport: { width: 1400, height: 900 } };

export default defineConfig({
  testDir: './tests',
  // The suites share one browser storage model (localStorage drafts); keep files isolated
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL,
    locale: 'es-MX',
    viewport: { width: 1400, height: 900 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      // Everything a signed-out visitor can do
      name: 'chromium',
      testIgnore: /signed-in\//,
      use: chrome,
    },
    // Flows behind sign-in: they need a test user (E2E_USER_EMAIL) and the backend running.
    // Without the variable they are left out, so the guest suite still runs anywhere.
    ...(process.env.E2E_USER_EMAIL
      ? [
          { name: 'sign-in', testMatch: /signed-in\/auth\.setup\.ts/, use: chrome },
          {
            name: 'signed-in',
            testMatch: /signed-in\/.*\.spec\.ts/,
            dependencies: ['sign-in'],
            use: { ...chrome, storageState: 'playwright/.auth/user.json' },
          },
        ]
      : []),
  ],
  webServer: {
    command: 'node dist/server/entry.mjs',
    url: baseURL,
    env: { HOST: '127.0.0.1', PORT: String(PORT) },
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
