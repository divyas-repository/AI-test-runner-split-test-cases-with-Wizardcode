import path from 'path';
import { loadModel, createCompletion } from 'gpt4all';
import fs from 'fs';
import { CodeValidator } from './code-validator';
import { buildEnhancedLLMPrompt, extractSuccessfulPatterns, saveTrainingPatterns } from './enhanced-llm-trainer';
import { UNIFIED_LLM_CONFIG, getModelPath, getModelName, getConfigSummary } from './unified-llm-config';

/**
 * Missing Test Case Implementation Generator
 * 
 * Generates implementations for test cases 7-14 using LLM
 * while preserving locked test cases 1-6
 */

interface TestCase {
  id: string;
  title: string;
  description: string;
  steps: string;
  currentImplementation?: string;
}

// Configuration - UNIFIED MODEL
const CONFIG = UNIFIED_LLM_CONFIG.paths;

// Test cases that need implementation
const MISSING_TEST_CASES: TestCase[] = [
  {
    id: 'test-case-7',
    title: 'Test Case 7 - Address Information',
    description: 'Verify user can enter address information',
    steps: '1. Navigate to address page 2. Enter property address 3. Validate address format'
  },
  {
    id: 'test-case-8',
    title: 'Test Case 8 - Employment Information',
    description: 'Verify user can enter employment details',
    steps: '1. Navigate to employment page 2. Fill employment information 3. Proceed to next step'
  },
  {
    id: 'test-case-9',
    title: 'Test Case 9 - Income Verification',
    description: 'Verify user can provide income verification',
    steps: '1. Navigate to income page 2. Enter income details 3. Upload supporting documents'
  },
  {
    id: 'test-case-10',
    title: 'Test Case 10 - Document Upload',
    description: 'Verify user can upload required documents',
    steps: '1. Navigate to document upload page 2. Upload required files 3. Validate upload success'
  },
  {
    id: 'test-case-11',
    title: 'Test Case 11 - Application Review',
    description: 'Verify user can review application before submission',
    steps: '1. Navigate to review page 2. Review all entered information 3. Make corrections if needed'
  },
  {
    id: 'test-case-12',
    title: 'Test Case 12 - Background Check',
    description: 'Verify background check process integration',
    steps: '1. Complete application 2. Initiate background check 3. Monitor status'
  },
  {
    id: 'test-case-13',
    title: 'Test Case 13 - Final Verification',
    description: 'Verify final verification steps',
    steps: '1. Complete all previous steps 2. Perform final verification 3. Confirm details'
  },
  {
    id: 'test-case-14',
    title: 'Test Case 14 - Application Submission',
    description: 'Verify successful application submission',
    steps: '1. Complete all form sections 2. Submit application 3. Receive confirmation'
  }
];

// Read current test file to extract working patterns
function extractWorkingPatterns(): string {
  const testContent = fs.readFileSync(CONFIG.testFile, 'utf8');
  
  // Extract the working helper function and successful test patterns
  const patterns = [];
  
  // Extract helper function
  const helperMatch = testContent.match(/async function fillContactAndHomeshares[\s\S]*?^}/m);
  if (helperMatch) {
    patterns.push('Working helper function pattern:');
    patterns.push(helperMatch[0]);
  }
  
  // Extract successful test case patterns (Test Cases 1-6)
  const testCase2Match = testContent.match(/test\('Test Case 2[\s\S]*?^\s*}\);/m);
  if (testCase2Match) {
    patterns.push('Working test implementation pattern:');
    patterns.push(testCase2Match[0]);
  }
  
  return patterns.join('\\n\\n');
}

// Build LLM prompt for implementation using enhanced training
function buildImplementationPrompt(testCase: TestCase, workingPatterns: string): string {
  console.log('🧠 Using enhanced LLM training with comprehensive assertion patterns');
  return buildEnhancedLLMPrompt(testCase, workingPatterns);
}

// Generate implementation for a single test case
async function generateTestImplementation(testCase: TestCase): Promise<string> {
  console.log(`\\n🤖 Generating implementation for: ${testCase.title}`);
  
  try {
    // Load model using unified configuration
    console.log('📥 Loading AI model...');
    console.log(getConfigSummary());
    const modelPath = getModelPath();
    const model = await loadModel(getModelName(), { 
      modelPath: path.dirname(modelPath),
      allowDownload: false 
    });
    
    // Get working patterns
    const workingPatterns = extractWorkingPatterns();
    
    // Build prompt
    const prompt = buildImplementationPrompt(testCase, workingPatterns);
    
    // Generate implementation
    console.log('✨ Generating implementation...');
    const response = await createCompletion(model, prompt);
    
    let implementation = response.choices[0].message.content;
    
    // Clean up the response
    implementation = implementation.replace(/```[a-zA-Z]*|```/g, '');
    implementation = implementation.trim();
    
    // Ensure it starts with test function
    if (!implementation.startsWith('test(')) {
      const testStart = implementation.indexOf("test('");
      if (testStart > -1) {
        implementation = implementation.substring(testStart);
      }
    }
    
    // Dispose model
    model.dispose();
    
    console.log(`✅ Implementation generated for ${testCase.title}`);
    return implementation;
    
  } catch (error) {
    console.error(`❌ Failed to generate implementation for ${testCase.title}:`, error);
    return `
test('${testCase.title}', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto("https://nada-hei.onrender.com/");
  console.log('⚠️ ${testCase.title} - LLM generation failed, manual implementation needed');
  // TODO: Implement ${testCase.steps}
});`;
  }
}

// Read current test file and replace placeholder implementations
async function implementMissingTestCases(): Promise<void> {
  console.log('🚀 Starting implementation generation for test cases 7-14...');
  
  // Read current test file
  let testFileContent = fs.readFileSync(CONFIG.testFile, 'utf8');
  
  // Generate implementations for each missing test case
  for (const testCase of MISSING_TEST_CASES) {
    try {
      const implementation = await generateTestImplementation(testCase);
      
      // Find and replace the placeholder implementation
      const placeholderPattern = new RegExp(
        `test\\('${testCase.title.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}'[\\s\\S]*?console\\.log\\('⚠️[^']*'\\);[\\s\\S]*?\\}\\);`,
        'g'
      );
      
      if (placeholderPattern.test(testFileContent)) {
        testFileContent = testFileContent.replace(placeholderPattern, implementation);
        console.log(`✅ Replaced placeholder for ${testCase.title}`);
      } else {
        console.log(`⚠️ Could not find placeholder for ${testCase.title}`);
      }
      
      // Add delay between generations to avoid overwhelming the model
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ Failed to implement ${testCase.title}:`, error);
    }
  }
  
  // Validate the updated content
  const validation = CodeValidator.validateContent(testFileContent, CONFIG.testFile);
  if (!validation.valid) {
    console.log('❌ Generated implementations failed validation:');
    validation.errors.forEach(error => console.log(`   ${error}`));
    throw new Error('Generated implementations failed validation');
  }
  
  // Create backup of original file
  const backupPath = CONFIG.testFile + '.backup.' + Date.now();
  fs.copyFileSync(CONFIG.testFile, backupPath);
  console.log(`📋 Backup created: ${path.basename(backupPath)}`);
  
  // Write updated content
  const success = await CodeValidator.createValidatedFile(CONFIG.testFile, testFileContent);
  if (success) {
    console.log('✅ Updated test file with new implementations');
    
    // Update test locks for newly implemented tests
    updateTestLocks();
    
  } else {
    throw new Error('Failed to write updated test file');
  }
}

// Update test locks to mark new implementations as unlocked for testing
function updateTestLocks(): void {
  const locksPath = CONFIG.locksFile;
  
  if (fs.existsSync(locksPath)) {
    const locks = JSON.parse(fs.readFileSync(locksPath, 'utf8'));
    
    // Update status for test cases 7-14
    locks.forEach((lock: any) => {
      if (lock.testId.match(/test-case-(7|8|9|1[0-4])/)) {
        lock.executionStatus = 'pending_test';
        lock.lastGenerated = new Date().toISOString();
      }
    });
    
    fs.writeFileSync(locksPath, JSON.stringify(locks, null, 2));
    console.log('✅ Updated test locks for new implementations');
  }
}

// Main execution
export async function generateMissingImplementations(): Promise<void> {
  try {
    await implementMissingTestCases();
    
    console.log('\\n🎉 Implementation generation completed!');
    console.log('\\n📋 Next Steps:');
    console.log('1. Review the generated implementations');
    console.log('2. Run tests to verify they work: npx playwright test excel-generated-tests-clean.spec.ts --headed');
    console.log('3. Refine implementations as needed');
    console.log('4. Lock successful implementations using the locking system');
    console.log('\\n💡 Run: npm run status-report to check current status');
    
  } catch (error) {
    console.error('❌ Implementation generation failed:', error);
    process.exit(1);
  }
}

// CLI interface
if (require.main === module) {
  generateMissingImplementations().catch(console.error);
}
