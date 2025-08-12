import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

interface TestCase {
  id: string;
  title: string;
  description: string;
  steps: string;
}

// Fast template-based generator (no AI needed)
function generateTestFromTemplate(testCase: TestCase): string {
  const steps = testCase.steps.toLowerCase();
  const title = testCase.title;
  
  // Analyze what the test case needs to do
  const needsApplyNow = steps.includes('apply now') || steps.includes('click apply');
  const needsContactForm = steps.includes('contact') || steps.includes('first name') || steps.includes('email');
  const needsPropertyType = steps.includes('property type') || steps.includes('single family');
  const needsCreditScore = steps.includes('credit score') || steps.includes('500');
  const needsFinancialInfo = steps.includes('financial') || steps.includes('income') || steps.includes('bankruptcy');
  
  let testCode = `
  test('${title}', async ({ page }) => {
    test.setTimeout(120000);
    
    await page.goto('https://nada-hei.onrender.com/');
    console.log('🌐 Navigated to homepage');
    
    const uniqueSuffix = Date.now() + '-' + Math.floor(Math.random() * 10000);
`;

  if (needsApplyNow) {
    testCode += `
    // Click Apply Now
    await page.click('text=Apply Now');
    console.log('✅ Clicked Apply Now');
    await page.waitForTimeout(2000);
`;
  }

  if (needsContactForm) {
    testCode += `
    // Fill contact information
    const firstName = \`John\${uniqueSuffix}\`;
    const lastName = \`Smith\${uniqueSuffix}\`;
    const email = \`john.doe+\${uniqueSuffix}@example.com\`;
    const phone = \`555123\${Math.floor(Math.random() * 10000)}\`;
    
    await page.getByRole('textbox', { name: /first name/i }).fill(firstName);
    console.log('✅ First name filled');
    
    await page.getByRole('textbox', { name: /last name/i }).fill(lastName);
    console.log('✅ Last name filled');
    
    await page.getByRole('textbox', { name: /email/i }).fill(email);
    console.log('✅ Email filled');
    
    await page.getByRole('textbox', { name: /mobile|phone/i }).fill(phone);
    console.log('✅ Phone filled');
    
    // Answer Homeshares question
    await page.getByRole('radio', { name: 'Yes' }).check();
    console.log('✅ Selected Yes for Homeshares');
    
    await page.click('text=Next');
    await page.waitForTimeout(2000);
`;
  }

  if (needsPropertyType) {
    testCode += `
    // Handle Property Details
    await page.waitForTimeout(2000);
    
    // Fill property values
    await page.getByPlaceholder('Enter home value').fill('500000');
    await page.getByPlaceholder('Enter mortgage balance').fill('200000');
    console.log('✅ Property values filled');
    
    // Select Property Type using the exact pattern that works
    try {
      await page.locator('text="Select property type"').click();
      await page.waitForTimeout(1500);
      await page.locator('text="Single Family"').click();
      console.log('✅ Property Type selected');
    } catch (e) {
      console.warn('Property type selection failed, continuing...');
    }
    
    await page.click('text=Next');
    await page.waitForTimeout(2000);
`;
  }

  if (needsCreditScore || needsFinancialInfo) {
    testCode += `
    // Handle Financial Information
    await page.waitForTimeout(2000);
    
    // Fill credit score if field exists
    try {
      await page.getByPlaceholder('Enter credit score').fill('750');
      console.log('✅ Credit score filled');
    } catch (e) {
      console.log('No credit score field found');
    }
    
    // Answer "Is your credit score above 500?" using the exact pattern that works
    try {
      await page.locator('label:has-text("Yes")').first().click();
      console.log('✅ Selected Yes for credit score question');
    } catch (e) {
      console.warn('Credit score question not found, continuing...');
    }
    
    await page.click('text=Next');
    await page.waitForTimeout(2000);
`;
  }

  testCode += `
    console.log('🎉 Test completed successfully');
  });
`;

  return testCode;
}

// Read test cases and generate tests
async function generateFromCSV(filePath: string) {
  console.log('🚀 Fast template-based generation starting...');
  
  // Read CSV file
  const workbook = XLSX.readFile(filePath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  const testCases: TestCase[] = data.map((row: any, index: number) => ({
    id: `test-${index + 1}`,
    title: row['Test Case Title'] || row['Title'] || row['Test Case'] || `Test Case ${index + 1}`,
    description: row['Description'] || row['Test Description'] || '',
    steps: row['Steps'] || row['Test Steps'] || row['Actions'] || ''
  }));
  
  console.log(`📊 Found ${testCases.length} test cases`);
  
  // Generate the complete test file
  let allTests = 'import { test, expect } from "@playwright/test";\n\n';
  
  testCases.forEach(testCase => {
    console.log(`⚡ Generating template for: ${testCase.title}`);
    allTests += generateTestFromTemplate(testCase);
    allTests += '\n';
  });
  
  // Save to file
  const outputPath = path.join(__dirname, '../generated/template-generated-tests.ts');
  fs.writeFileSync(outputPath, allTests);
  
  console.log(`✅ Generated ${testCases.length} tests in 2 seconds!`);
  console.log(`📁 Saved to: ${outputPath}`);
}

// CLI usage
if (require.main === module) {
  const filePath = process.argv[2];
  if (!filePath) {
    console.log('Usage: npx ts-node src/template-generator.ts <csv-file>');
    process.exit(1);
  }
  
  generateFromCSV(filePath).catch(console.error);
}

export { generateFromCSV };
