import path from 'path';
import fs from 'fs';
import { loadModel, createCompletion } from 'gpt4all';
import { CodeValidator } from './code-validator';
import { UNIFIED_LLM_CONFIG, getModelPath, getModelName, getConfigSummary } from './unified-llm-config';

/**
 * Automatic CSV Test Generator
 * 
 * Features:
 * 1. Automatically detects all CSV files in the project
 * 2. Generates automation scripts with matching names
 * 3. Maintains mapping between CSV files and generated scripts
 * 4. Validates generated code to prevent empty/invalid files
 * 5. Creates descriptive file names for easy identification
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

// Configuration - UNIFIED MISTRAL MODEL FOR ALL GENERATORS
const CONFIG = UNIFIED_LLM_CONFIG.paths;

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
        // Skip node_modules, .git, and other system directories
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
  
  // Find column indices
  const idIndex = headers.findIndex(h => h.includes('id'));
  const titleIndex = headers.findIndex(h => h.includes('title') || h.includes('name'));
  const descIndex = headers.findIndex(h => h.includes('description') || h.includes('desc'));
  const stepsIndex = headers.findIndex(h => h.includes('steps') || h.includes('step'));
  
  if (idIndex === -1 || titleIndex === -1) {
    throw new Error(`CSV file ${csvPath} must have 'id' and 'title' columns. Found: ${headers.join(', ')}`);
  }
  
  console.log(`📊 Column mapping: id=${idIndex}, title=${titleIndex}, desc=${descIndex}, steps=${stepsIndex}`);
  
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

// Create prompt for LLM
function buildPrompt(testCases: TestCase[], csvFileName: string): string {
  const testCasesList = testCases.map(tc => 
    `- ${tc.id}: ${tc.title}\n  Description: ${tc.description}\n  Steps: ${tc.steps}`
  ).join('\n\n');

  return `Generate a comprehensive Playwright TypeScript test automation script for the following test cases from ${csvFileName}:

${testCasesList}

Requirements:
1. Use Playwright test framework with TypeScript
2. Include proper imports: import { test, expect } from "@playwright/test";
3. Create helper functions for common operations
4. Each test case should be a separate test() function
5. Use descriptive test names matching the CSV titles
6. Include proper error handling and logging
7. Set reasonable timeouts (120000ms for complex tests)
8. Use dynamic data generation to avoid conflicts
9. Target application: https://nada-hei.onrender.com/
10. Include console.log statements for debugging

Generate clean, production-ready Playwright test code:`;
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
    // Parse CSV file
    const testCases = parseCSVFile(csvPath);
    console.log(`📋 Found ${testCases.length} test cases`);
    
    // Generate script name
    const scriptName = generateScriptName(csvPath);
    const outputPath = path.join(CONFIG.generatedDir, scriptName);
    
    // Load LLM model using unified configuration
    console.log('🤖 Loading AI model...');
    console.log(getConfigSummary());
    const modelPath = getModelPath();
    const model = await loadModel(getModelName(), { 
      modelPath: path.dirname(modelPath),
      allowDownload: false 
    });
    
    // Generate automation script
    console.log('✨ Generating automation script...');
    const prompt = buildPrompt(testCases, path.basename(csvPath));
    const response = await createCompletion(model, prompt);
    
    // Clean and validate generated code
    let generatedCode = response.choices[0].message.content;
    generatedCode = cleanLLMOutput(generatedCode);
    
    // Validate generated content before writing
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
    
    // Dispose model
    model.dispose();
    
    console.log(`✅ Generated automation script: ${scriptName}`);
    return outputPath;
    
  } catch (error) {
    console.error(`❌ Error processing ${csvPath}:`, error);
    throw error;
  }
}

// Clean LLM output
function cleanLLMOutput(code: string): string {
  code = code.replace(/```[a-zA-Z]*|```/g, '');
  code = code.split('\n').filter(line => {
    const trimmed = line.trim();
    return trimmed && 
           !trimmed.startsWith('//') && 
           !trimmed.includes('Note:') && 
           !trimmed.includes('Remember:');
  }).join('\n');
  
  if (!code.includes('import { test, expect }')) {
    code = `import { test, expect } from "@playwright/test";\n\n${code}`;
  }
  
  return code.trim();
}

// Main function to process all CSV files
export async function processAllCSVFiles(): Promise<void> {
  console.log('🚀 Starting automatic CSV test generation...\n');
  
  ensureDirectories();
  
  // Find all CSV files
  const csvFiles = findCSVFiles();
  
  if (csvFiles.length === 0) {
    console.log('📂 No CSV files found in the project');
    return;
  }
  
  console.log(`📊 Found ${csvFiles.length} CSV file(s):`);
  csvFiles.forEach(file => console.log(`   - ${path.relative(CONFIG.projectRoot, file)}`));
  
  // Load existing mappings
  const mappings = loadMappings();
  const updatedMappings: CSVMapping[] = [];
  
  // Process each CSV file
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
  
  // Save mappings
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
  }
}

// CLI interface
if (require.main === module) {
  processAllCSVFiles().catch(console.error);
}
