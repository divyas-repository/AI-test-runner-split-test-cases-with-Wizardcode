# AI Test Runner

An automated test generation system using LLM (Mistral-7b-instruct) to create Playwright tests from Excel/CSV test cases.

## Features

- **LLM-Powered Test Generation**: Uses Mistral-7b-instruct model to generate TypeScript/Playwright tests
- **Excel/CSV Input**: Reads test cases from Excel files or CSV files
- **Test Locking**: Prevents regeneration of successful tests
- **Smart Retry**: Automatically retries failed test generation
- **URL Validation**: Ensures tests only use the correct application URL

## Usage

```bash
# Generate tests from Excel/CSV file
npm run generate-from-excel "path/to/your/test-cases.csv"

# Run generated tests
npx playwright test generated/ --reporter=line --timeout=120000
```

## Project Structure

- `src/excel-generator.ts` - Main LLM test generation engine
- `src/retry-generator.ts` - Retry mechanism for failed tests
- `src/simple-lock-manager.ts` - Test locking system
- `generated/` - Generated test files
- `lessons-learned.txt` - LLM training patterns and fixes

## Requirements

- Node.js
- TypeScript
- Playwright
- Local LLM model (Mistral-7b-instruct-v0.1.Q2_K.gguf)