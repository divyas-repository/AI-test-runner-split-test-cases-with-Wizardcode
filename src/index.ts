import { runTest } from './executor';
import { generateReport } from './reporter';
const { generateTestScript } = require('./generator');

generateTestScript();

async function main() {
  await generateTestScript('test-case.txt');
  const { success, output } = await runTest();
  await generateReport(output, success);
}

main();


