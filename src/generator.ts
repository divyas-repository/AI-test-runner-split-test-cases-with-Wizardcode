import fs from 'fs';
import { CodeValidator } from './code-validator';
import path from 'path';
import { createCompletion, loadModel } from 'gpt4all';
import { buildPrompt } from './prompt';

const testCasePath = path.join(__dirname, '../test-case.txt');
if (!fs.existsSync(testCasePath)) {
  console.error(`❌ Test case file not found: ${testCasePath}`);
  process.exit(1);
}
const testCase = fs.readFileSync(testCasePath, 'utf-8');

export async function generateTestScript() {
  const model = await loadModel('mistral-7b-instruct-v0.1.Q2_K.gguf', {
    verbose: true,
    modelPath: path.join(__dirname, '../Models'),
    nCtx: 2048
  });
  try {
    const prompt = buildPrompt(testCase);
    console.log('Sending prompt to model...');
    const res = await createCompletion(model, prompt);
    const outputPath = path.join(__dirname, '../generated-test.spec.ts');
    
    const generatedContent = res.choices[0].message.content;
    
    // Validate generated content before writing
    const validation = CodeValidator.validateContent(generatedContent, outputPath);
    if (!validation.valid) {
      console.log('❌ Generated code validation failed:');
      validation.errors.forEach(error => console.log(`   ${error}`));
      throw new Error('Generated code failed validation - preventing empty/invalid file creation');
    }
    
    // Use validated file creation
    const success = await CodeValidator.createValidatedFile(outputPath, generatedContent);
    if (success) {
      console.log(`✅ Generated validated test case saved to: ${outputPath}`);
    } else {
      throw new Error('Failed to create validated test file');
    }
  } catch (err) {
    console.error('❌ Error generating test case:', err);
  } finally {
    model.dispose();
    console.log('Model disposed.');
  }
}
