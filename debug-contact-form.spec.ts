import { test, expect } from '@playwright/test';

test('Debug Contact Form Elements', async ({ page }) => {
  test.setTimeout(120000);
  
  console.log('🚀 Starting contact form debug');
  
  // Navigate to homepage
  await page.goto('https://nada-hei.onrender.com/');
  console.log('✅ Navigated to application homepage');
  
  // Click Apply Now button
  await page.getByRole('button', { name: /apply.*now/i }).first().click();
  console.log('✅ Clicked Apply Now button');
  
  // Wait for contact page
  await page.waitForURL('**/apply/contact', { timeout: 30000 });
  console.log('✅ Contact page loaded');
  
  // Wait for form to load dynamically
  await page.waitForTimeout(5000);
  console.log('✅ Waited for dynamic content');
  
  // Try waiting for any form element
  try {
    await page.waitForSelector('input, form, [role="textbox"]', { timeout: 10000 });
    console.log('✅ Form elements detected');
  } catch (e) {
    console.log('❌ No form elements found after waiting');
  }
  
  // Debug: List all input elements
  const inputs = await page.locator('input').all();
  console.log(`Found ${inputs.length} input elements:`);
  
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    const type = await input.getAttribute('type') || 'text';
    const name = await input.getAttribute('name') || 'no-name';
    const placeholder = await input.getAttribute('placeholder') || 'no-placeholder';
    const id = await input.getAttribute('id') || 'no-id';
    
    console.log(`Input ${i + 1}: type="${type}", name="${name}", placeholder="${placeholder}", id="${id}"`);
  }
  
  // Debug: List all labels
  const labels = await page.locator('label').all();
  console.log(`\nFound ${labels.length} label elements:`);
  
  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];
    const text = await label.textContent();
    const forAttr = await label.getAttribute('for') || 'no-for';
    
    console.log(`Label ${i + 1}: text="${text}", for="${forAttr}"`);
  }
  
  // Debug: Check page content
  const pageContent = await page.content();
  console.log('\nPage title:', await page.title());
  console.log('Current URL:', page.url());
  console.log('Page contains "contact":', pageContent.toLowerCase().includes('contact'));
  console.log('Page contains "form":', pageContent.toLowerCase().includes('form'));
  console.log('Page contains "name":', pageContent.toLowerCase().includes('name'));
  
  // Check for any interactive elements
  const allElements = await page.locator('button, input, select, textarea, [contenteditable]').all();
  console.log(`\nFound ${allElements.length} interactive elements:`);
  
  for (let i = 0; i < Math.min(allElements.length, 10); i++) {
    const element = allElements[i];
    const tagName = await element.evaluate(el => el.tagName.toLowerCase());
    const text = await element.textContent() || '';
    const type = await element.getAttribute('type') || '';
    
    console.log(`Element ${i + 1}: <${tagName}> "${text.trim()}" type="${type}"`);
  }
  
  // Take a screenshot for visual reference
  await page.screenshot({ path: 'contact-form-debug.png', fullPage: true });
  console.log('✅ Screenshot saved as contact-form-debug.png');
});
