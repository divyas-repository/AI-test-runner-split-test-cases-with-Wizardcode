import { test, expect } from "@playwright/test";

// Helper function for filling contact and homeshares information
async function fillContactAndHomeshares(page: any, uniqueSuffix: string) {
  const firstName = `John${uniqueSuffix}`;
  const lastName = `Smith${uniqueSuffix}`;
  const email = `john.smith${uniqueSuffix}@example.com`;
  const mobile = `555123${uniqueSuffix}`;
  
  console.log(`Filling contact form with: ${firstName} ${lastName}, ${email}, ${mobile}`);
  
  try {
    // Wait for form to load
    await page.waitForSelector('input[placeholder*="First Name"]', { timeout: 10000 });
    
    // Fill First Name
    await page.getByPlaceholder('Enter First Name').fill(firstName);
    console.log('✅ First name filled');
    
    // Fill Last Name  
    await page.getByPlaceholder('Enter Last Name').fill(lastName);
    console.log('✅ Last name filled');
    
    // Fill Email
    await page.getByPlaceholder('Enter email address').fill(email);
    console.log('✅ Email filled');
    
    // Fill Mobile
    await page.getByPlaceholder('Enter mobile number').fill(mobile);
    console.log('✅ Mobile filled');
    
    // Wait before interacting with radio buttons
    await page.waitForTimeout(1000);
    
    // Handle "Have you applied before?" - Click "No" 
    await page.locator('input[name="hasAppliedBefore"]').last().click();
    console.log('✅ Selected "No" for previous application');
    
  } catch (error) {
    console.error('❌ Error in fillContactAndHomeshares:', error);
    throw error;
  }
}

test('Debug Property Form Elements', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto("https://nada-hei.onrender.com/");
  
  // Navigate through contact form to property section
  await page.getByRole('button', { name: /apply.*now/i }).first().click();
  await page.waitForURL('**/apply/contact', { timeout: 30000 });
  
  const uniqueSuffix = Date.now().toString().slice(-4);
  await fillContactAndHomeshares(page, uniqueSuffix);
  await page.getByRole('button', { name: /next/i }).click();
  
  // Wait for next page to load
  await page.waitForTimeout(5000);
  
  console.log('🔍 Current URL:', page.url());
  
  // Debug: Get all form elements
  const allInputs = await page.locator('input').all();
  console.log(`📝 Found ${allInputs.length} input elements:`);
  
  for (let i = 0; i < allInputs.length; i++) {
    try {
      const placeholder = await allInputs[i].getAttribute('placeholder');
      const name = await allInputs[i].getAttribute('name');
      const type = await allInputs[i].getAttribute('type');
      const id = await allInputs[i].getAttribute('id');
      const className = await allInputs[i].getAttribute('class');
      
      console.log(`Input ${i + 1}:`, {
        placeholder,
        name,
        type,
        id,
        className: className?.slice(0, 50)
      });
    } catch (e) {
      console.log(`Input ${i + 1}: Could not get attributes`);
    }
  }
  
  // Debug: Get all select elements
  const allSelects = await page.locator('select').all();
  console.log(`📝 Found ${allSelects.length} select elements:`);
  
  for (let i = 0; i < allSelects.length; i++) {
    try {
      const name = await allSelects[i].getAttribute('name');
      const id = await allSelects[i].getAttribute('id');
      const className = await allSelects[i].getAttribute('class');
      
      console.log(`Select ${i + 1}:`, { name, id, className: className?.slice(0, 50) });
      
      // Get options
      const options = await allSelects[i].locator('option').all();
      console.log(`  Options: ${options.length}`);
      for (let j = 0; j < Math.min(options.length, 5); j++) {
        const optionText = await options[j].textContent();
        const optionValue = await options[j].getAttribute('value');
        console.log(`    Option ${j + 1}: "${optionText}" (value: ${optionValue})`);
      }
    } catch (e) {
      console.log(`Select ${i + 1}: Could not get attributes`);
    }
  }
  
  // Debug: Get all text containing "property"
  const propertyTexts = await page.locator('text=/property/i').all();
  console.log(`📝 Found ${propertyTexts.length} elements with "property" text:`);
  
  for (let i = 0; i < Math.min(propertyTexts.length, 5); i++) {
    try {
      const text = await propertyTexts[i].textContent();
      const tagName = await propertyTexts[i].evaluate(el => el.tagName);
      console.log(`Property text ${i + 1}: "${text}" (${tagName})`);
    } catch (e) {
      console.log(`Property text ${i + 1}: Could not get text`);
    }
  }
  
  // Debug: Take a screenshot to see the current state
  console.log('📸 Current page state logged - check console for form elements');
  
  // Try to find any dropdown or select elements
  const dropdowns = await page.locator('select, [role="combobox"], [role="listbox"]').all();
  console.log(`📝 Found ${dropdowns.length} dropdown-like elements`);
  
  for (let i = 0; i < dropdowns.length; i++) {
    try {
      const tagName = await dropdowns[i].evaluate(el => el.tagName);
      const role = await dropdowns[i].getAttribute('role');
      const ariaLabel = await dropdowns[i].getAttribute('aria-label');
      console.log(`Dropdown ${i + 1}: ${tagName}, role: ${role}, aria-label: ${ariaLabel}`);
    } catch (e) {
      console.log(`Dropdown ${i + 1}: Could not get attributes`);
    }
  }
});
