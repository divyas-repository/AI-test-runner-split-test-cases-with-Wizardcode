import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

interface TestLock {
  testId: string;
  title: string;
  locked: boolean;
  lockedAt: string;
  filePath: string;
  executionStatus: 'passed' | 'failed' | 'never_run';
  lastExecuted?: string;
  executionCount?: number;
}

class TestExecutorWithLocking {
  private locksFile = path.join(__dirname, '../test-locks.json');
  private locks: TestLock[] = [];
  
  constructor() {
    this.loadLocks();
  }
  
  private loadLocks(): void {
    try {
      if (fs.existsSync(this.locksFile)) {
        const data = fs.readFileSync(this.locksFile, 'utf-8');
        this.locks = JSON.parse(data);
        console.log(`📋 Loaded ${this.locks.length} test locks`);
      }
    } catch (error) {
      console.warn('⚠️ Could not load test locks:', error);
      this.locks = [];
    }
  }
  
  private saveLocks(): void {
    try {
      fs.writeFileSync(this.locksFile, JSON.stringify(this.locks, null, 2));
      console.log(`💾 Saved ${this.locks.length} test locks`);
    } catch (error) {
      console.error('❌ Could not save test locks:', error);
    }
  }
  
  private updateTestStatus(testFile: string, testName: string, status: 'passed' | 'failed'): void {
    const testId = this.extractTestIdFromName(testName);
    let lock = this.locks.find(l => l.testId === testId || l.title.includes(testName));
    
    if (!lock) {
      // Create new lock entry
      lock = {
        testId: testId,
        title: testName,
        locked: false,
        lockedAt: new Date().toISOString(),
        filePath: testFile,
        executionStatus: status,
        lastExecuted: new Date().toISOString(),
        executionCount: 1
      };
      this.locks.push(lock);
    } else {
      // Update existing lock
      lock.executionStatus = status;
      lock.lastExecuted = new Date().toISOString();
      lock.executionCount = (lock.executionCount || 0) + 1;
    }
    
    // Auto-lock if test passes
    if (status === 'passed') {
      lock.locked = true;
      console.log(`🔒 Auto-locked passing test: ${testName}`);
    } else {
      lock.locked = false;
      console.log(`🔓 Unlocked failing test: ${testName}`);
    }
    
    this.saveLocks();
  }
  
  private extractTestIdFromName(testName: string): string {
    // Try to extract ID from test name or generate one
    const match = testName.match(/test[-_](\d+)/i);
    if (match) return `test-${match[1]}`;
    
    // Generate ID from test name
    return testName.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 30);
  }
  
  async executeTests(testFile?: string): Promise<void> {
    console.log('🚀 Starting test execution with locking system...');
    
    const testPattern = testFile || 'generated/**/*.ts';
    
    return new Promise((resolve, reject) => {
      const playwrightProcess = spawn('npx', [
        'playwright', 'test', 
        testPattern,
        '--reporter=line',
        '--timeout=120000',
        '--workers=1'
      ], {
        stdio: 'pipe',
        shell: true
      });
      
      let output = '';
      let currentTest = '';
      
      playwrightProcess.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        console.log(text);
        
        // Parse test results
        const lines = text.split('\n');
        for (const line of lines) {
          // Detect test start
          if (line.includes('[chromium]') && line.includes('›')) {
            const testMatch = line.match(/› (.+?)(?:\s+\d+ms)?$/);
            if (testMatch) {
              currentTest = testMatch[1].trim();
            }
          }
          
          // Detect test completion
          if (line.includes('✓') && currentTest) {
            console.log(`✅ Test passed: ${currentTest}`);
            this.updateTestStatus(testPattern, currentTest, 'passed');
            currentTest = '';
          } else if (line.includes('✗') && currentTest) {
            console.log(`❌ Test failed: ${currentTest}`);
            this.updateTestStatus(testPattern, currentTest, 'failed');
            currentTest = '';
          }
        }
      });
      
      playwrightProcess.stderr.on('data', (data) => {
        const text = data.toString();
        output += text;
        console.error(text);
      });
      
      playwrightProcess.on('close', (code) => {
        console.log(`\n📊 Test execution completed with exit code: ${code}`);
        this.printLockSummary();
        
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Test execution failed with exit code ${code}`));
        }
      });
      
      playwrightProcess.on('error', (error) => {
        console.error('❌ Failed to start test execution:', error);
        reject(error);
      });
    });
  }
  
  private printLockSummary(): void {
    console.log('\n📋 Test Lock Summary:');
    console.log('========================');
    
    const lockedTests = this.locks.filter(l => l.locked);
    const unlockedTests = this.locks.filter(l => !l.locked);
    const passedTests = this.locks.filter(l => l.executionStatus === 'passed');
    const failedTests = this.locks.filter(l => l.executionStatus === 'failed');
    
    console.log(`🔒 Locked (Passing): ${lockedTests.length}`);
    console.log(`🔓 Unlocked: ${unlockedTests.length}`);
    console.log(`✅ Total Passed: ${passedTests.length}`);
    console.log(`❌ Total Failed: ${failedTests.length}`);
    
    if (lockedTests.length > 0) {
      console.log('\n🔒 Locked Tests:');
      for (const lock of lockedTests) {
        console.log(`   ✅ ${lock.title} (${lock.executionCount || 1} runs)`);
      }
    }
    
    if (failedTests.length > 0) {
      console.log('\n❌ Failed Tests (Will be regenerated next time):');
      for (const lock of failedTests) {
        console.log(`   🔓 ${lock.title}`);
      }
    }
  }
  
  listLocks(): void {
    this.printLockSummary();
    
    console.log('\n📝 Detailed Lock Information:');
    for (const lock of this.locks) {
      const status = lock.locked ? '🔒 LOCKED' : '🔓 UNLOCKED';
      const execution = lock.executionStatus === 'passed' ? '✅' : 
                       lock.executionStatus === 'failed' ? '❌' : '⏳';
      const runs = lock.executionCount || 0;
      const lastRun = lock.lastExecuted ? new Date(lock.lastExecuted).toLocaleString() : 'Never';
      
      console.log(`  ${status} ${execution} ${lock.testId}`);
      console.log(`     Title: ${lock.title}`);
      console.log(`     Runs: ${runs}, Last: ${lastRun}`);
      console.log('');
    }
  }
  
  unlockTest(testId: string): void {
    const lock = this.locks.find(l => l.testId === testId || l.title.includes(testId));
    if (lock) {
      lock.locked = false;
      this.saveLocks();
      console.log(`🔓 Unlocked test: ${lock.title}`);
    } else {
      console.log(`❌ Test not found: ${testId}`);
    }
  }
  
  unlockAllFailedTests(): void {
    const failedTests = this.locks.filter(l => l.executionStatus === 'failed');
    for (const lock of failedTests) {
      lock.locked = false;
    }
    this.saveLocks();
    console.log(`🔓 Unlocked ${failedTests.length} failed tests`);
  }
  
  clearAllLocks(): void {
    this.locks = [];
    this.saveLocks();
    console.log('🧹 Cleared all test locks');
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const executor = new TestExecutorWithLocking();
  
  try {
    switch (command) {
      case 'execute':
      case 'run':
        const testFile = args[1];
        await executor.executeTests(testFile);
        break;
        
      case 'locks':
      case 'list':
        executor.listLocks();
        break;
        
      case 'unlock':
        if (args[1]) {
          executor.unlockTest(args[1]);
        } else {
          console.log('Usage: npm run execute-with-locking unlock <testId>');
        }
        break;
        
      case 'unlock-failed':
        executor.unlockAllFailedTests();
        break;
        
      case 'clear-locks':
        executor.clearAllLocks();
        break;
        
      default:
        console.log('Test Executor with Locking System');
        console.log('=================================');
        console.log('Usage:');
        console.log('  npm run execute-with-locking run [test-file]    - Execute tests and update locks');
        console.log('  npm run execute-with-locking locks              - List all test locks');
        console.log('  npm run execute-with-locking unlock <testId>    - Unlock specific test');
        console.log('  npm run execute-with-locking unlock-failed     - Unlock all failed tests');
        console.log('  npm run execute-with-locking clear-locks       - Clear all locks');
        console.log('');
        console.log('Examples:');
        console.log('  npm run execute-with-locking run');
        console.log('  npm run execute-with-locking run generated/excel-generated-tests.ts');
        console.log('  npm run execute-with-locking locks');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { TestExecutorWithLocking };
