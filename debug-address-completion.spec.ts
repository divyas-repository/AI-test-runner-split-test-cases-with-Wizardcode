import { test, expect } from "@playwright/test";

test('Debug Full Flow with Proper Address Completion', async ({ page }) => {
  test.setTimeout(300000);
  await page.goto("https://nada-hei.onrender.com/");
  
  // Complete full flow
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
  
  // Property page
  await page.waitForURL('**/apply/home-value', { timeout: 30000 });
  await page.getByPlaceholder('Enter home value').fill('500000');
  await page.getByPlaceholder('Enter mortgage balance').fill('200000');
  await page.locator('[role="combobox"]').click();
  await page.waitForTimeout(1000);
  await page.locator('[role="option"]').first().click();
  await page.getByRole('button', { name: /next/i }).click();
  
  // Credit Score page
  await page.waitForURL('**/apply/credit-score', { timeout: 30000 });
  await page.locator('input[name="creditScore"]').first().click();
  await page.getByRole('button', { name: /next/i }).click();
  
  // Address page - try different completion strategies
  await page.waitForURL('**/apply/address', { timeout: 30000 });
  console.log('🏠 On address page');
  
  // Try filling address and looking for autocomplete
  await page.getByPlaceholder('Property Address').fill('123 Main Street, New York, NY 10001');
  await page.waitForTimeout(3000);
  
  // Look for suggestions or autocomplete options
  const suggestions = await page.locator('[role="option"], .suggestion, .autocomplete-item').all();
  console.log(`Found ${suggestions.length} address suggestions`);
  
  if (suggestions.length > 0) {
    await suggestions[0].click();
    console.log('✅ Selected address suggestion');
  }
  
  await page.waitForTimeout(2000);
  
  // Try to proceed
  const nextButtons = await page.locator('button:has-text("Next"), button:has-text("Continue"), button[type="submit"]').all();
  console.log(`Found ${nextButtons.length} potential next buttons`);
  
  for (let i = 0; i < nextButtons.length; i++) {
    try {
      const buttonText = await nextButtons[i].textContent();
      const isVisible = await nextButtons[i].isVisible();
      const isEnabled = await nextButtons[i].isEnabled();
      console.log(`Button ${i + 1}: "${buttonText}", visible: ${isVisible}, enabled: ${isEnabled}`);
      
      if (isVisible && isEnabled) {
        await nextButtons[i].click();
        await page.waitForTimeout(3000);
        console.log('🔍 Current URL after button click:', page.url());
        break;
      }
    } catch (e) {
      console.log(`Button ${i + 1}: Error - ${e.message}`);
    }
  }
  
  // Check final page
  const finalInputs = await page.locator('input').all();
  console.log(`📝 Final page has ${finalInputs.length} inputs`);
  
  for (let i = 0; i < Math.min(finalInputs.length, 5); i++) {
    try {
      const placeholder = await finalInputs[i].getAttribute('placeholder');
      const name = await finalInputs[i].getAttribute('name');
      console.log(`Final Input ${i + 1}:`, { placeholder, name });
    } catch (e) {
      console.log(`Final Input ${i + 1}: Error`);
    }
  }
});
