import path from 'path';
import fs from 'fs';
import { CodeValidator } from './code-validator';

/**
 * Template-based CSV Test Generator
 * 
 * Generates basic Playwright automation scripts from CSV files
 * without requiring AI models - creates working templates
 */

interface TestCase {
  id: string;
  title: string;
  description: string;
  steps: string;
}

interface CSVMapping {
  csvFile: string;
  generatedScript: string;
  testCases: number;
  lastGenerated: string;
  status: 'success' | 'failed' | 'pending';
}

// Configuration
const CONFIG = {
  projectRoot: path.join(__dirname, '..'),
  generatedDir: path.join(__dirname, '../generated'),
  mappingFile: path.join(__dirname, '../csv-mappings.json')
};

// Ensure directories exist
function ensureDirectories() {
  if (!fs.existsSync(CONFIG.generatedDir)) {
    fs.mkdirSync(CONFIG.generatedDir, { recursive: true });
  }
}

// Find all CSV files in the project
function findCSVFiles(): string[] {
  const csvFiles: string[] = [];
  
  function scanDirectory(dir: string) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!['node_modules', '.git', 'playwright-report', 'test-results'].includes(item)) {
          scanDirectory(fullPath);
        }
      } else if (item.toLowerCase().endsWith('.csv')) {
        csvFiles.push(fullPath);
      }
    }
  }
  
  scanDirectory(CONFIG.projectRoot);
  return csvFiles;
}

// Parse CSV file to extract test cases
function parseCSVFile(csvPath: string): TestCase[] {
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error(`CSV file ${csvPath} must have at least a header and one data row`);
  }
  
  function splitCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }
  
  const headers = splitCSVLine(lines[0]).map(h => h.toLowerCase().replace(/"/g, ''));
  const testCases: TestCase[] = [];
  
  const idIndex = headers.findIndex(h => h.includes('id'));
  const titleIndex = headers.findIndex(h => h.includes('title') || h.includes('name'));
  const descIndex = headers.findIndex(h => h.includes('description') || h.includes('desc'));
  const stepsIndex = headers.findIndex(h => h.includes('steps') || h.includes('step'));
  
  if (idIndex === -1 || titleIndex === -1) {
    throw new Error(`CSV file ${csvPath} must have 'id' and 'title' columns. Found: ${headers.join(', ')}`);
  }
  
  for (let i = 1; i < lines.length; i++) {
    const values = splitCSVLine(lines[i]).map(v => v.replace(/"/g, '').trim());
    
    if (values.length >= Math.max(idIndex + 1, titleIndex + 1)) {
      testCases.push({
        id: values[idIndex] || `test-${i}`,
        title: values[titleIndex] || `Test Case ${i}`,
        description: values[descIndex] || 'Test case description',
        steps: values[stepsIndex] || 'Test steps not specified'
      });
    }
  }
  
  return testCases;
}

// Generate script name from CSV file name
function generateScriptName(csvPath: string): string {
  const baseName = path.basename(csvPath, '.csv');
  const cleanName = baseName
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  return `${cleanName}-automation.spec.ts`;
}

// Generate Playwright script template
function generatePlaywrightScript(testCases: TestCase[], csvFileName: string): string {
  const timestamp = new Date().toISOString();
  
  let script = `import { test, expect } from "@playwright/test";

/**
 * Automated Test Suite Generated from: ${csvFileName}
 * Generated on: ${timestamp}
 * Total Test Cases: ${testCases.length}
 */

// Helper function for common actions
async function navigateToApp(page: any) {
  await page.goto("https://nada-hei.onrender.com/");
  await page.waitForLoadState('networkidle');
}

// Helper function for form filling with dynamic data
function generateTestData(testId: string) {
  const timestamp = Date.now().toString().slice(-4);
  return {
    firstName: \`Test\${timestamp}\`,
    lastName: \`User\${timestamp}\`,
    email: \`test.user\${timestamp}@example.com\`,
    phone: \`555123\${timestamp}\`
  };
}

`;

  testCases.forEach((testCase, index) => {
    const testFunction = `
test('${testCase.title}', async ({ page }) => {
  test.setTimeout(120000);
  
  console.log('🚀 Starting: ${testCase.title}');
  console.log('📋 Description: ${testCase.description}');
  console.log('📝 Steps: ${testCase.steps}');
  
  try {
    // Navigate to application
    await navigateToApp(page);
    console.log('✅ Application loaded');
    
    // Generate dynamic test data
    const testData = generateTestData('${testCase.id}');
    
    // TODO: Implement specific test steps based on: ${testCase.steps}
    // This is a template - customize based on your application's UI
    
    ${generateTestSteps(testCase)}
    
    console.log('✅ ${testCase.title} completed successfully');
    
  } catch (error) {
    console.error('❌ ${testCase.title} failed:', error);
    throw error;
  }
});
`;
    script += testFunction;
  });

  return script;
}

// Generate specific test steps based on CSV data
function generateTestSteps(testCase: TestCase): string {
  const steps = testCase.steps.toLowerCase();
  
  if (steps.includes('apply now') || steps.includes('click apply')) {
    return `
    // Click Apply Now button
    await page.getByRole('button', { name: /apply.*now/i }).first().click();
    await page.waitForURL('**/apply/contact', { timeout: 30000 });
    console.log('✅ Apply Now clicked and redirected');`;
  }
  
  if (steps.includes('contact form') || steps.includes('fill form')) {
    return `
    // Fill contact form
    await page.getByRole('button', { name: /apply.*now/i }).first().click();
    await page.waitForURL('**/apply/contact', { timeout: 30000 });
    
    await page.getByPlaceholder('Enter First Name').fill(testData.firstName);
    await page.getByPlaceholder('Enter Last Name').fill(testData.lastName);
    await page.getByPlaceholder('Enter email address').fill(testData.email);
    await page.getByPlaceholder('Enter mobile number').fill(testData.phone);
    
    // Select "No" for previous application
    await page.locator('input[name="hasAppliedBefore"]').last().click();
    
    // Click Next
    await page.getByRole('button', { name: /next/i }).click();
    console.log('✅ Contact form filled and submitted');`;
  }
  
  if (steps.includes('property') || steps.includes('home value')) {
    return `
    // Navigate through to property section
    await page.getByRole('button', { name: /apply.*now/i }).first().click();
    await page.waitForURL('**/apply/contact', { timeout: 30000 });
    
    // Fill basic contact info
    await page.getByPlaceholder('Enter First Name').fill(testData.firstName);
    await page.getByPlaceholder('Enter Last Name').fill(testData.lastName);
    await page.getByPlaceholder('Enter email address').fill(testData.email);
    await page.getByPlaceholder('Enter mobile number').fill(testData.phone);
    await page.locator('input[name="hasAppliedBefore"]').last().click();
    await page.getByRole('button', { name: /next/i }).click();
    
    // Fill property details
    await page.waitForURL('**/apply/home-value', { timeout: 30000 });
    await page.getByPlaceholder('Enter home value').fill('500000');
    await page.getByPlaceholder('Enter mortgage balance').fill('200000');
    
    // Select property type
    await page.locator('[role="combobox"]').click();
    await page.waitForTimeout(1000);
    await page.locator('[role="option"]').first().click();
    
    console.log('✅ Property details filled');`;
  }
  
  if (steps.includes('credit score')) {
    return `
    // Navigate through to credit score section
    await page.getByRole('button', { name: /apply.*now/i }).first().click();
    await page.waitForURL('**/apply/contact', { timeout: 30000 });
    
    // Fill contact form
    await page.getByPlaceholder('Enter First Name').fill(testData.firstName);
    await page.getByPlaceholder('Enter Last Name').fill(testData.lastName);
    await page.getByPlaceholder('Enter email address').fill(testData.email);
    await page.getByPlaceholder('Enter mobile number').fill(testData.phone);
    await page.locator('input[name="hasAppliedBefore"]').last().click();
    await page.getByRole('button', { name: /next/i }).click();
    
    // Fill property details  
    await page.waitForURL('**/apply/home-value', { timeout: 30000 });
    await page.getByPlaceholder('Enter home value').fill('500000');
    await page.getByPlaceholder('Enter mortgage balance').fill('200000');
    await page.locator('[role="combobox"]').click();
    await page.waitForTimeout(1000);
    await page.locator('[role="option"]').first().click();
    await page.getByRole('button', { name: /next/i }).click();
    
    // Select credit score
    await page.waitForURL('**/apply/credit-score', { timeout: 30000 });
    await page.locator('input[name="creditScore"]').first().click();
    
    console.log('✅ Credit score selected');`;
  }
  
  // Default implementation for other test cases
  return `
    // Basic test implementation - customize based on your specific steps
    // Steps from CSV: ${testCase.steps}
    
    await page.waitForTimeout(2000);
    console.log('⚠️ This test case needs specific implementation');
    console.log('📝 Refer to steps: ${testCase.steps}');`;
}

// Load saved mappings
function loadMappings(): CSVMapping[] {
  if (fs.existsSync(CONFIG.mappingFile)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG.mappingFile, 'utf8'));
    } catch (error) {
      console.log('⚠️ Could not load mappings file, starting fresh');
    }
  }
  return [];
}

// Save mappings
function saveMappings(mappings: CSVMapping[]) {
  fs.writeFileSync(CONFIG.mappingFile, JSON.stringify(mappings, null, 2));
}

// Generate automation script for a CSV file
async function generateScriptForCSV(csvPath: string): Promise<string> {
  console.log(`\n🔄 Processing CSV file: ${path.basename(csvPath)}`);
  
  try {
    const testCases = parseCSVFile(csvPath);
    console.log(`📋 Found ${testCases.length} test cases`);
    
    const scriptName = generateScriptName(csvPath);
    const outputPath = path.join(CONFIG.generatedDir, scriptName);
    
    console.log('✨ Generating automation script template...');
    const generatedCode = generatePlaywrightScript(testCases, path.basename(csvPath));
    
    // Validate generated content
    const validation = CodeValidator.validateContent(generatedCode, outputPath);
    if (!validation.valid) {
      console.log('❌ Generated code validation failed:');
      validation.errors.forEach(error => console.log(`   ${error}`));
      throw new Error('Generated code failed validation');
    }
    
    // Save validated file
    const success = await CodeValidator.createValidatedFile(outputPath, generatedCode);
    if (!success) {
      throw new Error('Failed to create validated automation script');
    }
    
    console.log(`✅ Generated automation script: ${scriptName}`);
    return outputPath;
    
  } catch (error) {
    console.error(`❌ Error processing ${csvPath}:`, error);
    throw error;
  }
}

// Main function to process all CSV files
export async function processAllCSVFiles(): Promise<void> {
  console.log('🚀 Starting automatic CSV test generation...\n');
  
  ensureDirectories();
  
  const csvFiles = findCSVFiles();
  
  if (csvFiles.length === 0) {
    console.log('📂 No CSV files found in the project');
    return;
  }
  
  console.log(`📊 Found ${csvFiles.length} CSV file(s):`);
  csvFiles.forEach(file => console.log(`   - ${path.relative(CONFIG.projectRoot, file)}`));
  
  const updatedMappings: CSVMapping[] = [];
  
  for (const csvPath of csvFiles) {
    try {
      const scriptPath = await generateScriptForCSV(csvPath);
      const testCases = parseCSVFile(csvPath);
      
      updatedMappings.push({
        csvFile: path.relative(CONFIG.projectRoot, csvPath),
        generatedScript: path.relative(CONFIG.projectRoot, scriptPath),
        testCases: testCases.length,
        lastGenerated: new Date().toISOString(),
        status: 'success'
      });
      
    } catch (error) {
      console.error(`❌ Failed to process ${csvPath}`);
      
      updatedMappings.push({
        csvFile: path.relative(CONFIG.projectRoot, csvPath),
        generatedScript: 'generation-failed',
        testCases: 0,
        lastGenerated: new Date().toISOString(),
        status: 'failed'
      });
    }
  }
  
  saveMappings(updatedMappings);
  
  // Display summary
  console.log('\n📋 Generation Summary:');
  console.log('┌─────────────────────────────────────────────────────────────┐');
  console.log('│ CSV File                │ Generated Script              │ Status │');
  console.log('├─────────────────────────────────────────────────────────────┤');
  
  updatedMappings.forEach(mapping => {
    const csvName = mapping.csvFile.padEnd(23);
    const scriptName = mapping.generatedScript.slice(0, 28).padEnd(28);
    const status = mapping.status === 'success' ? '✅' : '❌';
    console.log(`│ ${csvName} │ ${scriptName} │ ${status}    │`);
  });
  
  console.log('└─────────────────────────────────────────────────────────────┘');
  
  const successCount = updatedMappings.filter(m => m.status === 'success').length;
  console.log(`\n🎉 Generation completed! ${successCount}/${csvFiles.length} files processed successfully`);
  
  if (successCount > 0) {
    console.log('\n🔍 File Mapping:');
    updatedMappings
      .filter(m => m.status === 'success')
      .forEach(mapping => {
        console.log(`   📄 ${mapping.csvFile} → 🤖 ${mapping.generatedScript}`);
      });
    
    console.log('\n💡 Next Steps:');
    console.log('   1. Review generated scripts in the /generated folder');
    console.log('   2. Customize the test implementations for your application');
    console.log('   3. Run tests: npx playwright test generated/');
  }
}

// CLI interface
if (require.main === module) {
  processAllCSVFiles().catch(console.error);
}
