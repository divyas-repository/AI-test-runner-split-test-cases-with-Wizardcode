#!/usr/bin/env ts-node

import fs from 'fs';
import path from 'path';

interface CleanupConfig {
  emptyFiles: boolean;
  debugFiles: boolean;
  backupFiles: boolean;
  tempFiles: boolean;
  redundantGenerated: boolean;
  unusedUtilities: boolean;
}

class ProjectCleaner {
  private projectRoot: string;
  private config: CleanupConfig;
  private deletedFiles: string[] = [];
  private protectedFiles: string[] = [
    // Core automation files
    'excel-generated-tests-clean.spec.ts',
    'package.json',
    'package-lock.json',
    'playwright.config.ts',
    'tsconfig.json',
    'README.md',
    '.gitignore',
    'test-locks.json',
    'training-patterns.json',
    'csv-mappings.json',
    'sample-test-cases.csv',
    
    // Essential source files
    'src/auto-csv-generator.ts',
    'src/template-generator.ts',
    'src/missing-test-generator.ts',
    'src/pattern-based-generator.ts',
    'src/enhanced-llm-trainer.ts',
    'src/unified-llm-config.ts',
    'src/auto-cleanup.ts', // This script itself
    
    // Working generated files
    'generated/excel-generated-tests-clean.ts',
    'generated/_Regression-TestSuite-NADA-xlsx-Automation-suite-1-automation.spec.ts'
  ];

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.config = {
      emptyFiles: true,
      debugFiles: true,
      backupFiles: true,
      tempFiles: true,
      redundantGenerated: true,
      unusedUtilities: true
    };
  }

  async cleanProject(): Promise<void> {
    console.log('🧹 Starting automated project cleanup...');
    
    try {
      if (this.config.emptyFiles) await this.removeEmptyFiles();
      if (this.config.debugFiles) await this.removeDebugFiles();
      if (this.config.backupFiles) await this.removeBackupFiles();
      if (this.config.tempFiles) await this.removeTempFiles();
      if (this.config.redundantGenerated) await this.removeRedundantGenerated();
      if (this.config.unusedUtilities) await this.removeUnusedUtilities();
      
      await this.updatePackageJsonScripts();
      
      this.printSummary();
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      throw error;
    }
  }

  private async removeEmptyFiles(): Promise<void> {
    console.log('🔍 Scanning for empty files...');
    
    const allFiles = this.getAllFiles(this.projectRoot);
    
    for (const file of allFiles) {
      const relativePath = path.relative(this.projectRoot, file);
      
      if (this.isProtected(relativePath)) continue;
      if (this.shouldIgnoreDirectory(file)) continue;
      
      try {
        const stats = fs.statSync(file);
        if (stats.isFile() && stats.size === 0) {
          this.deleteFile(file, `Empty file: ${relativePath}`);
        }
      } catch (error) {
        // File might not exist or be inaccessible
      }
    }
  }

  private getAllFiles(dir: string): string[] {
    const files: string[] = [];
    
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        
        if (this.shouldIgnoreDirectory(fullPath)) continue;
        
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory()) {
          files.push(...this.getAllFiles(fullPath));
        } else {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory might not be accessible
    }
    
    return files;
  }

  private shouldIgnoreDirectory(fullPath: string): boolean {
    const ignoredDirs = ['node_modules', '.git', 'test-results', 'playwright-report', '..bfg-report'];
    const dirName = path.basename(fullPath);
    return ignoredDirs.includes(dirName);
  }

  private async removeDebugFiles(): Promise<void> {
    console.log('🔍 Removing debug files...');
    
    const allFiles = this.getAllFiles(this.projectRoot);
    
    for (const file of allFiles) {
      const relativePath = path.relative(this.projectRoot, file);
      const fileName = path.basename(file);
      
      if (fileName.startsWith('debug-') && fileName.endsWith('.spec.ts')) {
        if (!this.isProtected(relativePath)) {
          this.deleteFile(file, `Debug file: ${relativePath}`);
        }
      }
    }
  }

  private async removeBackupFiles(): Promise<void> {
    console.log('🔍 Removing backup files...');
    
    const allFiles = this.getAllFiles(this.projectRoot);
    const backupExtensions = ['.bak', '.backup', '.old', '.orig'];
    
    for (const file of allFiles) {
      const relativePath = path.relative(this.projectRoot, file);
      const fileName = path.basename(file);
      
      if (backupExtensions.some(ext => fileName.endsWith(ext)) || fileName.endsWith('~')) {
        this.deleteFile(file, `Backup file: ${relativePath}`);
      }
    }
  }

  private async removeTempFiles(): Promise<void> {
    console.log('🔍 Removing temporary files...');
    
    const allFiles = this.getAllFiles(this.projectRoot);
    const tempExtensions = ['.tmp', '.temp'];
    
    for (const file of allFiles) {
      const relativePath = path.relative(this.projectRoot, file);
      const fileName = path.basename(file);
      
      if (tempExtensions.some(ext => fileName.endsWith(ext)) || 
          fileName.startsWith('temp-') || 
          fileName.startsWith('tmp-')) {
        this.deleteFile(file, `Temp file: ${relativePath}`);
      }
    }
  }

  private async removeRedundantGenerated(): Promise<void> {
    console.log('🔍 Removing redundant generated files...');
    
    const redundantFiles = [
      'generated/excel-generated-tests.ts',
      'generated/regenerated-tests.ts'
    ];
    
    // Check for duplicate and template files
    const generatedDir = path.join(this.projectRoot, 'generated');
    if (fs.existsSync(generatedDir)) {
      const files = fs.readdirSync(generatedDir);
      
      for (const file of files) {
        // Remove test-case-batch files
        if (file.startsWith('test-case-batch-') && file.endsWith('.ts')) {
          redundantFiles.push(`generated/${file}`);
        }
        
    // Remove sample test files
    if (file.startsWith('sample-test-cases-') && file.endsWith('.spec.ts')) {
      redundantFiles.push(`generated/${file}`);
    }
    
    // Remove any .ts files that are not .spec.ts in generated folder
    if (file.endsWith('.ts') && !file.endsWith('.spec.ts')) {
      redundantFiles.push(`generated/${file}`);
    }        // Remove duplicate automation suite files (keep only the main one)
        if (file.includes('Automation-suite-1-automation') || 
            (file.includes('Automation-suite-automation') && !file.includes('clean'))) {
          redundantFiles.push(`generated/${file}`);
        }
        
        // Remove basic template files for consumer login
        if (file.includes('Consumer-Login-automation.spec.ts')) {
          redundantFiles.push(`generated/${file}`);
        }
      }
    }
    
    for (const file of redundantFiles) {
      const fullPath = path.join(this.projectRoot, file);
      if (fs.existsSync(fullPath) && !this.isProtected(file)) {
        this.deleteFile(fullPath, `Redundant generated: ${file}`);
      }
    }
  }

  private async removeUnusedUtilities(): Promise<void> {
    console.log('🔍 Removing unused utility files...');
    
    const utilityFiles = [
      'cleanup-project.js',
      'cleanup-summary.ts',
      'llm-performance-estimator.ts',
      'model-cleanup-verification.ts',
      'file-organization-summary.ts',
      'unified-model-training.ts',
      'training-summary.ts',
      'test-status-report.js',
      'train-llm.ts',
      'lessons-learned.txt',
      'demo-tests.csv',
      'EXCEL-README.md',
      'sample-test-cases.csv'
    ];
    
    // Also remove any my-test-cases.csv folder (duplicate)
    const duplicateFolders = ['my-test-cases.csv'];
    
    utilityFiles.forEach(file => {
      const fullPath = path.join(this.projectRoot, file);
      if (fs.existsSync(fullPath) && !this.isProtected(file)) {
        this.deleteFile(fullPath, `Unused utility: ${file}`);
      }
    });
    
    duplicateFolders.forEach(folder => {
      const fullPath = path.join(this.projectRoot, folder);
      if (fs.existsSync(fullPath)) {
        try {
          fs.rmSync(fullPath, { recursive: true, force: true });
          console.log(`🗑️  Deleted: Duplicate folder: ${folder}`);
        } catch (error) {
          console.warn(`⚠️  Could not delete ${fullPath}: ${error}`);
        }
      }
    });
  }

  private async updatePackageJsonScripts(): Promise<void> {
    const packagePath = path.join(this.projectRoot, 'package.json');
    
    if (!fs.existsSync(packagePath)) return;
    
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Remove scripts for deleted utilities
    const scriptsToRemove = [
      'cleanup',
      'estimate-time',
      'unified-training',
      'verify-cleanup',
      'file-organization'
    ];
    
    scriptsToRemove.forEach(script => {
      if (packageJson.scripts && packageJson.scripts[script]) {
        delete packageJson.scripts[script];
        console.log(`📝 Removed script: ${script}`);
      }
    });
    
    // Add cleanup script
    if (!packageJson.scripts['auto-cleanup']) {
      packageJson.scripts['auto-cleanup'] = 'ts-node src/auto-cleanup.ts';
      console.log('📝 Added auto-cleanup script');
    }
    
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
  }

  private isProtected(file: string): boolean {
    const normalizedFile = file.replace(/\\/g, '/');
    return this.protectedFiles.some((protectedFile: string) => {
      const normalizedProtected = protectedFile.replace(/\\/g, '/');
      return normalizedFile === normalizedProtected || 
             normalizedFile.endsWith('/' + normalizedProtected);
    });
  }

  private deleteFile(filePath: string, reason: string): void {
    try {
      fs.unlinkSync(filePath);
      this.deletedFiles.push(filePath);
      console.log(`🗑️  Deleted: ${reason}`);
    } catch (error) {
      console.warn(`⚠️  Could not delete ${filePath}: ${error}`);
    }
  }

  private printSummary(): void {
    console.log('\n✅ Cleanup completed!');
    console.log(`📊 Summary: ${this.deletedFiles.length} files removed`);
    
    if (this.deletedFiles.length > 0) {
      console.log('\n📋 Deleted files:');
      this.deletedFiles.forEach(file => {
        const relativePath = path.relative(this.projectRoot, file);
        console.log(`   - ${relativePath}`);
      });
    }
    
    console.log('\n🛡️  Protected files maintained:');
    console.log('   - Core automation files');
    console.log('   - Essential source code');
    console.log('   - Configuration files');
    console.log('   - Working test cases');
  }
}

// CLI execution
async function main() {
  try {
    const cleaner = new ProjectCleaner();
    await cleaner.cleanProject();
    
    console.log('\n💡 Tip: Run "npm run auto-cleanup" anytime to clean the project');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { ProjectCleaner };
