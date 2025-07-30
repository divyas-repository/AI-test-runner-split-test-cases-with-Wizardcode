"use strict";
const fs = require('fs');
const path = require('path');
const { GPT4All } = require('gpt4all');
module.exports = { generateTestScript };
// your logic here
// Path to the test case file
const testCasePath = path.join(__dirname, '../test-case.txt');
// Load test case content
const testCase = fs.readFileSync(testCasePath, 'utf-8');
// Path to your Mistral model
const model = new GPT4All('mistral-7b-instruct-v0.1.Q2_K.gguf', {
    modelPath: 'C:/Users/Teknotrait/gpt4all/.gpt4all/Models',
    verbose: true // optional, helpful for debugging
});
async function generateTestScript() {
    console.log('Initializing model...');
    await model.init();
    const prompt = `Convert the following manual test case to an automated Playwright test script in TypeScript:\n\n${testCase}`;
    console.log('Sending prompt to model...');
    const response = await model.prompt(prompt);
    // Output response
    const outputPath = path.join(__dirname, '../generated-test-case.ts');
    fs.writeFileSync(outputPath, response);
    console.log(`✅ Generated test case saved to: ${outputPath}`);
    await model.close();
}
generateTestScript().catch((err) => {
    console.error('❌ Error generating test case:', err);
});
module.exports = { generateTestScript };
