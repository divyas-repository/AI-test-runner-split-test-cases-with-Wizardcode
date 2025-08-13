/**
 * Code Generation Validator
 * Prevents creation of empty or invalid files during test generation
 */

import fs from 'fs';
import path from 'path';

interface ValidationRule {
  name: string;
  check: (content: string, filePath: string) => boolean;
  message: string;
}

export class CodeValidator {
  private static rules: ValidationRule[] = [
    {
      name: 'NonEmpty',
      check: (content: string) => content.trim().length > 0,
      message: 'File content cannot be empty'
    },
    {
      name: 'ValidTypeScript',
      check: (content: string, filePath: string) => {
        if (!filePath.endsWith('.ts')) return true;
        return content.includes('import') || content.includes('export') || content.includes('function') || content.includes('class');
      },
      message: 'TypeScript files must contain valid code structures'
    },
    {
      name: 'ValidTestFile',
      check: (content: string, filePath: string) => {
        if (!filePath.includes('.spec.ts')) return true;
        return content.includes('test(') || content.includes('describe(');
      },
      message: 'Test files must contain test functions'
    },
    {
      name: 'MinimumContent',
      check: (content: string) => content.trim().length >= 10,
      message: 'File must contain meaningful content (minimum 10 characters)'
    },
    {
      name: 'NoPlaceholderOnly',
      check: (content: string) => {
        const placeholders = ['TODO', 'FIXME', '// Add code here', '/* placeholder */'];
        const trimmed = content.trim();
        return !placeholders.some(placeholder => trimmed === placeholder || trimmed.includes(placeholder) && trimmed.length < 50);
      },
      message: 'File cannot contain only placeholder text'
    }
  ];

  /**
   * Validate content before writing to file
   */
  static validateContent(content: string, filePath: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const rule of this.rules) {
      if (!rule.check(content, filePath)) {
        errors.push(`${rule.name}: ${rule.message}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Safe file creation with validation
   */
  static async createValidatedFile(filePath: string, content: string): Promise<boolean> {
    const validation = this.validateContent(content, filePath);
    
    if (!validation.valid) {
      console.log(`❌ File creation blocked: ${filePath}`);
      validation.errors.forEach(error => console.log(`   ${error}`));
      return false;
    }

    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write file
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Created validated file: ${filePath}`);
      return true;
    } catch (error) {
      console.log(`❌ Failed to create file ${filePath}: ${error}`);
      return false;
    }
  }

  /**
   * Scan project for invalid files and report
   */
  static scanProject(): { validFiles: string[]; invalidFiles: string[] } {
    const validFiles: string[] = [];
    const invalidFiles: string[] = [];

    const scanDirectory = (dirPath: string) => {
      if (!fs.existsSync(dirPath)) return;

      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stats = fs.statSync(fullPath);

        if (stats.isFile() && (item.endsWith('.ts') || item.endsWith('.js'))) {
          const content = fs.readFileSync(fullPath, 'utf8');
          const validation = this.validateContent(content, fullPath);

          if (validation.valid) {
            validFiles.push(fullPath);
          } else {
            invalidFiles.push(fullPath);
            console.log(`⚠️ Invalid file detected: ${fullPath}`);
            validation.errors.forEach(error => console.log(`   ${error}`));
          }
        } else if (stats.isDirectory() && !['node_modules', '.git', 'Models'].includes(item)) {
          scanDirectory(fullPath);
        }
      }
    };

    scanDirectory('.');
    return { validFiles, invalidFiles };
  }
}

export default CodeValidator;
