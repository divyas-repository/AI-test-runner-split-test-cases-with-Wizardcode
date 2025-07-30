import fs from 'fs';
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
    fs.writeFileSync(outputPath, res.choices[0].message.content);
    console.log(`✅ Generated test case saved to: ${outputPath}`);
  } catch (err) {
    console.error('❌ Error generating test case:', err);
  } finally {
    model.dispose();
    console.log('Model disposed.');
  }
}
