export function buildPrompt(manualTest: string): string {
  return `
You are a test automation engineer.

Convert the following manual test case into a Playwright test in TypeScript.
Only return raw valid code. Do not include explanation or markdown.

Manual Test Case:
${manualTest}
  `.trim();
}
