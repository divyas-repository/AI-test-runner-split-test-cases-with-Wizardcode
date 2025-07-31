export function buildPrompt(manualTest: string): string {
  return `
You are a test automation engineer.

Convert the following manual test case into a Playwright test in TypeScript.
Only return raw valid code. Do not include explanation or markdown.
If you do not know the exact selector for a field, infer it using the field label (e.g., use getByLabel, getByPlaceholder, or a text selector).
If the field is not found by name, try common alternatives (label, placeholder, aria-label, etc.).

Manual Test Case:
${manualTest}
  `.trim();
}
