#!/usr/bin/env node

/**
 * Project Cleanup Utility
 * Automatically removes empty and unused files from the project
 * Run this after any code generation to maintain clean project structure
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
  // Directories to check for cleanup
  checkDirectories: ['src', 'generated', '.vscode'],
  
  // File patterns that should be removed if empty
  cleanupPatterns: [
    '*.ts',
    '*.js', 
    '*.spec.ts',
    '*.json',
    '*.config.ts'
  ],
  
  // Files to always keep even if empty (essential config files)
  keepFiles: [
    'package.json',
    '.gitignore',
    'README.md',
    'tsconfig.json'
  ],
  
  // Patterns for files that are definitely unused/temporary
  unusedPatterns: [
    'debug-*.spec.ts',
    'temp-*.ts',
    'test-*.tmp',
    '*.bak'
  ]
};

class ProjectCleaner {
  constructor() {
    this.removedFiles = [];
    this.keptFiles = [];
  }

  /**
   * Check if file should be kept based on configuration
   */
  shouldKeepFile(filePath) {
    const fileName = path.basename(filePath);
    
    // Keep essential files
    if (CONFIG.keepFiles.includes(fileName)) {
      return true;
    }
    
    // Remove debug and temp files
    for (const pattern of CONFIG.unusedPatterns) {
      if (this.matchesPattern(fileName, pattern)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Simple pattern matching (supports * wildcard)
   */
  matchesPattern(filename, pattern) {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regex.test(filename);
  }

  /**
   * Check if file is empty (0 bytes)
   */
  isEmptyFile(filePath) {
    try {
      const stats = fs.statSync(filePath);
      return stats.isFile() && stats.size === 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clean up empty and unused files
   */
  cleanupProject() {
    console.log('🧹 Starting project cleanup...');
    
    for (const dir of CONFIG.checkDirectories) {
      if (fs.existsSync(dir)) {
        this.cleanupDirectory(dir);
      }
    }
    
    // Clean root directory files
    this.cleanupDirectory('.');
    
    this.printSummary();
  }

  /**
   * Clean up files in a specific directory
   */
  cleanupDirectory(dirPath) {
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stats = fs.statSync(fullPath);
        
        if (stats.isFile()) {
          this.processFile(fullPath);
        } else if (stats.isDirectory() && !['node_modules', '.git', 'Models'].includes(item)) {
          this.cleanupDirectory(fullPath);
          
          // Remove empty directories
          this.removeEmptyDirectory(fullPath);
        }
      }
    } catch (error) {
      console.log(`⚠️ Error cleaning directory ${dirPath}: ${error.message}`);
    }
  }

  /**
   * Process individual file for cleanup
   */
  processFile(filePath) {
    const fileName = path.basename(filePath);
    
    // Check if file should be removed
    if (!this.shouldKeepFile(filePath)) {
      this.removeFile(filePath, 'Unused file pattern');
      return;
    }
    
    // Check if file is empty
    if (this.isEmptyFile(filePath)) {
      this.removeFile(filePath, 'Empty file');
      return;
    }
    
    this.keptFiles.push(filePath);
  }

  /**
   * Remove a file and log the action
   */
  removeFile(filePath, reason) {
    try {
      fs.unlinkSync(filePath);
      this.removedFiles.push({ path: filePath, reason });
      console.log(`🗑️ Removed: ${filePath} (${reason})`);
    } catch (error) {
      console.log(`❌ Failed to remove ${filePath}: ${error.message}`);
    }
  }

  /**
   * Remove empty directories
   */
  removeEmptyDirectory(dirPath) {
    try {
      const items = fs.readdirSync(dirPath);
      if (items.length === 0) {
        fs.rmdirSync(dirPath);
        console.log(`📁 Removed empty directory: ${dirPath}`);
      }
    } catch (error) {
      // Directory not empty or other error, ignore
    }
  }

  /**
   * Print cleanup summary
   */
  printSummary() {
    console.log('\n📊 Cleanup Summary:');
    console.log(`✅ Files removed: ${this.removedFiles.length}`);
    console.log(`📄 Files kept: ${this.keptFiles.length}`);
    
    if (this.removedFiles.length > 0) {
      console.log('\n🗑️ Removed files:');
      this.removedFiles.forEach(({ path, reason }) => {
        console.log(`   ${path} - ${reason}`);
      });
    }
    
    console.log('\n🎯 Project cleanup completed!');
  }
}

// Run cleanup if called directly
if (require.main === module) {
  const cleaner = new ProjectCleaner();
  cleaner.cleanupProject();
}

module.exports = ProjectCleaner;
