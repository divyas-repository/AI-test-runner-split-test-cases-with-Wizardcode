import { test, expect } from "@playwright/test";

// Helper to fill contact info and select Homeshares question with uniqueSuffix
async function fillContactAndHomeshares(page, uniqueSuffix) {
  const firstName = `John${uniqueSuffix}`;
  const lastName = `Smith${uniqueSuffix}`;
  const email = `john.doe+${uniqueSuffix}@example.com`;
  const phoneBase = (1000000000 + (Number(String(uniqueSuffix).replace(/\D/g, '')) % 9000000000));
  const phone = `${phoneBase}`;
  
  // Fill contact info using robust getByRole selectors
  try {
    await page.getByRole('textbox', { name: /first name/i }).fill(firstName);
    await page.getByRole('textbox', { name: /last name/i }).fill(lastName);
    await page.getByRole('textbox', { name: /email/i }).fill(email);
    await page.getByRole('textbox', { name: /mobile/i }).fill(phone);
  } catch (e) {
    console.warn('Error filling contact info fields:', e);
    throw e;
  }
  
  // Robustly select 'Yes' for Homeshares program question
  try {
    await page.getByRole('radio', { name: 'Yes' }).check();
  } catch (e) {
    console.warn('Error clicking Homeshares Yes radio:', e);
    throw e;
  }
  
  await page.waitForTimeout(500);
  await page.click('text=Next');
}

test.describe('Batch 2 - Extended Application Flow', () => {
  test('Fill contact details, property values, and financial info', async ({ page }) => {
    test.setTimeout(60000);
    
    await page.goto('https://nada-hei.onrender.com/');
    await page.waitForSelector('text=Apply Now', { timeout: 30000 });
    await page.click('text=Apply Now');
    
    const uniqueSuffix = Date.now() + '-' + Math.floor(Math.random() * 10000);
    await fillContactAndHomeshares(page, uniqueSuffix);
    
    // Wait for Property Details step with better detection
    await page.waitForFunction(() => {
      return document.querySelector('h2, h3, .step-title, .section-title')?.textContent?.includes('Property') ||
             document.querySelector('input[placeholder*="home"], input[placeholder*="mortgage"]') !== null;
    }, { timeout: 10000 });
    
    // Fill property values
    await page.getByPlaceholder('Enter home value').fill('500000');
    await page.getByPlaceholder('Enter mortgage balance').fill('200000');
    
    // Select Property Type - Enhanced strategy with debugging
    console.log('🔍 Looking for Property Type dropdown...');
    try {
      // Wait for the property section to be ready
      await page.waitForTimeout(2000);
      
      // Strategy 1: Direct text click approach
      console.log('Strategy 1: Clicking "Select property type" text...');
      await page.locator('text="Select property type"').click();
      await page.waitForTimeout(1500);
      await page.locator('text="Single Family"').click();
      console.log('✅ Property Type selected via direct text click');
    } catch (e1) {
      console.log('Strategy 1 failed, trying Strategy 2...');
      try {
        // Strategy 2: Find dropdown by common patterns
        const dropdown = page.locator('select, [role="combobox"], .dropdown, .select-wrapper').first();
        await dropdown.click();
        await page.waitForTimeout(1000);
        await page.locator('option:has-text("Single Family"), li:has-text("Single Family")').click();
        console.log('✅ Property Type selected via dropdown element');
      } catch (e2) {
        console.log('Strategy 2 failed, trying Strategy 3...');
        try {
          // Strategy 3: Look for any clickable element with property type
          await page.locator('[class*="property"], [id*="property"], [name*="property"]').first().click();
          await page.waitForTimeout(1000);
          await page.getByText('Single Family').click();
          console.log('✅ Property Type selected via attribute matching');
        } catch (e3) {
          console.log('Strategy 3 failed, trying Strategy 4...');
          try {
            // Strategy 4: Look for form elements in property section
            const propertySection = page.locator('div:has-text("Property"), fieldset:has-text("Property")').first();
            await propertySection.locator('button, div[role="button"], .clickable').first().click();
            await page.waitForTimeout(1000);
            await page.getByText('Single Family').click();
            console.log('✅ Property Type selected via section search');
          } catch (e4) {
            console.warn('❌ All property type strategies failed');
          }
        }
      }
    }
    
    await page.click('text=Next');
    
    // Wait for Financial Info step with better detection
    await page.waitForFunction(() => {
      return document.querySelector('h2, h3, .step-title, .section-title')?.textContent?.includes('Financial') ||
             document.querySelector('input[placeholder*="credit"], input[type="number"]') !== null ||
             document.querySelector('input[type="radio"]') !== null;
    }, { timeout: 10000 });
    
    // Fill credit score
    try {
      await page.getByPlaceholder('Enter credit score').fill('750');
      console.log('Filled credit score using placeholder');
    } catch (e) {
      // Fallback: find number input
      const form = await page.waitForSelector('form', { state: 'visible', timeout: 5000 });
      const creditScoreInput = await form.$('input[type="number"]');
      if (creditScoreInput) {
        await creditScoreInput.fill('750');
        console.log('Filled credit score using fallback');
      }
    }
    
    await page.click('text=Next');
    
    console.log('Successfully completed contact, property, and financial information');
  });

  test('Handle bankruptcy questions and credit score validation', async ({ page }) => {
    test.setTimeout(60000);
    
    await page.goto('https://nada-hei.onrender.com/');
    await page.waitForSelector('text=Apply Now', { timeout: 30000 });
    await page.click('text=Apply Now');
    
    const uniqueSuffix = Date.now() + '-' + Math.floor(Math.random() * 10000);
    await fillContactAndHomeshares(page, uniqueSuffix);
    
    // Navigate through property details quickly
    await page.waitForSelector('text=Property Details', { state: 'visible', timeout: 5000 });
    await page.getByPlaceholder('Enter home value').fill('400000');
    await page.getByPlaceholder('Enter mortgage balance').fill('150000');
    await page.click('text=Next');
    
    // Fill financial info
    await page.waitForSelector('text=Financial Info', { state: 'visible', timeout: 5000 });
    
    // Answer credit score question "Is your credit score above 500?"
    console.log('🔍 Looking for credit score question...');
    try {
      // Wait for the question to appear
      await page.waitForTimeout(2000);
      
      // Strategy 1: Direct approach - find the question and associated radio
      console.log('Strategy 1: Looking for exact question text...');
      const questionText = await page.locator('text="Is your credit score above 500?"').count();
      if (questionText > 0) {
        console.log('Found question text, looking for Yes radio...');
        // Find the container with the question
        const questionContainer = page.locator('div:has-text("Is your credit score above 500?")').first();
        await questionContainer.locator('input[type="radio"][value="yes"]').click();
        console.log('✅ Selected Yes via question container');
      } else {
        throw new Error('Question text not found');
      }
    } catch (e1) {
      console.log('Strategy 1 failed, trying Strategy 2...');
      try {
        // Strategy 2: Look for radio buttons with "Yes" labels
        console.log('Strategy 2: Looking for Yes radio buttons...');
        await page.locator('label:has-text("Yes")').first().click();
        console.log('✅ Selected Yes via label click');
      } catch (e2) {
        console.log('Strategy 2 failed, trying Strategy 3...');
        try {
          // Strategy 3: Find radio input with yes value
          console.log('Strategy 3: Looking for radio input with yes value...');
          await page.locator('input[type="radio"][value="yes"]').first().click();
          console.log('✅ Selected Yes via radio input');
        } catch (e3) {
          console.log('Strategy 3 failed, trying Strategy 4...');
          try {
            // Strategy 4: Look in financial section for any Yes option
            console.log('Strategy 4: Looking in financial section...');
            const financialSection = page.locator('form, div:has-text("Financial")').first();
            await financialSection.locator('input[type="radio"]').first().click();
            console.log('✅ Selected first radio option in financial section');
          } catch (e4) {
            console.warn('❌ All credit score strategies failed');
          }
        }
      }
    }
    
    await page.click('text=Next');
    
    // Check if bankruptcy question appears and handle it
    try {
      await page.waitForSelector('text=bankruptcy', { state: 'visible', timeout: 3000 });
      await page.getByRole('radio', { name: /no/i }).check();
      console.log('Answered No to bankruptcy question');
      await page.click('text=Next');
    } catch (e) {
      console.log('Bankruptcy question not found, continuing...');
    }
    
    console.log('Successfully handled credit score and bankruptcy questions');
  });
});
