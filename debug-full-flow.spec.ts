import { test, expect } from "@playwright/test";

test('Debug Full Application Flow', async ({ page }) => {
  test.setTimeout(300000);
  await page.goto("https://nada-hei.onrender.com/");
  
  // Complete full flow to find all pages
  await page.getByRole('button', { name: /apply.*now/i }).first().click();
  await page.waitForURL('**/apply/contact', { timeout: 30000 });
  
  // Contact page
  const uniqueSuffix = Date.now().toString().slice(-4);
  await page.getByPlaceholder('Enter First Name').fill(`John${uniqueSuffix}`);
  await page.getByPlaceholder('Enter Last Name').fill(`Smith${uniqueSuffix}`);
  await page.getByPlaceholder('Enter email address').fill(`john.smith${uniqueSuffix}@example.com`);
  await page.getByPlaceholder('Enter mobile number').fill(`555123${uniqueSuffix}`);
  await page.locator('input[name="hasAppliedBefore"]').last().click();
  await page.getByRole('button', { name: /next/i }).click();
  console.log('✅ Completed Contact page');
  
  // Property page
  await page.waitForURL('**/apply/home-value', { timeout: 30000 });
  await page.getByPlaceholder('Enter home value').fill('500000');
  await page.getByPlaceholder('Enter mortgage balance').fill('200000');
  await page.locator('[role="combobox"]').click();
  await page.waitForTimeout(1000);
  await page.locator('[role="option"]').first().click();
  await page.getByRole('button', { name: /next/i }).click();
  console.log('✅ Completed Property page');
  
  // Credit Score page
  await page.waitForURL('**/apply/credit-score', { timeout: 30000 });
  await page.locator('input[name="creditScore"]').first().click();
  await page.getByRole('button', { name: /next/i }).click();
  console.log('✅ Completed Credit Score page');
  
  // Address page
  await page.waitForURL('**/apply/address', { timeout: 30000 });
  await page.getByPlaceholder('Property Address').fill('123 Main Street, Anytown, NY 12345');
  await page.getByRole('button', { name: /next/i }).click();
  await page.waitForTimeout(5000);
  console.log('✅ Completed Address page');
  console.log('🔍 Current URL after address:', page.url());
  
  // Check what's on the next page
  const pageTitle = await page.title();
  console.log('📄 Page title:', pageTitle);
  
  const allInputs = await page.locator('input').all();
  console.log(`📝 Found ${allInputs.length} input elements:`);
  
  for (let i = 0; i < Math.min(allInputs.length, 10); i++) {
    try {
      const placeholder = await allInputs[i].getAttribute('placeholder');
      const name = await allInputs[i].getAttribute('name');
      const type = await allInputs[i].getAttribute('type');
      
      console.log(`Input ${i + 1}:`, { placeholder, name, type });
    } catch (e) {
      console.log(`Input ${i + 1}: Error getting attributes`);
    }
  }
  
  // Look for headings and sections
  const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
  console.log(`📝 Found ${headings.length} headings:`);
  
  for (let i = 0; i < Math.min(headings.length, 10); i++) {
    try {
      const text = await headings[i].textContent();
      const tagName = await headings[i].evaluate(el => el.tagName);
      console.log(`${tagName}: "${text}"`);
    } catch (e) {
      console.log(`Heading ${i + 1}: Error getting text`);
    }
  }
});
