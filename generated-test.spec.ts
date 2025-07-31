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

test('Verify user can fill out the application form and click Next', async ({ page }) => {
  await page.goto('https://nada-hei.onrender.com/');
  await page.click('text=Apply Now');
  await page.getByPlaceholder('Enter First Name').fill('John'); // Valid
  await page.getByPlaceholder('Enter Last Name').fill('Smith'); // Valid
  await page.getByPlaceholder('Enter email address').fill('john.doe@example.com'); // Valid
  await page.getByPlaceholder('Enter mobile number').fill('1234567890'); // Valid
  await page.click('text=Next');
  // Add further assertions here as needed, e.g.:
  // await expect(page).toHaveURL(/.*next-step/);
});