import fs from 'fs';
import path from 'path';
import ejs from 'ejs';
import open from 'open';

export async function generateReport(output: string, success: boolean) {
  const reportDir = path.resolve('playwright-report');
  const reportPath = path.join(reportDir, 'report.html');

  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const html = await ejs.renderFile('src/templates/report.ejs', {
    result: success ? '✅ Passed' : '❌ Failed',
    logs: output,
  });

  fs.writeFileSync(reportPath, html);
  console.log(`✔ Report generated: ${reportPath}`);

  if (!success) {
    console.log('❗ Opening report due to test failure...');
    await open(reportPath);
  }
}
