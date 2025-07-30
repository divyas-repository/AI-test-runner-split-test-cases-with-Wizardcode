"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPrompt = buildPrompt;
function buildPrompt(manualTest) {
    return `
You are a test automation engineer.

Convert the following manual test case into a Playwright test in TypeScript.
Only return raw valid code. Do not include explanation or markdown.

Manual Test Case:
${manualTest}
  `.trim();
}
