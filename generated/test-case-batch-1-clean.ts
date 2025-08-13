import { test, expect } from "@playwright/test";

// Helper function for filling contact and homeshares information
async function fillContactAndHomeshares(page: any, uniqueSuffix: string) {
  const firstName = `John${uniqueSuffix}`;
  const lastName = `Smith${uniqueSuffix}`;
  const email = `john.smith${uniqueSuffix}@example.com`;
  const mobile = `123456789${uniqueSuffix}`;
  
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

test.describe('Batch 1 - Apply Now and Contact Form Tests', () => {
  
  test('Verify the user is redirected to the Application progress page by clicking on Apply Now.', async ({ page }) => {
    test.setTimeout(120000);
    
    try {
      console.log('🚀 Starting Apply Now redirection test');
      
      // Launch the application
      await page.goto('https://nada-hei.onrender.com/');
      console.log('✅ Navigated to application homepage');
      
      // Click on "Apply Now" button (use first() to handle multiple buttons)
      await page.getByRole('button', { name: /apply.*now/i }).first().click();
      console.log('✅ Clicked Apply Now button');
      
      // Wait for navigation and verify we're on the contact page
      await page.waitForURL(/.*apply.*contact.*/i, { timeout: 30000 });
      console.log('✅ Successfully redirected to Contact page');
      
      // Verify page content - use specific heading to avoid strict mode violation
      await expect(page.getByRole('heading', { name: /what is your email address/i })).toBeVisible();
      console.log('✅ Contact page content verified');
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      throw error;
    }
  });

  test('Verify user can fill out the application form and click Next', async ({ page }) => {
    test.setTimeout(120000);
    
    try {
      console.log('🚀 Starting contact form fill test');
      
      // Launch the application - use correct URL
      await page.goto('https://nada-hei.onrender.com/');
      console.log('✅ Navigated to application homepage');
      
      // Click on "Apply Now" (use first() to handle multiple buttons)
      await page.getByRole('button', { name: /apply.*now/i }).first().click();
      console.log('✅ Clicked Apply Now button');
      
      // Wait for contact page to load
      await page.waitForURL(/.*apply.*contact.*/);
      console.log('✅ Contact form loaded');
      
      // Verify we're on contact page
      await expect(page.getByRole('heading', { name: /what is your email address/i })).toBeVisible();
      console.log('✅ Contact page verified');
      
      // Fill out the contact form
      const uniqueSuffix = Date.now().toString().slice(-4);
      await fillContactAndHomeshares(page, uniqueSuffix);
      console.log('✅ Contact form filled');
      
      // Click Next button if available
      try {
        await page.getByRole('button', { name: /next|continue/i }).click();
        console.log('✅ Clicked Next button');
      } catch (error) {
        console.log('⚠️ Next button not found or not clickable');
      }
      await page.waitForSelector('input[name="address"], input[placeholder*="address"], input[aria-label*="address"]', { timeout: 15000 });
      console.log('✅ Successfully navigated to next step (Address form)');
      
      // Verify we're on the address/property details step
      await expect(page.getByRole('heading', { name: /property|address/i })).toBeVisible();
      console.log('✅ Address/Property form verified');
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      throw error;
    }
  });
  
});
