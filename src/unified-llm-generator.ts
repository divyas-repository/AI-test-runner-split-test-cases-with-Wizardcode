import path from 'path';
import fs from 'fs';
import { loadModel, createCompletion } from 'gpt4all';
import { CodeValidator } from './code-validator';
import { UNIFIED_LLM_CONFIG, getModelPath, getModelName, getConfigSummary } from './unified-llm-config';
import { ProjectCleaner } from './auto-cleanup';

/**
 * UNIFIED LLM TEST GENERATOR
 * 
 * SINGLE GENERATOR SCRIPT - LLM ONLY
 * 
 * ✅ One generator script for everything
 * ✅ Always use LLM (NO templates, NO fallbacks)
 * ✅ Generate tests with exact same names as CSV files
 * ✅ Handle all CSV files in the project
 * 
 * This is the ONLY generator you need!
 */

interface TestCase {
  id: string;
  title: string;
  description: string;
  steps: string;
  module: string;
  feature: string;
  testData: string;
  expectedResult: string;
}

interface CSVMapping {
  csvFile: string;
  generatedScript: string;
  testCases: number;
  lastGenerated: string;
  status: 'success' | 'failed' | 'pending';
}

const CONFIG = UNIFIED_LLM_CONFIG.paths;

// Ensure directories exist
function ensureDirectories() {
  if (!fs.existsSync(CONFIG.generatedDir)) {
    fs.mkdirSync(CONFIG.generatedDir, { recursive: true });
  }
}

// Find all CSV files in the project
function findAllCSVFiles(): string[] {
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
  
  // Split CSV line considering quoted values
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
  
  console.log(`📋 Headers found: ${headers.join(', ')}`);
  
  // Find column indices - flexible mapping
  const idIndex = headers.findIndex(h => h.includes('id'));
  const titleIndex = headers.findIndex(h => h.includes('scenario') || h.includes('title') || h.includes('name'));
  const moduleIndex = headers.findIndex(h => h.includes('module'));
  const featureIndex = headers.findIndex(h => h.includes('feature'));
  const stepsIndex = headers.findIndex(h => h.includes('steps'));
  const testDataIndex = headers.findIndex(h => h.includes('test data') || h.includes('data'));
  const expectedIndex = headers.findIndex(h => h.includes('expected'));
  
  console.log(`📊 Column mapping: id=${idIndex}, title=${titleIndex}, module=${moduleIndex}, feature=${featureIndex}, steps=${stepsIndex}`);
  
  for (let i = 1; i < lines.length; i++) {
    const values = splitCSVLine(lines[i]).map(v => v.replace(/"/g, '').trim());
    
    if (values.length >= Math.max(idIndex + 1, titleIndex + 1)) {
      testCases.push({
        id: values[idIndex] || `test-${i}`,
        title: values[titleIndex] || `Test Case ${i}`,
        description: `Test case: ${values[titleIndex] || 'Test description'}`,
        steps: values[stepsIndex] || 'Test steps not specified',
        module: values[moduleIndex] || 'General',
        feature: values[featureIndex] || 'Feature Test',
        testData: values[testDataIndex] || 'Test data not specified',
        expectedResult: values[expectedIndex] || 'Expected result not specified'
      });
    }
  }
  
  return testCases;
}

// Generate script name from CSV file name - EXACTLY SAME NAME
function generateScriptName(csvPath: string): string {
  const baseName = path.basename(csvPath, '.csv');
  return `${baseName}.spec.ts`;
}

// Create comprehensive LLM prompt
function buildLLMPrompt(testCases: TestCase[], csvFileName: string): string {
  const testCasesList = testCases.map(tc => 
    `Test ID: ${tc.id}
Title: ${tc.title}
Module: ${tc.module}
Feature: ${tc.feature}
Steps: ${tc.steps}
Test Data: ${tc.testData}
Expected Result: ${tc.expectedResult}
---`
  ).join('\n\n');

  return `You are an expert Playwright TypeScript test automation engineer. Generate a comprehensive, production-ready test automation script for the following test cases from ${csvFileName}:

${testCasesList}

REQUIREMENTS:
1. Use Playwright test framework with TypeScript
2. Import: import { test, expect } from "@playwright/test";
3. Target application: https://nada-hei.onrender.com/
4. Create one test() function for each test case
5. Use descriptive test names exactly matching the CSV titles
6. Include comprehensive error handling and logging
7. Set timeout to 120000ms for all tests
8. Generate unique test data to avoid conflicts (use timestamp + random)
9. Include detailed console.log statements for debugging
10. Take screenshots on both success and failure
11. Include proper assertions using expect()
12. Handle different scenarios (login, form filling, navigation)
13. Use robust element selectors with multiple fallbacks
14. Include beforeEach and afterEach hooks
15. Add proper test documentation and comments

AUTOMATION LOGIC REQUIREMENTS:
- For login tests: Find and interact with username/email, password fields, login buttons
- For application tests: Find Apply Now buttons, form fields (first name, last name, email, phone), submit buttons
- Use dynamic selectors like: 'button:has-text("Login")', 'input[type="email"]', etc.
- Always wait for page loads: await page.waitForLoadState('networkidle');
- Generate unique data: const uniqueId = Math.random().toString(36).substring(2, 8);

Generate ONLY the complete TypeScript test file code, no explanations or markdown:`;
}

// Initialize LLM Model
async function initializeLLM(): Promise<any> {
  console.log('🤖 Initializing LLM...');
  console.log(getConfigSummary());
  
  const modelPath = getModelPath();
  const modelsDir = path.dirname(modelPath);
  const modelsJsonPath = path.join(modelsDir, 'models.json');
  
  console.log(`🔧 Model path: ${modelPath}`);
  console.log(`📋 Models config: ${modelsJsonPath}`);
  
  // Check if model file exists
  if (!fs.existsSync(modelPath)) {
    throw new Error(`Model file not found: ${modelPath}`);
  }
  
  // Check if models.json exists
  if (!fs.existsSync(modelsJsonPath)) {
    throw new Error(`Models configuration not found: ${modelsJsonPath}`);
  }
  
  try {
    // Try different initialization approaches
    console.log('🔄 Attempting to load model...');
    
    // Use the model name from config
    const modelName = getModelName();
    console.log(`🏷️ Model name: ${modelName}`);
    
    const model = await loadModel(modelName, {
      modelPath: modelsDir,
      verbose: true,
      allowDownload: false,
      device: 'cpu'
    });
    
    console.log('✅ Model loaded successfully');
    return model;
    
  } catch (error: any) {
    console.error('❌ Model loading failed:', error.message);
    throw new Error(`Failed to load LLM model: ${error.message}`);
  }
}

// Generate automation script using LLM
async function generateScriptWithLLM(csvPath: string): Promise<string> {
  console.log(`\n🔄 Processing CSV file with LLM: ${path.basename(csvPath)}`);
  
  try {
    // Parse CSV file
    const testCases = parseCSVFile(csvPath);
    console.log(`📋 Found ${testCases.length} test cases`);
    
    if (testCases.length === 0) {
      throw new Error('No test cases found in CSV file');
    }
    
    // Generate script name
    const scriptName = generateScriptName(csvPath);
    const outputPath = path.join(CONFIG.generatedDir, scriptName);
    
    // Initialize LLM
    const model = await initializeLLM();
    
    // Generate automation script using LLM
    console.log('✨ Generating automation script with LLM...');
    const prompt = buildLLMPrompt(testCases, path.basename(csvPath));
    
    console.log('🧠 Sending prompt to LLM...');
    const response = await createCompletion(model, prompt, {
      temperature: 0.3,
      topP: 0.9
    });
    
    // Extract generated code
    let generatedCode = response.choices[0].message.content;
    console.log('📝 LLM response received');
    
    // Clean LLM output
    generatedCode = cleanLLMOutput(generatedCode);
    
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
    
    // Dispose model to free memory
    model.dispose();
    
    console.log(`✅ Generated automation script: ${scriptName}`);
    return outputPath;
    
  } catch (error) {
    console.error(`❌ Error processing ${csvPath}:`, error);
    throw error;
  }
}

// Clean LLM output to extract pure code
function cleanLLMOutput(code: string): string {
  // Remove markdown code blocks
  code = code.replace(/```[a-zA-Z]*\n?|```/g, '');
  
  // Remove any explanatory text before imports
  const importIndex = code.indexOf('import');
  if (importIndex > 0) {
    code = code.substring(importIndex);
  }
  
  // Remove empty lines and comments at the beginning
  code = code.split('\n')
    .filter(line => {
      const trimmed = line.trim();
      return trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('*') && !trimmed.startsWith('/*');
    })
    .join('\n');
  
  return code.trim();
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

// Process all CSV files with LLM
async function processAllCSVFilesWithLLM(): Promise<void> {
  console.log('🚀 Starting UNIFIED LLM test generation...');
  console.log('🎯 Mode: LLM ONLY - No templates, no fallbacks');
  
  ensureDirectories();
  
  // Find all CSV files
  const csvFiles = findAllCSVFiles();
  console.log(`\n📊 Found ${csvFiles.length} CSV file(s):`);
  csvFiles.forEach(file => console.log(`   - ${path.basename(file)}`));
  
  if (csvFiles.length === 0) {
    console.log('❌ No CSV files found in the project');
    return;
  }
  
  const mappings = loadMappings();
  const results: CSVMapping[] = [];
  
  // Process each CSV file with LLM
  for (const csvPath of csvFiles) {
    const csvFileName = path.basename(csvPath);
    
    try {
      // Generate script using LLM
      const outputPath = await generateScriptWithLLM(csvPath);
      const testCases = parseCSVFile(csvPath);
      
      // Create mapping
      const mapping: CSVMapping = {
        csvFile: csvFileName,
        generatedScript: path.basename(outputPath),
        testCases: testCases.length,
        lastGenerated: new Date().toISOString(),
        status: 'success'
      };
      
      results.push(mapping);
      console.log(`✅ Successfully generated: ${mapping.generatedScript}`);
      
    } catch (error: any) {
      console.error(`❌ Failed to process ${csvFileName}:`, error.message);
      
      const mapping: CSVMapping = {
        csvFile: csvFileName,
        generatedScript: 'generation-failed',
        testCases: 0,
        lastGenerated: new Date().toISOString(),
        status: 'failed'
      };
      
      results.push(mapping);
    }
  }
  
  // Update mappings with only current results
  saveMappings(results);
  
  // Display summary
  console.log('\n📋 Generation Summary:');
  console.log('┌─────────────────────────────────────────────────────────────┐');
  console.log('│ CSV File                │ Generated Script              │ Status │');
  console.log('├─────────────────────────────────────────────────────────────┤');
  
  results.forEach(result => {
    const status = result.status === 'success' ? '✅' : '❌';
    console.log(`│ ${result.csvFile.padEnd(23)} │ ${result.generatedScript.padEnd(29)} │ ${status}    │`);
  });
  
  console.log('└─────────────────────────────────────────────────────────────┘');
  
  const successCount = results.filter(r => r.status === 'success').length;
  console.log(`\n🎉 Generation completed! ${successCount}/${results.length} files processed successfully`);
  
  // Run cleanup
  console.log('\n🧹 Running automatic cleanup...');
  const cleaner = new ProjectCleaner();
  await cleaner.cleanProject();
}

// Main execution
if (require.main === module) {
  processAllCSVFilesWithLLM()
    .then(() => {
      console.log('🎉 UNIFIED LLM test generation completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ UNIFIED LLM test generation failed:', error);
      process.exit(1);
    });
}

export { processAllCSVFilesWithLLM };
