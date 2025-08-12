#!/usr/bin/env node

// Quick test with just 2 test cases to see if LLM generation works
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Quick LLM test with 2 test cases...');

// Create a small test CSV with just 2 cases
const testData = `Test Case Title,Description,Steps
Apply Now Test,Test clicking Apply Now button,Click Apply Now button and verify redirection
Contact Form Test,Test filling contact form,Fill first name last name email phone and select Yes for Homeshares`;

const testFile = path.join(__dirname, '../quick-test.csv');
fs.writeFileSync(testFile, testData);

console.log('📝 Created test file with 2 cases');

try {
  // Run the generator with just 2 test cases
  execSync(`npm run generate-from-excel "${testFile}"`, { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  console.log('✅ Quick test completed!');
} catch (error) {
  console.log('❌ Quick test failed:', error.message);
} finally {
  // Cleanup
  if (fs.existsSync(testFile)) {
    fs.unlinkSync(testFile);
  }
}
