import fs from 'fs';
import path from 'path';

export interface TestLock {
  testName: string;
  filePath: string;
  locked: boolean;
  lastSuccess: Date;
  hash: string;
}

export class TestLockManager {
  private lockFile: string;
  private locks: Map<string, TestLock>;

  constructor(lockFile = 'test-locks.json') {
    this.lockFile = path.join(process.cwd(), lockFile);
    this.locks = new Map();
    this.loadLocks();
  }

  private loadLocks() {
    try {
      if (fs.existsSync(this.lockFile)) {
        const data = fs.readFileSync(this.lockFile, 'utf-8');
        const locks = JSON.parse(data);
        for (const lock of locks) {
          this.locks.set(lock.testName, {
            ...lock,
            lastSuccess: new Date(lock.lastSuccess)
          });
        }
      }
    } catch (error) {
      console.log('No existing locks file found, starting fresh');
    }
  }

  private saveLocks() {
    const locksArray = Array.from(this.locks.values());
    fs.writeFileSync(this.lockFile, JSON.stringify(locksArray, null, 2));
  }

  isLocked(testName: string): boolean {
    return this.locks.get(testName)?.locked || false;
  }

  lockTest(testName: string, filePath: string, hash: string) {
    this.locks.set(testName, {
      testName,
      filePath,
      locked: true,
      lastSuccess: new Date(),
      hash
    });
    this.saveLocks();
    console.log(`🔒 Locked test: ${testName}`);
  }

  unlockTest(testName: string) {
    const lock = this.locks.get(testName);
    if (lock) {
      lock.locked = false;
      this.saveLocks();
      console.log(`🔓 Unlocked test: ${testName}`);
    }
  }

  getLockedTestPath(testName: string): string | null {
    const lock = this.locks.get(testName);
    return lock?.locked ? lock.filePath : null;
  }

  listLocks() {
    console.log('📋 Current test locks:');
    for (const lock of this.locks.values()) {
      const status = lock.locked ? '🔒 LOCKED' : '🔓 UNLOCKED';
      console.log(`  ${status} ${lock.testName} (${lock.lastSuccess.toLocaleString()})`);
    }
  }
}
