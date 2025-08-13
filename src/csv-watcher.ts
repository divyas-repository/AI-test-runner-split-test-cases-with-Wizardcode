import fs from 'fs';
import path from 'path';
import { processAllCSVFiles } from './auto-csv-generator';

/**
 * CSV File Watcher
 * 
 * Automatically detects when CSV files are added/modified
 * and triggers automation script generation
 */

const CONFIG = {
  projectRoot: path.join(__dirname, '..'),
  watchInterval: 5000, // Check every 5 seconds
  mappingFile: path.join(__dirname, '../csv-mappings.json')
};

interface FileInfo {
  path: string;
  mtime: number;
  size: number;
}

class CSVWatcher {
  private knownFiles: Map<string, FileInfo> = new Map();
  private watcherInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.loadKnownFiles();
  }

  // Load previously known files
  private loadKnownFiles() {
    if (fs.existsSync(CONFIG.mappingFile)) {
      try {
        const mappings = JSON.parse(fs.readFileSync(CONFIG.mappingFile, 'utf8'));
        mappings.forEach((mapping: any) => {
          const fullPath = path.join(CONFIG.projectRoot, mapping.csvFile);
          if (fs.existsSync(fullPath)) {
            const stats = fs.statSync(fullPath);
            this.knownFiles.set(fullPath, {
              path: fullPath,
              mtime: stats.mtime.getTime(),
              size: stats.size
            });
          }
        });
      } catch (error) {
        console.log('⚠️ Could not load previous file mappings');
      }
    }
  }

  // Find all CSV files in project
  private findCSVFiles(): string[] {
    const csvFiles: string[] = [];
    
    function scanDirectory(dir: string) {
      try {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            // Skip system directories
            if (!['node_modules', '.git', 'playwright-report', 'test-results', 'generated'].includes(item)) {
              scanDirectory(fullPath);
            }
          } else if (item.toLowerCase().endsWith('.csv')) {
            csvFiles.push(fullPath);
          }
        }
      } catch (error) {
        // Ignore permission errors
      }
    }
    
    scanDirectory(CONFIG.projectRoot);
    return csvFiles;
  }

  // Check for new or modified CSV files
  private async checkForChanges() {
    const currentFiles = this.findCSVFiles();
    let hasChanges = false;

    // Check for new or modified files
    for (const filePath of currentFiles) {
      try {
        const stats = fs.statSync(filePath);
        const currentInfo: FileInfo = {
          path: filePath,
          mtime: stats.mtime.getTime(),
          size: stats.size
        };

        const knownInfo = this.knownFiles.get(filePath);

        if (!knownInfo) {
          console.log(`📄 New CSV file detected: ${path.relative(CONFIG.projectRoot, filePath)}`);
          hasChanges = true;
        } else if (knownInfo.mtime !== currentInfo.mtime || knownInfo.size !== currentInfo.size) {
          console.log(`📝 CSV file modified: ${path.relative(CONFIG.projectRoot, filePath)}`);
          hasChanges = true;
        }

        this.knownFiles.set(filePath, currentInfo);
      } catch (error) {
        console.error(`❌ Error checking file ${filePath}:`, error);
      }
    }

    // Check for deleted files
    const currentFilePaths = new Set(currentFiles);
    for (const knownPath of this.knownFiles.keys()) {
      if (!currentFilePaths.has(knownPath)) {
        console.log(`🗑️ CSV file removed: ${path.relative(CONFIG.projectRoot, knownPath)}`);
        this.knownFiles.delete(knownPath);
        hasChanges = true;
      }
    }

    // If changes detected, regenerate automation scripts
    if (hasChanges) {
      console.log('\n🔄 Changes detected! Regenerating automation scripts...');
      try {
        await processAllCSVFiles();
        console.log('✅ Automation scripts updated successfully!\n');
      } catch (error) {
        console.error('❌ Error regenerating scripts:', error);
      }
    }
  }

  // Start watching for changes
  public startWatching() {
    console.log('👀 Starting CSV file watcher...');
    console.log(`📂 Watching directory: ${CONFIG.projectRoot}`);
    console.log(`⏱️ Check interval: ${CONFIG.watchInterval}ms\n`);

    // Initial scan
    this.checkForChanges();

    // Set up periodic checking
    this.watcherInterval = setInterval(() => {
      this.checkForChanges();
    }, CONFIG.watchInterval);

    console.log('✅ CSV watcher is now active. Add or modify CSV files to auto-generate tests!');
    console.log('Press Ctrl+C to stop watching.\n');
  }

  // Stop watching
  public stopWatching() {
    if (this.watcherInterval) {
      clearInterval(this.watcherInterval);
      this.watcherInterval = null;
      console.log('🛑 CSV file watcher stopped');
    }
  }
}

// CLI interface
export function startCSVWatcher() {
  const watcher = new CSVWatcher();
  watcher.startWatching();

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down CSV watcher...');
    watcher.stopWatching();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    watcher.stopWatching();
    process.exit(0);
  });
}

// Run if called directly
if (require.main === module) {
  startCSVWatcher();
}
