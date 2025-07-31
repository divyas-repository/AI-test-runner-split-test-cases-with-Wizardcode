import { test, expect } from '@playwright/test';

test('Login Functionality', async ({ page }) => {
  await page.goto('https://the-internet.herokuapp.com/login');
  await page.fill('input[name="username"]', 'tomsmith');
  await page.fill('input[name="password"]', 'SuperSecretPassword!');
  await page.click('button[type="submit"]');
  await expect(page.locator('#flash')).toContainText('You logged into a secure area!');
});

test('Verify the user is redirected to the Application progress page by clicking on Apply Now', async ({ page }) => {
  await page.goto('https://nada-hei.onrender.com/');
  await page.click('text=Apply Now');
  // Add further assertions here as needed, e.g.:
  // await expect(page).toHaveURL(/.*progress/);
});