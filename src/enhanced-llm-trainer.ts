import path from 'path';
import fs from 'fs';

/**
 * Enhanced LLM Training System
 * 
 * Trains the LLM with successful patterns and best practices
 * learned from implementing comprehensive test assertions
 */

interface TrainingPattern {
  category: string;
  description: string;
  example: string;
  bestPractices: string[];
}

// Configuration
const CONFIG = {
  trainingPatternsFile: path.join(__dirname, '../training-patterns.json'),
  testFile: path.join(__dirname, '../excel-generated-tests-clean.spec.ts'),
  locksFile: path.join(__dirname, '../test-locks.json')
};

/**
 * Enhanced training patterns based on successful implementations
 */
const ENHANCED_TRAINING_PATTERNS: TrainingPattern[] = [
  {
    category: "URL Navigation Assertions",
    description: "Always assert URL changes to verify navigation",
    example: `// Navigate and assert URL change
await page.getByRole('button', { name: /apply.*now/i }).first().click();
await page.waitForURL('**/apply/contact', { timeout: 30000 });
await expect(page).toHaveURL(/.*\\/apply\\/contact/);
console.log('✅ Assertion: Successfully navigated to contact page');`,
    bestPractices: [
      "Use expect(page).toHaveURL() for every navigation",
      "Wait for URL change before asserting",
      "Use regex patterns for flexible URL matching",
      "Log successful assertions for debugging"
    ]
  },
  {
    category: "Field Value Assertions",
    description: "Verify field values after filling forms",
    example: `// Fill field and assert value
const fieldLocator = page.getByPlaceholder(/home.*value/i);
await fieldLocator.fill('500000');
await expect(fieldLocator).toHaveValue('500000');
console.log('✅ Assertion: Home value filled and verified: 500000');`,
    bestPractices: [
      "Assert field values immediately after filling",
      "Use expect().toHaveValue() for input verification",
      "Store field locators in variables for reuse",
      "Include actual values in assertion logs"
    ]
  },
  {
    category: "Element Visibility Assertions",
    description: "Verify elements are visible before interaction",
    example: `// Check visibility before interaction
const submitButton = page.getByRole('button', { name: /submit/i });
await expect(submitButton).toBeVisible();
await expect(submitButton).toBeEnabled();
console.log('✅ Assertion: Submit button is visible and enabled');`,
    bestPractices: [
      "Use expect().toBeVisible() before clicking elements",
      "Check element enabled state when relevant",
      "Assert element count when dealing with lists",
      "Verify element text content when important"
    ]
  },
  {
    category: "Dynamic Data Generation",
    description: "Use timestamps for unique test data",
    example: `// Generate unique data for each test run
const uniqueSuffix = Date.now().toString().slice(-4);
const uniqueEmail = \`test.user.\${uniqueSuffix}@example.com\`;
await page.getByPlaceholder(/email/i).fill(uniqueEmail);
console.log(\`🔧 Using unique email: \${uniqueEmail}\`);`,
    bestPractices: [
      "Always use timestamps for unique identifiers",
      "Create meaningful unique data (emails, names, etc.)",
      "Log the generated data for debugging",
      "Use consistent suffix patterns across tests"
    ]
  },
  {
    category: "Error Handling with Assertions",
    description: "Proper error handling that preserves test failure",
    example: `try {
  // Attempt form filling
  await page.getByPlaceholder(/field/i).fill('value');
  await expect(page.getByPlaceholder(/field/i)).toHaveValue('value');
  console.log('✅ Field filled successfully');
} catch (error) {
  console.log('⚠️ Field filling failed:', error.message);
  throw error; // Re-throw to fail test properly
}`,
    bestPractices: [
      "Always re-throw errors in try-catch blocks",
      "Include assertion verification in error handling",
      "Log specific error messages for debugging",
      "Don't suppress failures - let tests fail appropriately"
    ]
  },
  {
    category: "Comprehensive Form Flow",
    description: "Complete form navigation with assertions at each step",
    example: `// Complete form flow with assertions
await page.goto("https://nada-hei.onrender.com/");
await expect(page).toHaveURL(/.*nada-hei.onrender.com/);

await page.getByRole('button', { name: /apply.*now/i }).first().click();
await page.waitForURL('**/apply/contact', { timeout: 30000 });
await expect(page).toHaveURL(/.*\\/apply\\/contact/);

const uniqueSuffix = Date.now().toString().slice(-4);
await fillContactAndHomeshares(page, uniqueSuffix);

await page.getByRole('button', { name: /next/i }).click();
await page.waitForURL('**/apply/home-value', { timeout: 30000 });
await expect(page).toHaveURL(/.*\\/apply\\/home-value/);`,
    bestPractices: [
      "Assert URL at every navigation step",
      "Use helper functions for common operations",
      "Include timeouts for all waitForURL calls",
      "Verify form progression systematically"
    ]
  },
  {
    category: "Multiple Element Handling",
    description: "Handle arrays of form fields with assertions",
    example: `// Handle multiple fields with validation
const formFields = [
  { placeholder: 'First Name', value: \`John\${uniqueSuffix}\` },
  { placeholder: 'Last Name', value: \`Doe\${uniqueSuffix}\` },
  { placeholder: 'Email', value: \`test.\${uniqueSuffix}@example.com\` }
];

for (const field of formFields) {
  const fieldLocator = page.getByPlaceholder(new RegExp(field.placeholder, 'i'));
  if (await fieldLocator.isVisible()) {
    await fieldLocator.fill(field.value);
    await expect(fieldLocator).toHaveValue(field.value);
    console.log(\`✅ Assertion: \${field.placeholder} filled and verified: \${field.value}\`);
  }
}`,
    bestPractices: [
      "Use arrays for systematic field handling",
      "Check visibility before attempting to fill",
      "Assert each field value after filling",
      "Use regex for flexible placeholder matching"
    ]
  },
  {
    category: "Dropdown and Select Assertions",
    description: "Handle dropdowns with proper verification",
    example: `// Handle dropdown with assertions
await page.locator('[role="combobox"]').click();
await expect(page.locator('[role="listbox"]')).toBeVisible();
console.log('✅ Assertion: Dropdown options are visible');

await page.locator('[role="option"]').first().click();
const selectedValue = await page.locator('[role="combobox"]').textContent();
console.log(\`✅ Assertion: Selected dropdown value: \${selectedValue}\`);`,
    bestPractices: [
      "Assert dropdown opens before selecting options",
      "Verify option selection after clicking",
      "Log the selected values for debugging",
      "Handle Material-UI and standard dropdowns differently"
    ]
  },
  {
    category: "Page State Verification",
    description: "Verify page state and element counts",
    example: `// Verify page elements and state
const buttons = page.getByRole('button');
const buttonCount = await buttons.count();
await expect(buttons).toHaveCountGreaterThan(0);
console.log(\`✅ Assertion: Found \${buttonCount} buttons on page\`);

const heading = page.getByRole('heading', { name: /property|address/i });
await expect(heading).toBeVisible();
console.log('✅ Assertion: Page heading is visible');`,
    bestPractices: [
      "Count elements to verify page loaded correctly",
      "Assert presence of key page elements",
      "Use descriptive console logs for state verification",
      "Check for expected vs actual element counts"
    ]
  },
  {
    category: "Test Structure and Organization",
    description: "Proper test structure with comprehensive logging",
    example: `test('Test Case X - Descriptive Title', async ({ page }) => {
  test.setTimeout(120000);
  
  console.log('🚀 Starting: Test Case X - Descriptive Title');
  
  await page.goto("https://nada-hei.onrender.com/");
  await expect(page).toHaveURL(/.*nada-hei.onrender.com/);
  console.log('✅ Assertion: Homepage loaded');
  
  // Test implementation with assertions...
  
  console.log('✅ Test Case X completed successfully');
});`,
    bestPractices: [
      "Always set test timeout to 120000ms",
      "Start with descriptive console log",
      "Assert homepage loading first",
      "End with completion confirmation",
      "Use emoji for visual log categorization"
    ]
  }
];

/**
 * Build enhanced LLM prompt with comprehensive training
 */
function buildEnhancedLLMPrompt(testCase: any, workingPatterns: string): string {
  const trainingExamples = ENHANCED_TRAINING_PATTERNS
    .map(pattern => `
## ${pattern.category}
${pattern.description}

\`\`\`typescript
${pattern.example}
\`\`\`

Best Practices:
${pattern.bestPractices.map(practice => `- ${practice}`).join('\n')}
`).join('\n');

  return `You are an expert Playwright test automation engineer. Generate a complete, production-ready implementation for the following test case with comprehensive assertions.

## CRITICAL REQUIREMENTS - MUST FOLLOW ALL:

1. **URL Assertions**: Assert every URL navigation with expect(page).toHaveURL()
2. **Field Verification**: Assert field values after filling with expect().toHaveValue()
3. **Element Visibility**: Assert element visibility before interaction with expect().toBeVisible()
4. **Error Handling**: Use try-catch but always re-throw errors to fail tests properly
5. **Dynamic Data**: Use Date.now().toString().slice(-4) for unique test data
6. **Comprehensive Logging**: Include detailed console.log statements with ✅ and ⚠️ emojis
7. **Test Structure**: Set timeout to 120000ms, start with descriptive log, end with completion log

## ENHANCED TRAINING PATTERNS:
${trainingExamples}

## WORKING PATTERNS FROM SUCCESSFUL TESTS:
${workingPatterns}

## TEST CASE TO IMPLEMENT:
Title: ${testCase.title}
Description: ${testCase.description}
Steps: ${testCase.steps}

## APPLICATION CONTEXT:
- URL: https://nada-hei.onrender.com/
- Framework: Playwright with TypeScript
- Form Flow: Contact → Home Value → Credit Score → Address → Employment → Income → Documents → Review → Submit

## IMPLEMENTATION REQUIREMENTS:
1. Navigate through the complete form flow systematically
2. Assert URL changes at every step: await expect(page).toHaveURL(/regex/)
3. Fill all form fields with unique, realistic data
4. Verify field values after filling: await expect(field).toHaveValue(expectedValue)
5. Assert element visibility before interactions: await expect(element).toBeVisible()
6. Handle dropdowns and complex UI elements properly
7. Include comprehensive error handling with proper test failure
8. Log all successful operations and assertions
9. Use the fillContactAndHomeshares helper function for contact form
10. Generate unique data using timestamp suffixes

Generate ONLY the complete test function implementation starting with:

test('${testCase.title}', async ({ page }) => {
  test.setTimeout(120000);
  
  console.log('🚀 Starting: ${testCase.title}');

REMEMBER: Every navigation must have URL assertion, every field fill must have value assertion, every interaction must verify element visibility first.`;
}

/**
 * Extract successful patterns from locked test cases
 */
function extractSuccessfulPatterns(): string {
  try {
    const testFileContent = fs.readFileSync(CONFIG.testFile, 'utf-8');
    const locksData = JSON.parse(fs.readFileSync(CONFIG.locksFile, 'utf-8'));
    
    // Find locked and passing test cases
    const successfulTests = locksData.filter((test: any) => 
      test.locked && test.executionStatus === 'passed'
    );
    
    console.log(`Found ${successfulTests.length} successful test patterns to learn from`);
    
    // Extract implementation patterns from successful tests
    const patterns: string[] = [];
    
    successfulTests.forEach((test: any) => {
      const testRegex = new RegExp(`test\\(['"]${test.title}['"][^}]+}\\);`, 'gs');
      const matches = testFileContent.match(testRegex);
      if (matches && matches[0]) {
        patterns.push(`// ${test.title} - Successful Pattern\n${matches[0]}\n`);
      }
    });
    
    return patterns.join('\n\n');
  } catch (error) {
    console.log('Error extracting patterns:', error instanceof Error ? error.message : String(error));
    return '';
  }
}

/**
 * Save training patterns to file for future reference
 */
function saveTrainingPatterns(): void {
  try {
    const trainingData = {
      timestamp: new Date().toISOString(),
      patterns: ENHANCED_TRAINING_PATTERNS,
      successfulImplementations: extractSuccessfulPatterns(),
      lessonsLearned: [
        "URL assertions are critical for navigation verification",
        "Field value assertions prevent silent form filling failures", 
        "Element visibility checks prevent interaction errors",
        "Comprehensive error handling maintains test reliability",
        "Dynamic data generation ensures test repeatability",
        "Detailed logging enables effective debugging",
        "Systematic form flow prevents navigation issues"
      ]
    };
    
    fs.writeFileSync(CONFIG.trainingPatternsFile, JSON.stringify(trainingData, null, 2));
    console.log('✅ Training patterns saved successfully');
  } catch (error) {
    console.log('⚠️ Error saving training patterns:', error instanceof Error ? error.message : String(error));
  }
}

export { 
  buildEnhancedLLMPrompt,
  extractSuccessfulPatterns,
  saveTrainingPatterns,
  ENHANCED_TRAINING_PATTERNS
};
