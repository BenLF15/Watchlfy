import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.TEST_PORT || 3199);
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 45_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 2,
  reporter: [['list']],
  globalSetup: './tests/e2e/global-setup.js',
  use: { baseURL: `http://127.0.0.1:${port}`, locale: 'de-DE', timezoneId: 'Europe/Berlin', trace: 'off' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 860 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'node tests/start-test-server.js',
    url: `http://127.0.0.1:${port}/healthz`,
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
