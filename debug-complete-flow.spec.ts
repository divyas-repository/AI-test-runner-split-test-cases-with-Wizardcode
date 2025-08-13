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

test('Debug Complete Form Flow', async ({ page }) => {
  test.setTimeout(180000);
  await page.goto("https://nada-hei.onrender.com/");
  
  // Step 1: Contact form
  await page.getByRole('button', { name: /apply.*now/i }).first().click();
  await page.waitForURL('**/apply/contact', { timeout: 30000 });
  console.log('✅ Step 1: Contact page');
  
  const uniqueSuffix = Date.now().toString().slice(-4);
  await fillContactAndHomeshares(page, uniqueSuffix);
  await page.getByRole('button', { name: /next/i }).click();
  
  // Step 2: Property page  
  await page.waitForURL('**/apply/home-value', { timeout: 30000 });
  console.log('✅ Step 2: Property page');
  await page.getByPlaceholder('Enter home value').fill('500000');
  await page.getByPlaceholder('Enter mortgage balance').fill('200000');
  await page.locator('[role="combobox"]').click();
  await page.waitForTimeout(1000);
  await page.locator('[role="option"]').first().click();
  await page.getByRole('button', { name: /next/i }).click();
  
  // Step 3: Credit Score page
  await page.waitForURL('**/apply/credit-score', { timeout: 30000 });
  console.log('✅ Step 3: Credit Score page');
  await page.locator('input[name="creditScore"]').first().click();
  await page.getByRole('button', { name: /next/i }).click();
  await page.waitForTimeout(5000);
  
  console.log('🔍 Current URL after credit score:', page.url());
  
  // Debug next page
  const allInputs = await page.locator('input').all();
  console.log(`📝 Found ${allInputs.length} input elements on next page:`);
  
  for (let i = 0; i < allInputs.length; i++) {
    try {
      const placeholder = await allInputs[i].getAttribute('placeholder');
      const name = await allInputs[i].getAttribute('name');
      const type = await allInputs[i].getAttribute('type');
      
      console.log(`Input ${i + 1}:`, { placeholder, name, type });
    } catch (e) {
      console.log(`Input ${i + 1}: Could not get attributes`);
    }
  }
  
  // Look for income-related elements
  const incomeTexts = await page.locator('text=/income|salary|employment|annual|monthly/i').all();
  console.log(`📝 Found ${incomeTexts.length} income-related elements:`);
  
  for (let i = 0; i < Math.min(incomeTexts.length, 5); i++) {
    try {
      const text = await incomeTexts[i].textContent();
      console.log(`Income text ${i + 1}: "${text}"`);
    } catch (e) {
      console.log(`Income text ${i + 1}: Could not get text`);
    }
  }
});
