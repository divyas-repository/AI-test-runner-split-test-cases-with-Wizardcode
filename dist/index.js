"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const executor_js_1 = require("./executor.js");
const reporter_js_1 = require("./reporter.js");
const { generateTestScript } = require('./generator');
generateTestScript();
async function main() {
    await generateTestScript('test-case.txt');
    const { success, output } = await (0, executor_js_1.runTest)();
    await (0, reporter_js_1.generateReport)(output, success);
}
main();
module.exports = { generateTestScript };
