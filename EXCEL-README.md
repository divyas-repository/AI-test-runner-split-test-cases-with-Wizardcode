# Excel Test Case Format

This document describes the expected format for Excel/CSV files containing test cases.

## Required Columns

1. **Test Case Name** - Descriptive name for the test
2. **Test Steps** - Step-by-step instructions for the test
3. **Expected Result** - What should happen when the test passes

## Example Format

| Test Case Name | Test Steps | Expected Result |
|---|---|---|
| Apply Now Button Test | 1. Navigate to homepage<br>2. Click Apply Now button | User should be redirected to contact form page |
| Contact Form Test | 1. Fill first name<br>2. Fill last name<br>3. Fill email<br>4. Click Next | Form should submit and advance to next step |

## Supported File Types

- `.xlsx` (Excel)
- `.csv` (Comma-separated values)

## Usage

Place your test case file in the project directory and run:

```bash
npm run generate-from-excel "your-test-file.csv"
```

The system will generate Playwright tests automatically using the LLM model.