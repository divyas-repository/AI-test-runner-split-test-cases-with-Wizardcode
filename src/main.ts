#!/usr/bin/env ts-node

import { Command } from 'commander';
import { TestLockManager } from './simple-lock-manager';
import { ExcelTestReader } from './excel-reader';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';

const program = new Command();

program
  .name('ai-test-runner')
  .description('AI-powered test generation and execution with locking')
  .version('1.0.0');

function runCommand(command: string, args: string[] = []): Promise<{ success: boolean; output: string }> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { shell: true, stdio: 'pipe' });
    let output = '';
    
    child.stdout?.on('data', (data) => {
      output += data.toString();
      process.stdout.write(data);
    });
    
    child.stderr?.on('data', (data) => {
      output += data.toString();
      process.stderr.write(data);
    });
    
    child.on('close', (code) => {
      resolve({ success: code === 0, output });
    });
  });
}

program
  .command('from-excel')
  .description('Quick command: Excel to test generation and execution')
  .argument('<excelPath>', 'Path to Excel file, CSV file, or URL')
  .action(async (excelPath: string) => {
    console.log(`🚀 Full pipeline: Excel/CSV/URL → Batches → Ready for generation`);
    
    try {
      // Step 1: Read Excel/CSV/URL and create batches
      const testCases = await ExcelTestReader.readTestCases(excelPath);
      console.log(`📊 Found ${testCases.length} test cases`);
      
      if (testCases.length === 0) {
        console.log('❌ No test cases found. Please check your file format.');
        console.log('💡 Expected columns: "Test Name", "Description", "Step 1", "Step 2", etc.');
        console.log('💡 Or use any column names - the system will try to detect them automatically.');
        return;
      }
      
      await ExcelTestReader.writeTestCasesToBatches(testCases);
      console.log('✅ Created test case batches in split-cases/');
      
      console.log('\n🎯 Next steps:');
      console.log('- Use your existing test generation tools to create tests from the batches');
      console.log('- Run: npm run test-batch-1 or npm run test-batch-2');
      console.log('- Or use: npm start run-batch 1');
      
    } catch (error) {
      console.error('❌ Pipeline error:', (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('locks')
  .description('Manage test locks')
  .option('-l, --list', 'List all locks')
  .option('-u, --unlock <testName>', 'Unlock a specific test')
  .option('-c, --clear', 'Clear all locks')
  .action((options: any) => {
    const lockManager = new TestLockManager();
    
    if (options.list) {
      lockManager.listLocks();
    } else if (options.unlock) {
      lockManager.unlockTest(options.unlock);
    } else if (options.clear) {
      fs.writeFileSync('test-locks.json', '[]');
      console.log('🧹 Cleared all locks');
    } else {
      lockManager.listLocks();
    }
  });

program
  .command('run-batch')
  .description('Run a specific test batch')
  .argument('<batchNumber>', 'Batch number (1, 2, etc.)')
  .action(async (batchNumber: string) => {
    const testFile = `generated/test-case-batch-${batchNumber}.ts`;
    
    if (!fs.existsSync(testFile)) {
      console.log(`❌ Test file not found: ${testFile}`);
      console.log('Generate tests first using your existing generation tools');
      return;
    }
    
    console.log(`🧪 Running batch ${batchNumber}...`);
    const result = await runCommand('npx', ['playwright', 'test', testFile, '--reporter=line']);
    
    if (result.success) {
      const lockManager = new TestLockManager();
      const testName = `test-case-batch-${batchNumber}`;
      lockManager.lockTest(testName, testFile, Date.now().toString());
      console.log(`🔒 Locked successful test: ${testName}`);
    }
  });

program
  .command('generate-from-file')
  .description('Generate and run tests directly from Excel/CSV/URL')
  .argument('<filePath>', 'Path to Excel file, CSV file, or URL (including Google Sheets)')
  .option('--run', 'Run tests immediately after generation')
  .action(async (filePath: string, options: any) => {
    console.log(`🚀 Direct generation from: ${filePath}`);
    
    try {
      // Step 1: Read and create batches
      const testCases = await ExcelTestReader.readTestCases(filePath);
      console.log(`📊 Found ${testCases.length} test cases`);
      
      if (testCases.length === 0) {
        console.log('❌ No test cases found.');
        return;
      }
      
      await ExcelTestReader.writeTestCasesToBatches(testCases);
      
      // Step 2: Use your existing generation process here
      console.log('✅ Test case batches created and ready for generation');
      console.log('💡 Use your existing LLM generation tools to create the actual test files');
      
      if (options.run) {
        console.log('🏃‍♂️ Ready to run tests once generated...');
      }
      
    } catch (error) {
      console.error('❌ Error:', (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('google-sheets-help')
  .description('Show help for using Google Sheets')
  .action(() => {
    console.log('📊 Using Google Sheets with AI Test Runner\n');
    console.log('🔧 To use your Google Sheets document:');
    console.log('1. Open your Google Sheet');
    console.log('2. Click "Share" → "Anyone with the link" → "Viewer"');
    console.log('3. Copy the share link');
    console.log('4. Use: npm start from-excel "YOUR_LINK_HERE"\n');
    console.log('💡 Alternative: Download as Excel/CSV and use locally:');
    console.log('   npm start from-excel your-file.xlsx');
    console.log('   npm start from-excel your-file.csv\n');
    console.log('📋 Expected format:');
    console.log('   Test Name | Description | Step 1 | Step 2 | Step 3');
    console.log('   ----------|-------------|--------|--------|--------');
    console.log('   Login     | Test login  | Open   | Enter  | Click');
  });

program
  .command('test-google-sheet')
  .description('Test Google Sheets access and provide detailed help')
  .argument('<url>', 'Google Sheets URL')
  .action(async (url: string) => {
    console.log('🔍 Testing Google Sheets access...\n');
    
    try {
      const testCases = await ExcelTestReader.readTestCases(url);
      console.log(`🎉 SUCCESS! Found ${testCases.length} test cases`);
      
      if (testCases.length > 0) {
        console.log('\n📋 Preview of test cases:');
        testCases.slice(0, 3).forEach((tc, i) => {
          console.log(`${i + 1}. ${tc.name} - ${tc.steps.length} steps`);
        });
      }
    } catch (error) {
      console.log('❌ Failed to access Google Sheet\n');
      console.log('🔧 Please check your sharing settings:');
      console.log('1. Open your Google Sheet');
      console.log('2. Click "Share" (top right)');
      console.log('3. Under "General access" click "Restricted"');
      console.log('4. Change to "Anyone with the link"');
      console.log('5. Set role to "Viewer"');
      console.log('6. Click "Done"\n');
      console.log('💡 Alternative: Download as CSV/Excel and use locally:');
      console.log('   File → Download → Excel (.xlsx)');
      console.log('   Then: npm start from-excel your-file.xlsx\n');
      console.log(`❌ Error details: ${(error as Error).message}`);
    }
  });

program.parse();
