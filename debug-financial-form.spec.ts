import { test, expect } from "@playwright/test";

// Helper function for filling contact and homeshares information
async function fillContactAndHomeshares(page: any, uniqueSuffix: string) {
  const firstName = `John${uniqueSuffix}`;
  const lastName = `Smith${uniqueSuffix}`;
  const email = `john.smith${uniqueSuffix}@example.com`;
  const mobile = `555123${uniqueSuffix}`;
  
  try {
    await page.waitForSelector('input[placeholder*="First Name"]', { timeout: 10000 });
    await page.getByPlaceholder('Enter First Name').fill(firstName);
    await page.getByPlaceholder('Enter Last Name').fill(lastName);
    await page.getByPlaceholder('Enter email address').fill(email);
    await page.getByPlaceholder('Enter mobile number').fill(mobile);
    await page.waitForTimeout(1000);
    await page.locator('input[name="hasAppliedBefore"]').last().click();
  } catch (error) {
    console.error('❌ Error in fillContactAndHomeshares:', error);
    throw error;
  }
}

test('Debug Next Form After Property', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto("https://nada-hei.onrender.com/");
  
  // Navigate through contact form
  await page.getByRole('button', { name: /apply.*now/i }).first().click();
  await page.waitForURL('**/apply/contact', { timeout: 30000 });
  
  const uniqueSuffix = Date.now().toString().slice(-4);
  await fillContactAndHomeshares(page, uniqueSuffix);
  await page.getByRole('button', { name: /next/i }).click();
  
  // Fill property page
  await page.waitForURL('**/apply/home-value', { timeout: 30000 });
  await page.getByPlaceholder('Enter home value').fill('500000');
  await page.getByPlaceholder('Enter mortgage balance').fill('200000');
  
  // Select property type
  await page.locator('[role="combobox"]').click();
  await page.waitForTimeout(1000);
  await page.locator('[role="option"]').first().click();
  
  // Click next to go to financial page
  await page.getByRole('button', { name: /next/i }).click();
  await page.waitForTimeout(5000);
  
  console.log('🔍 Current URL after property page:', page.url());
  
  // Debug: Get all form elements on financial page
  const allInputs = await page.locator('input').all();
  console.log(`📝 Found ${allInputs.length} input elements on financial page:`);
  
  for (let i = 0; i < allInputs.length; i++) {
    try {
      const placeholder = await allInputs[i].getAttribute('placeholder');
      const name = await allInputs[i].getAttribute('name');
      const type = await allInputs[i].getAttribute('type');
      const id = await allInputs[i].getAttribute('id');
      
      console.log(`Input ${i + 1}:`, { placeholder, name, type, id });
    } catch (e) {
      console.log(`Input ${i + 1}: Could not get attributes`);
    }
  }
  
  // Debug: Get all select elements
  const allSelects = await page.locator('select').all();
  console.log(`📝 Found ${allSelects.length} select elements:`);
  
  // Debug: Get all text containing "income" or "financial"
  const financialTexts = await page.locator('text=/income|financial|salary|employment/i').all();
  console.log(`📝 Found ${financialTexts.length} elements with financial keywords:`);
  
  for (let i = 0; i < Math.min(financialTexts.length, 10); i++) {
    try {
      const text = await financialTexts[i].textContent();
      const tagName = await financialTexts[i].evaluate(el => el.tagName);
      console.log(`Financial text ${i + 1}: "${text}" (${tagName})`);
    } catch (e) {
      console.log(`Financial text ${i + 1}: Could not get text`);
    }
  }
});
