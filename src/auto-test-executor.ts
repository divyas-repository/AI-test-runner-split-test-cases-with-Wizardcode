#!/usr/bin/env ts-node

import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import open from 'open';

interface TestExecutionConfig {
  testFile?: string;
  headed?: boolean;
  timeout?: number;
  workers?: number;
  autoOpenReport?: boolean;
  generateCleanup?: boolean;
}

class AutoTestExecutor {
  private projectRoot: string;
  private config: TestExecutionConfig;

  constructor(projectRoot: string = process.cwd(), config: TestExecutionConfig = {}) {
    this.projectRoot = projectRoot;
    this.config = {
      testFile: 'generated/excel-generated-tests-clean.spec.ts',
      headed: false,
      timeout: 120000,
      workers: 1,
      autoOpenReport: true,
      generateCleanup: true,
      ...config
    };
  }

  async executeTests(): Promise<void> {
    console.log('🚀 Starting automated test execution with HTML reporting...');
    
    try {
      // Pre-execution cleanup if enabled
      if (this.config.generateCleanup) {
        await this.runCleanup();
      }

      // Build Playwright command
      const playwrightCmd = this.buildPlaywrightCommand();
      console.log(`🎭 Executing: ${playwrightCmd}`);

      // Execute tests with HTML reporter
      await this.runPlaywrightTests(playwrightCmd);

      // Post-execution actions
      await this.handlePostExecution();

    } catch (error) {
      console.error('❌ Test execution failed:', error);
      throw error;
    }
  }

  private buildPlaywrightCommand(): string {
    const baseCmd = 'npx playwright test';
    const testFile = this.config.testFile;
    const reporter = '--reporter=html';
    const timeout = `--timeout=${this.config.timeout}`;
    const workers = `--workers=${this.config.workers}`;
    const headed = this.config.headed ? '--headed' : '';

    return `${baseCmd} ${testFile} ${reporter} ${timeout} ${workers} ${headed}`.trim();
  }

  private async runPlaywrightTests(command: string): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('\n📋 Test execution started...');
      
      const process = spawn('npx', [
        'playwright', 'test',
        this.config.testFile!,
        '--reporter=html',
        `--timeout=${this.config.timeout}`,
        `--workers=${this.config.workers}`,
        ...(this.config.headed ? ['--headed'] : [])
      ], {
        cwd: this.projectRoot,
        stdio: 'inherit',
        shell: true
      });

      process.on('close', (code) => {
        if (code === 0) {
          console.log('\n✅ Tests completed successfully!');
          resolve();
        } else {
          console.log(`\n⚠️  Tests completed with exit code: ${code}`);
          // Don't reject on test failures, we still want to show the report
          resolve();
        }
      });

      process.on('error', (error) => {
        console.error('\n❌ Process execution error:', error);
        reject(error);
      });
    });
  }

  private async runCleanup(): Promise<void> {
    console.log('🧹 Running pre-execution cleanup...');
    try {
      execSync('npm run auto-cleanup', { 
        cwd: this.projectRoot, 
        stdio: 'pipe' 
      });
      console.log('✅ Cleanup completed');
    } catch (error) {
      console.warn('⚠️  Cleanup warning (continuing anyway):', error);
    }
  }

  private async handlePostExecution(): Promise<void> {
    console.log('\n📊 Processing test results...');

    // Check if HTML report was generated
    const reportPath = path.join(this.projectRoot, 'playwright-report', 'index.html');
    
    if (fs.existsSync(reportPath)) {
      console.log('✅ HTML report generated successfully');
      
      // Generate summary
      this.generateExecutionSummary();
      
      // Auto-open report if enabled
      if (this.config.autoOpenReport) {
        await this.openHTMLReport();
      }
    } else {
      console.warn('⚠️  HTML report not found at expected location');
    }
  }

  private generateExecutionSummary(): void {
    const timestamp = new Date().toISOString();
    const summaryPath = path.join(this.projectRoot, 'test-execution-summary.json');
    
    const summary = {
      timestamp,
      testFile: this.config.testFile,
      configuration: this.config,
      reportLocation: 'playwright-report/index.html',
      status: 'completed'
    };

    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log('📄 Execution summary saved to test-execution-summary.json');
  }

  private async openHTMLReport(): Promise<void> {
    try {
      console.log('🌐 Opening HTML report in browser...');
      
      // First try to start the report server
      const process = spawn('npx', ['playwright', 'show-report'], {
        cwd: this.projectRoot,
        stdio: 'pipe',
        shell: true,
        detached: true
      });

      // Give the server time to start
      setTimeout(async () => {
        try {
          await open('http://localhost:9323');
          console.log('✅ HTML report opened at http://localhost:9323');
        } catch (error) {
          console.warn('⚠️  Could not auto-open browser, but report server is running');
          console.log('💡 Manual access: http://localhost:9323');
        }
      }, 2000);

    } catch (error) {
      console.warn('⚠️  Could not start report server:', error);
      console.log('💡 Manual command: npx playwright show-report');
    }
  }

  // Static method for quick execution
  static async runMain(options: TestExecutionConfig = {}): Promise<void> {
    const executor = new AutoTestExecutor(process.cwd(), options);
    await executor.executeTests();
  }

  // Static method for headed execution
  static async runMainHeaded(options: TestExecutionConfig = {}): Promise<void> {
    const executor = new AutoTestExecutor(process.cwd(), { 
      ...options, 
      headed: true 
    });
    await executor.executeTests();
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const headed = args.includes('--headed') || args.includes('-h');
  const noReport = args.includes('--no-report');
  const noCleanup = args.includes('--no-cleanup');

  const config: TestExecutionConfig = {
    headed,
    autoOpenReport: !noReport,
    generateCleanup: !noCleanup
  };

  try {
    await AutoTestExecutor.runMain(config);
    
    console.log('\n🎉 Test execution pipeline completed!');
    console.log('💡 Available commands:');
    console.log('   - npm run test-main: Run tests with HTML report');
    console.log('   - npm run test-main-headed: Run tests in headed mode');
    console.log('   - npm run show-report: Open existing report');
    
  } catch (error) {
    console.error('❌ Execution pipeline failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { AutoTestExecutor, TestExecutionConfig };
