# 🤖 AI Test Runner (TypeScript + Playwright + GPT4All)

This project is an **AI-powered test automation framework** that converts manual test cases into **Playwright test scripts** using GPT4All (local LLM, e.g., Mistral model). It runs the test, generates a report, and automatically opens the report if the test fails.

---

## 📁 Folder Structure

```
ai-test-runner/
├── package.json                # NPM project config and dependencies
├── tsconfig.json               # TypeScript configuration
├── test-case.txt               # Manual test case input
├── generated-test.spec.ts      # Auto-generated Playwright test
├── playwright-report/          # HTML test report
│   └── report.html
└── src/
    ├── index.ts                # Entry point
    ├── prompt.ts               # Builds the prompt for GPT4All
    ├── generator.ts            # Calls GPT4All and creates the test script
    ├── executor.ts             # Runs the test using Playwright
    ├── reporter.ts             # Generates and opens the report
    └── templates/
        └── report.ejs         # EJS template for test report
```

---

## 🚀 Features

* Converts manual test steps to Playwright code using GPT4All (Mistral model)
* Infers selectors for form fields using field labels, placeholders, or aria-labels (no manual selector inspection required)
* Supports multiple test cases in `test-case.txt`
* Uses Playwright for running tests in headed mode
* Auto-generates an HTML report (`playwright-report/report.html`)
* Automatically opens report if any test fails
* Written in TypeScript

---

## ⚙️ Prerequisites

* Node.js (v16 or later)
* npm
* Playwright installed (handled by script)
* GPT4All installed and Mistral model downloaded

---

## 📦 Setup Instructions

1. **Clone or Download the Repo**

   Unzip or clone the folder into your workspace.

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Install Playwright Browsers**

   ```bash
   npx playwright install
   ```

4. **Download Mistral Model for GPT4All**

   Download the Mistral model (e.g., `mistral-7b-instruct-v0.1.Q2_K.gguf`) and place it in your GPT4All models directory (e.g., `C:/Users/Teknotrait/gpt4all/.gpt4all/Models`).

---

## ✍️ Add Your Manual Test Case

Edit `test-case.txt` and add your steps like this:

```
Test Case: Login Functionality
Steps:
1. Open browser
2. Navigate to "https://the-internet.herokuapp.com/login"
3. Enter username "tomsmith"
4. Enter password "SuperSecretPassword!"
5. Click "Login"
6. Verify dashboard appears
```

---

## ▶️ How to Run

```bash
npx ts-node src/generator.ts
npx playwright test --headed --reporter=html
Copy-Item -Path "playwright-report\index.html" -Destination "playwright-report\report.html" -Force
```

This workflow:

* Reads all manual test cases from `test-case.txt`
* Converts each to Playwright code using GPT4All (with improved selector inference)
* Saves to `generated-test.spec.ts`
* Executes all tests in headed mode
* Generates HTML report at `playwright-report/report.html`
* Opens the report if any test fails

---

## 📄 Output

* ✅ `generated-test.spec.ts`: The Playwright test generated from your manual test cases.
* ✅ `playwright-report/report.html`: The test execution report (always up-to-date after each run).
* ✅ Report opens automatically on test failure.

---

## 💡 Customization

* Add more manual test files and loop through them.
* Hook this into CI/CD to run on PRs.
* Replace Mistral with other local LLMs if needed.
* Extend the HTML report with graphs or screenshots.

---

## 🙇‍♂️ Need Help?

Reach out to me on improvements. This is just the beginning of using AI for **autonomous testing**!

---

## 🧪 License

MIT – Free to use and extend.
