import path from 'path';
import { loadModel, createCompletion } from 'gpt4all';
import fs from 'fs';
import { CodeValidator } from './code-validator';
import * as XLSX from 'xlsx';

interface TestCase {
  id: string;
  title: string;
  description: string;
  steps: string;
}

// Configuration for retry generation
const CONFIG = {
  modelsDir: path.join(__dirname, '../Models'),
  modelName: 'mistral-7b-instruct-v0.1.Q2_K.gguf', // Use the faster model
  outputDir: path.join(__dirname, '../generated'),
  csvFile: 'my-test-cases.csv\\_Regression-TestSuite- NADA.xlsx - Automation-suite.csv'
};

// Optimized prompt for failed test regeneration
function buildRetryPrompt(testCase: TestCase): string {
  return [
    'Generate a Playwright test function. Output ONLY valid TypeScript code:',
    '',
    `test('${testCase.title}', async ({ page }) => {`,
    '  test.setTimeout(120000);',
    '  await page.goto("https://nada-hei.onrender.com/");',
    '  ',
    '  // Click Apply Now',
    '  await page.click("text=Apply Now");',
    '  await page.waitForTimeout(2000);',
    '  ',
    '  // Property dropdown pattern:',
    '  await page.locator(\'text="Select property type"\').click();',
    '  await page.waitForTimeout(1500);',
    '  await page.locator(\'text="Single Family"\').click();',
    '  ',
    '  // Radio button pattern:',
    '  await page.locator(\'label:has-text("Yes")\').first().click();',
    '  ',
    '  // Add more steps as needed',
    '});',
    '',
    'CRITICAL RULES:',
    '- ONLY return valid TypeScript code',
    '- NO explanatory text outside the function',
    '- NO narrative text or descriptions',
    '- Use // for comments INSIDE function only',
    '- Phone numbers: use 555123XXXX format (10 digits, no spaces)',
    '- Use proven selectors: getByPlaceholder, waitForURL, [role="combobox"]',
    '',
    'PROVEN WORKING SELECTORS:',
    '- Forms: getByPlaceholder("Enter First Name")',
    '- Dropdowns: locator("[role=\\"combobox\\"]").click()',
    '- Navigation: waitForURL("**/apply/contact", {timeout: 30000})',
    '',
    'CRITICAL: ONLY use https://nada-hei.onrender.com/ - NO OTHER URLS',
    `Automate these steps: ${testCase.steps}`,
    `Description: ${testCase.description}`,
    '',
    'Generate ONLY the test function code:'
  ].join('\\n');
}

// Read test cases from CSV
function readFailedTestCases(): TestCase[] {
  const csvPath = path.join(__dirname, '..', CONFIG.csvFile);
  const workbook = XLSX.readFile(csvPath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  // Get test cases 3-14 (the failed ones)
  const failedCases = data.slice(2, 14).map((row: any, index: number) => ({
    id: `test-${index + 3}`,
    title: row['Test Case Title'] || row['Title'] || row['Test Case'] || `Test Case ${index + 3}`,
    description: row['Description'] || row['Test Description'] || '',
    steps: row['Steps'] || row['Test Steps'] || row['Actions'] || ''
  }));
  
  return failedCases;
}

// Generate single test with retry logic
async function generateSingleTest(testCase: TestCase, model: any): Promise<string> {
  const prompt = buildRetryPrompt(testCase);
  
  console.log(`🔄 Regenerating ${testCase.id}: ${testCase.title}`);
  console.log(`📝 Prompt: ${prompt.substring(0, 100)}...`);
  
  try {
    const startTime = Date.now();
    
    // Create completion with shorter timeout for retry
    const completionPromise = createCompletion(model, prompt);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout after 120s')), 120000)
    );
    
    const res = await Promise.race([completionPromise, timeoutPromise]) as any;
    const endTime = Date.now();
    
    console.log(`⏱️ Generation took ${(endTime - startTime) / 1000}s`);
    
    if (res && res.choices && res.choices[0] && res.choices[0].message && res.choices[0].message.content) {
      let code = res.choices[0].message.content;
      
      // Clean up the generated code
      code = code.replace(/```[a-zA-Z]*|```/g, '');
      code = code.trim();
      
      // Ensure it starts with test( if not already
      if (!code.includes('test(')) {
        code = `test('${testCase.title}', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto("https://nada-hei.onrender.com/");
  ${code}
});`;
      }
      
      console.log(`✅ Successfully generated ${testCase.id}`);
      return code;
    } else {
      throw new Error('No valid response from LLM');
    }
  } catch (error: any) {
    console.log(`❌ Failed to generate ${testCase.id}: ${error.message}`);
    
    // Return a basic template on failure
    return `test('${testCase.title}', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto("https://nada-hei.onrender.com/");
  console.log('🔄 Regeneration needed for: ${testCase.title}');
  // TODO: Manual implementation required
  // Steps: ${testCase.steps}
});`;
  }
}

// Main regeneration function
async function regenerateFailedTests() {
  console.log('🚀 Starting LLM regeneration for failed test cases...');
  
  // Load the model
  console.log('📦 Loading Mistral model...');
  const modelPath = path.join(CONFIG.modelsDir, CONFIG.modelName);
  const model = await loadModel(CONFIG.modelName, { modelPath: CONFIG.modelsDir });
  console.log('✅ Model loaded successfully');
  
  // Get failed test cases
  const failedTests = readFailedTestCases();
  console.log(`📊 Found ${failedTests.length} failed test cases to regenerate`);
  
  // Generate each test
  let regeneratedTests = '';
  let successCount = 0;
  
  for (const testCase of failedTests) {
    const testCode = await generateSingleTest(testCase, model);
    regeneratedTests += testCode + '\\n\\n';
    
    if (!testCode.includes('TODO: Manual implementation')) {
      successCount++;
    }
    
    // Add small delay between generations
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Create complete test file
  const completeFile = `import { test, expect } from "@playwright/test";

// Helper function for filling contact and homeshares information
async function fillContactAndHomeshares(page: any, uniqueSuffix: string) {
  const firstName = \`John\${uniqueSuffix}\`;
  const lastName = \`Smith\${uniqueSuffix}\`;
  const email = \`john.smith\${uniqueSuffix}@example.com\`;
  const mobile = \`123456789\${uniqueSuffix}\`;
  
  console.log(\`Filling contact form with: \${firstName} \${lastName}, \${email}, \${mobile}\`);
  
  try {
    await page.getByLabel(/first.*name/i).fill(firstName);
    await page.getByLabel(/last.*name/i).fill(lastName);
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/mobile|phone/i).fill(mobile);
    await page.getByRole('radio', { name: /yes/i }).first().click();
    console.log('✅ Contact form completed');
  } catch (error) {
    console.error('❌ Error in fillContactAndHomeshares:', error);
    throw error;
  }
}

test.describe('Regenerated Failed Tests - ${new Date().toLocaleDateString()}', () => {

${regeneratedTests}

});
`;

  // Save the regenerated tests with validation
  const outputPath = path.join(CONFIG.outputDir, 'regenerated-tests.ts');
  
  // Validate generated content before writing
  const validation = CodeValidator.validateContent(completeFile, outputPath);
  if (!validation.valid) {
    console.log('❌ Regenerated code validation failed:');
    validation.errors.forEach(error => console.log(`   ${error}`));
    throw new Error('Regenerated code failed validation - preventing empty/invalid file creation');
  }
  
  // Use validated file creation
  const success = await CodeValidator.createValidatedFile(outputPath, completeFile);
  if (!success) {
    throw new Error('Failed to create validated regenerated test file');
  }
  
  console.log(`🎉 Regeneration completed!`);
  console.log(`✅ Successfully regenerated: ${successCount}/${failedTests.length} tests`);
  console.log(`📁 Saved to: ${outputPath}`);
  
  return outputPath;
}

// CLI usage
if (require.main === module) {
  regenerateFailedTests().catch(console.error);
}

export { regenerateFailedTests };
