import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './',
  testMatch: ['**/*test*.ts', '**/*spec*.ts', '**/test-case-*.ts'],
  timeout: 60 * 1000,
  expect: {
    timeout: 10 * 1000
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'https://nada-hei.onrender.com',
    trace: 'on-first-retry',
    screenshot: 'off',
    headless: false // Run in headed mode by default
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
