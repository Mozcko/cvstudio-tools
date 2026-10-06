import { defineConfig } from 'vitest/config';

// Unit tests for pure utilities only. End-to-end specs live in tests/ and run with Playwright.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
