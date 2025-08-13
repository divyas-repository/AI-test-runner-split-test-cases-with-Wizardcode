import { exec } from 'child_process';

export function runTest(): Promise<{ success: boolean; output: string }> {
  return new Promise((resolve) => {
    exec('npx playwright test generated-test.spec.ts --headed', (error, stdout, stderr) => {
      const fullOutput = stdout + stderr;
      const failedMatch = fullOutput.match(/(\d+)\s+failed/);
      const failedCount = failedMatch ? parseInt(failedMatch[1], 10) : 0;

      resolve({
        success: failedCount === 0,
        output: fullOutput,
      });
    });
  });
}
