"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReport = generateReport;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const ejs_1 = __importDefault(require("ejs"));
const open_1 = __importDefault(require("open"));
async function generateReport(output, success) {
    const reportDir = path_1.default.resolve('playwright-report');
    const reportPath = path_1.default.join(reportDir, 'report.html');
    if (!fs_1.default.existsSync(reportDir)) {
        fs_1.default.mkdirSync(reportDir, { recursive: true });
    }
    const html = await ejs_1.default.renderFile('src/templates/report.ejs', {
        result: success ? '✅ Passed' : '❌ Failed',
        logs: output,
    });
    fs_1.default.writeFileSync(reportPath, html);
    console.log(`✔ Report generated: ${reportPath}`);
    if (!success) {
        console.log('❗ Opening report due to test failure...');
        await (0, open_1.default)(reportPath);
    }
}
