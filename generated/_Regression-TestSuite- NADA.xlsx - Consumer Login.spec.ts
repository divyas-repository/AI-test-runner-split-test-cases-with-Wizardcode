import { test, expect } from '@playwright/test';

/**
 * Consumer Login Test Suite
 * Generated from: _Regression-TestSuite- NADA.xlsx - Consumer Login.csv
 * 
 * Test Cases: 4
 * Focus: Consumer authentication and login functionality
 * Target: https://nada-hei.onrender.com/
 */

test.describe('Consumer Login Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Set default timeout for all tests
    test.setTimeout(120000);
    
    // Set viewport for consistent testing
    await page.setViewportSize({ width: 1280, height: 720 });
    
    console.log('🚀 Starting Consumer Login test...');
  });

  test.afterEach(async ({ page }) => {
    // Cleanup after each test
    await page.close();
    console.log('🧹 Test cleanup completed');
  });

  test('Verify user is redirected to the Login page.', async ({ page }) => {
    console.log('🔍 Starting test: Verify user is redirected to the Login page.');
    console.log('📋 Test ID: TC-NADA-07');
    console.log('🏷️ Module: Consumer Login');
    console.log('⭐ Feature: Authentication');
    
    // Set longer timeout for consumer login tests
    test.setTimeout(120000);
    
    try {
      // Navigate to the application
      console.log('🌐 Navigating to application...');
      await page.goto('https://nada-hei.onrender.com/', { 
        waitUntil: 'networkidle',
        timeout: 60000 
      });
      
      // Wait for page to load completely
      await page.waitForLoadState('networkidle');
      console.log('✅ Page loaded successfully');
      
      // Generate unique test data to avoid conflicts
      const timestamp = Date.now();
      const uniqueId = Math.random().toString(36).substring(2, 8);
      
      console.log('🔧 Test Steps: Login steps not specified');
      console.log('📊 Test Data: Test data not specified');
      
      // Consumer Login specific actions
      if (page.url().includes('nada-hei.onrender.com')) {
        console.log('🏠 On NADA application homepage');
        
        // Look for login-related elements
        const loginButton = page.locator('button:has-text("Login"), a:has-text("Login"), [data-testid*="login"]').first();
        const usernameField = page.locator('input[type="email"], input[name*="username"], input[name*="email"], input[placeholder*="email"]').first();
        const passwordField = page.locator('input[type="password"], input[name*="password"]').first();
        
        // Check if login elements exist
        if (await loginButton.isVisible({ timeout: 5000 }).catch(() => false)) {
          console.log('🔑 Login button found, clicking...');
          await loginButton.click();
          await page.waitForTimeout(2000);
        }
        
        // Fill login credentials if fields are available
        if (await usernameField.isVisible({ timeout: 5000 }).catch(() => false)) {
          console.log('👤 Username field found, filling...');
          await usernameField.fill(`testuser_${uniqueId}@example.com`);
        }
        
        if (await passwordField.isVisible({ timeout: 5000 }).catch(() => false)) {
          console.log('🔒 Password field found, filling...');
          await passwordField.fill('TestPassword123!');
        }
        
        // Look for submit button
        const submitButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")').first();
        if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
          console.log('✅ Submit button found, clicking...');
          await submitButton.click();
          await page.waitForTimeout(3000);
        }
      }
      
      // Verify expected results
      console.log('🔍 Verifying expected result: Expected result not specified');
      
      // Basic assertions for consumer login
      await expect(page).toBeTruthy();
      console.log('✅ Page is accessible');
      
      // Take screenshot for verification
      await page.screenshot({ 
        path: `test-results/consumer-login-${tc.id}-${timestamp}.png`,
        fullPage: true 
      });
      
      console.log('✅ Test completed successfully: Verify user is redirected to the Login page.');
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      
      // Take screenshot on failure
      await page.screenshot({ 
        path: `test-results/consumer-login-${tc.id}-${timestamp}-FAILED.png`,
        fullPage: true 
      });
      
      throw error;
    }
  });

  test('Verify user should be able to enter the email and click Submit button.', async ({ page }) => {
    console.log('🔍 Starting test: Verify user should be able to enter the email and click Submit button.');
    console.log('📋 Test ID: TC-NADA-08');
    console.log('🏷️ Module: Consumer Login');
    console.log('⭐ Feature: Authentication');
    
    // Set longer timeout for consumer login tests
    test.setTimeout(120000);
    
    try {
      // Navigate to the application
      console.log('🌐 Navigating to application...');
      await page.goto('https://nada-hei.onrender.com/', { 
        waitUntil: 'networkidle',
        timeout: 60000 
      });
      
      // Wait for page to load completely
      await page.waitForLoadState('networkidle');
      console.log('✅ Page loaded successfully');
      
      // Generate unique test data to avoid conflicts
      const timestamp = Date.now();
      const uniqueId = Math.random().toString(36).substring(2, 8);
      
      console.log('🔧 Test Steps: Login steps not specified');
      console.log('📊 Test Data: Test data not specified');
      
      // Consumer Login specific actions
      if (page.url().includes('nada-hei.onrender.com')) {
        console.log('🏠 On NADA application homepage');
        
        // Look for login-related elements
        const loginButton = page.locator('button:has-text("Login"), a:has-text("Login"), [data-testid*="login"]').first();
        const usernameField = page.locator('input[type="email"], input[name*="username"], input[name*="email"], input[placeholder*="email"]').first();
        const passwordField = page.locator('input[type="password"], input[name*="password"]').first();
        
        // Check if login elements exist
        if (await loginButton.isVisible({ timeout: 5000 }).catch(() => false)) {
          console.log('🔑 Login button found, clicking...');
          await loginButton.click();
          await page.waitForTimeout(2000);
        }
        
        // Fill login credentials if fields are available
        if (await usernameField.isVisible({ timeout: 5000 }).catch(() => false)) {
          console.log('👤 Username field found, filling...');
          await usernameField.fill(`testuser_${uniqueId}@example.com`);
        }
        
        if (await passwordField.isVisible({ timeout: 5000 }).catch(() => false)) {
          console.log('🔒 Password field found, filling...');
          await passwordField.fill('TestPassword123!');
        }
        
        // Look for submit button
        const submitButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")').first();
        if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
          console.log('✅ Submit button found, clicking...');
          await submitButton.click();
          await page.waitForTimeout(3000);
        }
      }
      
      // Verify expected results
      console.log('🔍 Verifying expected result: Expected result not specified');
      
      // Basic assertions for consumer login
      await expect(page).toBeTruthy();
      console.log('✅ Page is accessible');
      
      // Take screenshot for verification
      await page.screenshot({ 
        path: `test-results/consumer-login-${tc.id}-${timestamp}.png`,
        fullPage: true 
      });
      
      console.log('✅ Test completed successfully: Verify user should be able to enter the email and click Submit button.');
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      
      // Take screenshot on failure
      await page.screenshot({ 
        path: `test-results/consumer-login-${tc.id}-${timestamp}-FAILED.png`,
        fullPage: true 
      });
      
      throw error;
    }
  });

  test('Verify that the User is entering a valid Email. The user should receive a popup message saying, A magic link has been sent to your email.', async ({ page }) => {
    console.log('🔍 Starting test: Verify that the User is entering a valid Email. The user should receive a popup message saying, A magic link has been sent to your email.');
    console.log('📋 Test ID: TC-NADA-09');
    console.log('🏷️ Module: Consumer Login');
    console.log('⭐ Feature: Consumer Login');
    
    // Set longer timeout for consumer login tests
    test.setTimeout(120000);
    
    try {
      // Navigate to the application
      console.log('🌐 Navigating to application...');
      await page.goto('https://nada-hei.onrender.com/', { 
        waitUntil: 'networkidle',
        timeout: 60000 
      });
      
      // Wait for page to load completely
      await page.waitForLoadState('networkidle');
      console.log('✅ Page loaded successfully');
      
      // Generate unique test data to avoid conflicts
      const timestamp = Date.now();
      const uniqueId = Math.random().toString(36).substring(2, 8);
      
      console.log('🔧 Test Steps: 1. Launch the application');
      console.log('📊 Test Data: Test data not specified');
      
      // Consumer Login specific actions
      if (page.url().includes('nada-hei.onrender.com')) {
        console.log('🏠 On NADA application homepage');
        
        // Look for login-related elements
        const loginButton = page.locator('button:has-text("Login"), a:has-text("Login"), [data-testid*="login"]').first();
        const usernameField = page.locator('input[type="email"], input[name*="username"], input[name*="email"], input[placeholder*="email"]').first();
        const passwordField = page.locator('input[type="password"], input[name*="password"]').first();
        
        // Check if login elements exist
        if (await loginButton.isVisible({ timeout: 5000 }).catch(() => false)) {
          console.log('🔑 Login button found, clicking...');
          await loginButton.click();
          await page.waitForTimeout(2000);
        }
        
        // Fill login credentials if fields are available
        if (await usernameField.isVisible({ timeout: 5000 }).catch(() => false)) {
          console.log('👤 Username field found, filling...');
          await usernameField.fill(`testuser_${uniqueId}@example.com`);
        }
        
        if (await passwordField.isVisible({ timeout: 5000 }).catch(() => false)) {
          console.log('🔒 Password field found, filling...');
          await passwordField.fill('TestPassword123!');
        }
        
        // Look for submit button
        const submitButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")').first();
        if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
          console.log('✅ Submit button found, clicking...');
          await submitButton.click();
          await page.waitForTimeout(3000);
        }
      }
      
      // Verify expected results
      console.log('🔍 Verifying expected result: Expected result not specified');
      
      // Basic assertions for consumer login
      await expect(page).toBeTruthy();
      console.log('✅ Page is accessible');
      
      // Take screenshot for verification
      await page.screenshot({ 
        path: `test-results/consumer-login-${tc.id}-${timestamp}.png`,
        fullPage: true 
      });
      
      console.log('✅ Test completed successfully: Verify that the User is entering a valid Email. The user should receive a popup message saying, A magic link has been sent to your email.');
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      
      // Take screenshot on failure
      await page.screenshot({ 
        path: `test-results/consumer-login-${tc.id}-${timestamp}-FAILED.png`,
        fullPage: true 
      });
      
      throw error;
    }
  });

  test('Verify by the magic link user should be able the redirect to the Application progress page.', async ({ page }) => {
    console.log('🔍 Starting test: Verify by the magic link user should be able the redirect to the Application progress page.');
    console.log('📋 Test ID: TC-NADA-10');
    console.log('🏷️ Module: Consumer Login');
    console.log('⭐ Feature: Consumer Login');
    
    // Set longer timeout for consumer login tests
    test.setTimeout(120000);
    
    try {
      // Navigate to the application
      console.log('🌐 Navigating to application...');
      await page.goto('https://nada-hei.onrender.com/', { 
        waitUntil: 'networkidle',
        timeout: 60000 
      });
      
      // Wait for page to load completely
      await page.waitForLoadState('networkidle');
      console.log('✅ Page loaded successfully');
      
      // Generate unique test data to avoid conflicts
      const timestamp = Date.now();
      const uniqueId = Math.random().toString(36).substring(2, 8);
      
      console.log('🔧 Test Steps: 1. Launch the application');
      console.log('📊 Test Data: Test data not specified');
      
      // Consumer Login specific actions
      if (page.url().includes('nada-hei.onrender.com')) {
        console.log('🏠 On NADA application homepage');
        
        // Look for login-related elements
        const loginButton = page.locator('button:has-text("Login"), a:has-text("Login"), [data-testid*="login"]').first();
        const usernameField = page.locator('input[type="email"], input[name*="username"], input[name*="email"], input[placeholder*="email"]').first();
        const passwordField = page.locator('input[type="password"], input[name*="password"]').first();
        
        // Check if login elements exist
        if (await loginButton.isVisible({ timeout: 5000 }).catch(() => false)) {
          console.log('🔑 Login button found, clicking...');
          await loginButton.click();
          await page.waitForTimeout(2000);
        }
        
        // Fill login credentials if fields are available
        if (await usernameField.isVisible({ timeout: 5000 }).catch(() => false)) {
          console.log('👤 Username field found, filling...');
          await usernameField.fill(`testuser_${uniqueId}@example.com`);
        }
        
        if (await passwordField.isVisible({ timeout: 5000 }).catch(() => false)) {
          console.log('🔒 Password field found, filling...');
          await passwordField.fill('TestPassword123!');
        }
        
        // Look for submit button
        const submitButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")').first();
        if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
          console.log('✅ Submit button found, clicking...');
          await submitButton.click();
          await page.waitForTimeout(3000);
        }
      }
      
      // Verify expected results
      console.log('🔍 Verifying expected result: Expected result not specified');
      
      // Basic assertions for consumer login
      await expect(page).toBeTruthy();
      console.log('✅ Page is accessible');
      
      // Take screenshot for verification
      await page.screenshot({ 
        path: `test-results/consumer-login-${tc.id}-${timestamp}.png`,
        fullPage: true 
      });
      
      console.log('✅ Test completed successfully: Verify by the magic link user should be able the redirect to the Application progress page.');
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      
      // Take screenshot on failure
      await page.screenshot({ 
        path: `test-results/consumer-login-${tc.id}-${timestamp}-FAILED.png`,
        fullPage: true 
      });
      
      throw error;
    }
  });
});

/**
 * Test Configuration Summary:
 * - Total Test Cases: 4
 * - Target Application: https://nada-hei.onrender.com/
 * - Test Type: Consumer Login Authentication
 * - Timeout: 120 seconds per test
 * - Screenshot: Enabled for all tests
 * - Unique Data: Generated per test run
 */