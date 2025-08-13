import path from 'path';
import { loadModel, createCompletion } from 'gpt4all';
import fs from 'fs';
import * as XLSX from 'xlsx';
import { CodeValidator } from './code-validator';

/**
 * Excel-based Test Generator with Locking System
 * 
 * Features:
 * 1. Reads test cases from Excel file
 * 2. Locks successfully executed tests to prevent regeneration
 * 3. Only regenerates failed or new tests
 * 4. Maintains test execution history
 * 5. Validates generated code to prevent empty/invalid files
 */

interface TestCase {
  id: string;
  title: string;
  description: string;
  steps: string;
  locked: boolean;
  lastExecuted?: string;
  executionStatus?: 'passed' | 'failed' | 'never_run';
}

interface TestLock {
  testId: string;
  title: string;
  locked: boolean;
  lockedAt: string;
  filePath: string;
  executionStatus: 'passed' | 'failed' | 'never_run';
  lastExecuted?: string;
}

// Configuration
const CONFIG = {
  excelFilePath: '', // Will be set via command line argument
  generatedDir: path.join(__dirname, '../generated'),
  locksFile: path.join(__dirname, '../test-locks.json'),
  modelsDir: path.join(__dirname, '../Models'),
  modelName: 'mistral-7b-instruct-v0.1.Q2_K.gguf' // Faster model
};

// Clean LLM output
function cleanLLMOutput(code: string): string {
  code = code.replace(/```[a-zA-Z]*|```/g, '');
  code = code.split('\n').filter(line => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    if (trimmed.startsWith('#') && !trimmed.startsWith('//')) return false;
    if (trimmed.startsWith('//')) return true;
    if (trimmed.startsWith('Explanation:')) return false;
    if (trimmed.startsWith('Here')) return false;
    if (trimmed.startsWith('Test Case:')) return false;
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) return false;
    if (trimmed.includes('IMPORTANT: Output ONLY valid TypeScript')) return false;
    if (trimmed.includes('Write a Playwright test')) return false;
    if (trimmed.includes('page.screenshot')) return false; // Remove screenshot calls
    if (trimmed.includes('.screenshot(')) return false; // Remove any screenshot calls
    return true;
  }).join('\n');
  return code.trim();
}

// Load test locks
function loadTestLocks(): TestLock[] {
  try {
    if (fs.existsSync(CONFIG.locksFile)) {
      const data = fs.readFileSync(CONFIG.locksFile, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.log('No existing locks file found, creating new one');
  }
  return [];
}

// Save test locks
function saveTestLocks(locks: TestLock[]): void {
  fs.writeFileSync(CONFIG.locksFile, JSON.stringify(locks, null, 2));
}

// Read test cases from Excel
function readTestCasesFromExcel(filePath: string): TestCase[] {
  console.log(`📊 Reading test cases from Excel: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`Excel file not found: ${filePath}`);
  }
  
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0]; // Use first sheet
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  const testCases: TestCase[] = data.map((row: any, index: number) => {
    return {
      id: row.ID || row.id || `test-${index + 1}`,
      title: row.Title || row.title || row['Test Case'] || `Test Case ${index + 1}`,
      description: row.Description || row.description || '',
      steps: row.Steps || row.steps || row['Test Steps'] || '',
      locked: false,
      executionStatus: 'never_run'
    };
  });
  
  console.log(`✅ Found ${testCases.length} test cases in Excel file`);
  return testCases;
}

// Check if test is locked
function isTestLocked(testId: string, locks: TestLock[]): boolean {
  const lock = locks.find(l => l.testId === testId);
  return lock ? lock.locked && lock.executionStatus === 'passed' : false;
}

// Lock a test after successful execution
function lockTest(testCase: TestCase, filePath: string, locks: TestLock[]): TestLock[] {
  const existingLockIndex = locks.findIndex(l => l.testId === testCase.id);
  
  const newLock: TestLock = {
    testId: testCase.id,
    title: testCase.title,
    locked: true,
    lockedAt: new Date().toISOString(),
    filePath: filePath,
    executionStatus: 'passed',
    lastExecuted: new Date().toISOString()
  };
  
  if (existingLockIndex >= 0) {
    locks[existingLockIndex] = newLock;
  } else {
    locks.push(newLock);
  }
  
  return locks;
}

// Build prompt for LLM
function buildPrompt(testCase: TestCase): string {
  return [
    'Write a Playwright test function. Use this exact format:',
    '',
    `test('${testCase.title}', async ({ page }) => {`,
    '  test.setTimeout(120000);',
    '  await page.goto("https://nada-hei.onrender.com/");',
    '  // Add your automation steps here',
    '});',
    '',
    'CRITICAL RULES:',
    '1. ONLY return valid TypeScript code',
    '2. NO explanatory text outside the test function',
    '3. NO comments or descriptions between functions', 
    '4. NO narrative text or instructions in output',
    '5. Use // for comments INSIDE the function only',
    '6. Output must be syntactically correct TypeScript',
    '7. Phone numbers: use 555123XXXX format (10 digits, no spaces)',
    '8. Use proven working selectors from lessons-learned.txt',
    '',
    'PROVEN WORKING PATTERNS:',
    '- Contact form: getByPlaceholder("Enter First Name")',
    '- Property form: getByPlaceholder("Enter home value")',
    '- Material-UI dropdowns: locator("[role=\\"combobox\\"]").click()',
    '- Navigation: waitForURL("**/apply/PAGENAME", {timeout: 30000})',
    '- Phone format: 555123${uniqueSuffix} (10 digits)',
    '',
    'CRITICAL: ONLY use https://nada-hei.onrender.com/ - NO OTHER URLS',
    'Requirements:',
    '- Property dropdown: page.locator(\'text="Select property type"\').click(); await page.waitForTimeout(1500); page.locator(\'text="Single Family"\').click();',
    '- Radio buttons: page.locator(\'label:has-text("Yes")\').first().click();',
    '- Forms: page.getByPlaceholder("Enter...").fill("value");',
    '',
    `Steps to automate: ${testCase.steps}`,
    '',
    'Generate ONLY the test function code with NO additional explanatory text:'
  ].join('\n');
}

// Generate test file
async function generateTestFile(testCases: TestCase[], model: any): Promise<void> {
  console.log(`🚀 Generating test file for ${testCases.length} test cases`);
  
  let allScripts = 'import { test, expect } from "@playwright/test";\n\n';
  
  // Add common helper functions
  allScripts += `// Helper function for filling contact and homeshares information
async function fillContactAndHomeshares(page: any, uniqueSuffix: string) {
  const firstName = \`John\${uniqueSuffix}\`;
  const lastName = \`Smith\${uniqueSuffix}\`;
  const email = \`john.smith\${uniqueSuffix}@example.com\`;
  const mobile = \`555123\${uniqueSuffix}\`;
  
  console.log(\`Filling contact form with: \${firstName} \${lastName}, \${email}, \${mobile}\`);
  
  try {
    await page.getByLabel(/first.*name/i).fill(firstName);
    console.log('✅ First name filled');
    
    await page.getByLabel(/last.*name/i).fill(lastName);
    console.log('✅ Last name filled');
    
    await page.getByLabel(/email/i).fill(email);
    console.log('✅ Email filled');
    
    await page.getByLabel(/mobile|phone/i).fill(mobile);
    console.log('✅ Mobile filled');
    
    await page.getByRole('radio', { name: /yes/i }).first().click();
    console.log('✅ Homeshares program "Yes" selected');
    
  } catch (error) {
    console.error('❌ Error in fillContactAndHomeshares:', error);
    throw error;
  }
}

`;

  allScripts += `test.describe('Generated Test Suite - ${new Date().toLocaleDateString()}', () => {\n\n`;
  
  for (const testCase of testCases) {
    console.log(`Generating test: ${testCase.title}`);
    
    const prompt = buildPrompt(testCase);
    console.log(`\n--- Prompt Used for ${testCase.id} ---\n${prompt.substring(0, 200)}...\n`);
    
    let code = '';
    const genStart = Date.now();
    
    try {
      // Add timeout to prevent hanging - increased to 180s for slow model
      console.log(`⏱️ Starting LLM generation for ${testCase.id} (max 180s timeout)...`);
      
      const completionPromise = createCompletion(model, prompt);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('LLM generation timeout after 180s')), 180000)
      );
      
      const res = await Promise.race([completionPromise, timeoutPromise]) as any;
      const genEnd = Date.now();
      console.log(`✅ LLM generation for test case ${testCase.id} completed in ${(genEnd - genStart) / 1000}s`);
      
      if (res && res.choices && res.choices[0] && res.choices[0].message && res.choices[0].message.content) {
        code = res.choices[0].message.content;
        console.log('LLM output received');
      } else {
        console.log('No LLM output text found in result.');
        code = `test('${testCase.title}', async ({ page }) => {
  test.setTimeout(60000);
  console.log('❌ Test generation failed');
  throw new Error('Test generation failed');
});`;
      }
      
      const cleanedCode = cleanLLMOutput(code);
      allScripts += `  ${cleanedCode}\n\n`;
      
    } catch (err) {
      console.error('❌ Error generating test case:', err);
      allScripts += `  test('${testCase.title}', async ({ page }) => {
    test.setTimeout(60000);
    console.log('❌ Test generation failed');
    throw new Error('Test generation failed: ${err}');
  });\n\n`;
    }
  }
  
  allScripts += '});';
  
  const outputPath = path.join(CONFIG.generatedDir, 'excel-generated-tests.ts');
  
  // Validate generated content before writing
  const validation = CodeValidator.validateContent(allScripts, outputPath);
  if (!validation.valid) {
    console.log('❌ Generated code validation failed:');
    validation.errors.forEach(error => console.log(`   ${error}`));
    throw new Error('Generated code failed validation - preventing empty/invalid file creation');
  }
  
  // Use validated file creation
  const success = await CodeValidator.createValidatedFile(outputPath, allScripts);
  if (success) {
    console.log(`✅ Generated validated test file saved to: ${outputPath}`);
  } else {
    throw new Error('Failed to create validated test file');
  }
}

// Main generation function
async function generateFromExcel(excelFilePath: string): Promise<void> {
  CONFIG.excelFilePath = excelFilePath;
  
  console.log('🧹 Starting test generation from Excel...');
  
  // Ensure generated directory exists
  if (!fs.existsSync(CONFIG.generatedDir)) {
    fs.mkdirSync(CONFIG.generatedDir, { recursive: true });
  }
  
  // Load existing locks
  const locks = loadTestLocks();
  console.log(`📋 Loaded ${locks.length} existing test locks`);
  
  // Read test cases from Excel
  const allTestCases = readTestCasesFromExcel(excelFilePath);
  
  // Filter out locked tests
  const testCasesToGenerate = allTestCases.filter(testCase => {
    const locked = isTestLocked(testCase.id, locks);
    if (locked) {
      console.log(`🔒 Skipping locked test: ${testCase.title}`);
      return false;
    }
    return true;
  });
  
  console.log(`📊 Tests to generate: ${testCasesToGenerate.length} (${allTestCases.length - testCasesToGenerate.length} locked)`);
  
  if (testCasesToGenerate.length === 0) {
    console.log('✅ All tests are locked and passing. No generation needed.');
    return;
  }
  
  // Load and initialize model
  let model;
  try {
    const t0 = Date.now();
    console.log('Loading model...');
    model = await loadModel(CONFIG.modelName, {
      verbose: true,
      modelPath: CONFIG.modelsDir,
      nCtx: 2048
    });
    const t1 = Date.now();
    console.log(`Model loaded. (Took ${(t1 - t0) / 1000}s)`);
    
    // Generate test file
    await generateTestFile(testCasesToGenerate, model);
    
    console.log('🎉 Test generation completed!');
    console.log(`📁 Generated file: ${path.join(CONFIG.generatedDir, 'excel-generated-tests.ts')}`);
    console.log(`🔒 Locks file: ${CONFIG.locksFile}`);
    
  } catch (err) {
    console.error('❌ Error in test generation:', err);
  } finally {
    if (model) model.dispose();
  }
}

// Command line interface
if (process.argv.length < 3) {
  console.log('Usage: npm run generate-from-excel <path-to-excel-file>');
  console.log('Example: npm run generate-from-excel ./test-cases.xlsx');
  process.exit(1);
}

const excelFilePath = process.argv[2];
generateFromExcel(excelFilePath);
