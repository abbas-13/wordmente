import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests.
 *
 * These exist for what the unit suite cannot see: jsdom has no layout engine, so
 * nothing in it can tell whether the keyboard fits on screen, and it cannot run a
 * native <dialog> at all. Chromium can do both.
 */
const HOST = '127.0.0.1';
const PORT = 4173;
const baseURL = `http://${HOST}:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // Building first keeps `npm run test:e2e` self-contained. The host is pinned
    // because `localhost` can resolve to IPv6 while the check below uses IPv4.
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort --host ${HOST}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
