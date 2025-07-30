"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTest = runTest;
const child_process_1 = require("child_process");
function runTest() {
    return new Promise((resolve) => {
        (0, child_process_1.exec)('npx playwright test generated-test.spec.ts --headed', (error, stdout, stderr) => {
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
