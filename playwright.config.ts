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
  
  // Enhanced HTML reporting configuration
  reporter: [
    ['html', { 
      open: 'never', // Don't auto-open, we'll handle this via our script
      outputFolder: 'playwright-report',
      host: 'localhost',
      port: 9323
    }],
    ['line'] // Also show line output during execution
  ],
  
  use: {
    baseURL: 'https://nada-hei.onrender.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure', // Capture screenshots on failures for reports
    video: 'retain-on-failure', // Capture videos on failures for reports
    headless: false // Run in headed mode by default
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
