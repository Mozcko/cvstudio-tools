import { defineConfig } from 'vitest/config';

// Unit tests for utilities and hooks (hook tests opt into jsdom with a file-level comment). End-to-end specs live in tests/ and run with Playwright.
export default defineConfig({
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'node',
  },
});
