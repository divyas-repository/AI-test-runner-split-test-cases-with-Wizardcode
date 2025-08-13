import * as XLSX from 'xlsx';
import fs from 'fs';
import https from 'https';
import http from 'http';

export interface ExcelTestCase {
  name: string;
  description: string;
  steps: string[];
}

export class ExcelTestReader {
  static async readTestCases(filePath: string): Promise<ExcelTestCase[]> {
    let workbook: XLSX.WorkBook;

    // Handle different input types
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      console.log(`📥 Downloading file from URL: ${filePath}`);
      
      // Handle Google Sheets URLs
      if (filePath.includes('docs.google.com/spreadsheets')) {
        const convertedUrl = this.convertGoogleSheetsUrl(filePath);
        console.log(`🔄 Converted Google Sheets URL: ${convertedUrl}`);
        workbook = await this.readFromUrl(convertedUrl);
      } else {
        workbook = await this.readFromUrl(filePath);
      }
    } else if (filePath.endsWith('.csv')) {
      console.log(`📄 Reading CSV file: ${filePath}`);
      workbook = this.readCSV(filePath);
    } else {
      console.log(`📊 Reading Excel file: ${filePath}`);
      workbook = this.readExcel(filePath);
    }

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    return this.parseTestCases(data as any[][]);
  }

  private static convertGoogleSheetsUrl(url: string): string {
    // Extract spreadsheet ID from various Google Sheets URL formats
    const patterns = [
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)\/edit/,
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)\/export/
    ];

    let spreadsheetId = '';
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        spreadsheetId = match[1];
        break;
      }
    }

    if (!spreadsheetId) {
      throw new Error('Could not extract spreadsheet ID from Google Sheets URL');
    }

    console.log(`🔍 Extracted spreadsheet ID: ${spreadsheetId}`);
    
    // Try multiple export formats for better compatibility
    const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=0&single=true&output=csv`;
    console.log(`🔗 Using export URL: ${exportUrl}`);
    
    return exportUrl;
  }

  private static readExcel(filePath: string): XLSX.WorkBook {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Excel file not found: ${filePath}`);
    }
    return XLSX.readFile(filePath);
  }

  private static readCSV(filePath: string): XLSX.WorkBook {
    if (!fs.existsSync(filePath)) {
      throw new Error(`CSV file not found: ${filePath}`);
    }
    const csvContent = fs.readFileSync(filePath, 'utf-8');
    return XLSX.read(csvContent, { type: 'string' });
  }

  private static async readFromUrl(url: string): Promise<XLSX.WorkBook> {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https://') ? https : http;
      
      const makeRequest = (requestUrl: string, redirectCount = 0) => {
        if (redirectCount > 10) {
          reject(new Error('Too many redirects'));
          return;
        }

        const options = {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        };

        protocol.get(requestUrl, options, (response) => {
          // Handle redirects
          if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) {
            const location = response.headers.location;
            if (location) {
              console.log(`🔄 Following redirect ${redirectCount + 1}: ${location.substring(0, 100)}...`);
              // Handle relative redirects
              const nextUrl = location.startsWith('http') ? location : new URL(location, requestUrl).href;
              makeRequest(nextUrl, redirectCount + 1);
              return;
            }
          }

          if (response.statusCode !== 200) {
            console.log(`❌ Status: ${response.statusCode} - ${response.statusMessage}`);
            console.log(`📄 Response headers:`, response.headers);
            reject(new Error(`Failed to download file: ${response.statusCode} - ${response.statusMessage}`));
            return;
          }

          console.log(`✅ Successfully connected, downloading content...`);
          const chunks: Buffer[] = [];
          let totalSize = 0;
          
          response.on('data', (chunk) => {
            chunks.push(chunk);
            totalSize += chunk.length;
            if (totalSize % 10000 < chunk.length) { // Log progress every ~10KB
              console.log(`📥 Downloaded ${Math.round(totalSize / 1024)}KB...`);
            }
          });
          
          response.on('end', () => {
            const buffer = Buffer.concat(chunks);
            console.log(`✅ Download complete: ${Math.round(totalSize / 1024)}KB`);
            
            try {
              // Check if it's HTML (error page)
              const content = buffer.toString('utf-8', 0, Math.min(1000, buffer.length));
              if (content.includes('<html') || content.includes('<!DOCTYPE')) {
                console.log(`❌ Received HTML instead of data:`, content.substring(0, 200));
                reject(new Error('Received HTML error page instead of spreadsheet data. Please ensure the Google Sheet is public.'));
                return;
              }

              // Try to parse as Excel first, then CSV
              let workbook: XLSX.WorkBook;
              try {
                workbook = XLSX.read(buffer, { type: 'buffer' });
                console.log(`📊 Parsed as Excel workbook with ${workbook.SheetNames.length} sheets`);
              } catch {
                // If Excel parsing fails, try as CSV
                const csvContent = buffer.toString('utf-8');
                console.log(`📄 Parsing as CSV, first 200 chars: ${csvContent.substring(0, 200)}`);
                workbook = XLSX.read(csvContent, { type: 'string' });
                console.log(`📊 Parsed as CSV workbook`);
              }
              resolve(workbook);
            } catch (error) {
              console.log(`❌ Parse error:`, error);
              reject(new Error(`Failed to parse downloaded file: ${error}`));
            }
          });
        }).on('error', (error) => {
          reject(new Error(`Download failed: ${error.message}`));
        });
      };

      makeRequest(url);
    });
  }

  private static parseTestCases(data: any[][]): ExcelTestCase[] {
    if (data.length === 0) {
      throw new Error('File is empty or contains no data');
    }

    const testCases: ExcelTestCase[] = [];
    const headers = data[0].map((h: any) => h?.toString().toLowerCase().trim() || '');
    
    console.log(`📋 Found headers: ${headers.join(', ')}`);

    // Find column indices
    const nameIndex = this.findColumnIndex(headers, ['test name', 'testname', 'name', 'test case', 'testcase', 'scenario']);
    const descIndex = this.findColumnIndex(headers, ['description', 'desc', 'details', 'summary']);
    
    console.log(`🔍 Name column: ${nameIndex}, Description column: ${descIndex}`);

    // Process each row (skip header)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      const testName = nameIndex >= 0 ? row[nameIndex]?.toString().trim() : '';
      const description = descIndex >= 0 ? row[descIndex]?.toString().trim() : '';

      if (!testName && !description) continue;

      const testCase: ExcelTestCase = {
        name: testName || `Test Case ${i}`,
        description: description || '',
        steps: []
      };

      // Look for steps in remaining columns
      const stepColumns = headers
        .map((header, index) => ({ header, index }))
        .filter(({ header }) => 
          header.includes('step') || 
          header.match(/^step\s*\d+/) ||
          header.match(/^\d+/) ||
          (header !== headers[nameIndex] && header !== headers[descIndex] && header.trim())
        );

      console.log(`📝 Step columns for row ${i}:`, stepColumns.map(c => c.header));

      // Extract steps from step columns
      for (const { index } of stepColumns) {
        const stepValue = row[index]?.toString().trim();
        if (stepValue && stepValue.length > 0) {
          testCase.steps.push(stepValue);
        }
      }

      // If no steps found in columns, try to parse from description
      if (testCase.steps.length === 0 && testCase.description) {
        const descSteps = this.extractStepsFromDescription(testCase.description);
        testCase.steps = descSteps;
      }

      // Add default steps if still empty
      if (testCase.steps.length === 0) {
        testCase.steps = [
          'Navigate to the application',
          `Execute: ${testCase.name}`,
          'Verify the expected result'
        ];
      }

      if (testCase.name || testCase.description) {
        testCases.push(testCase);
        console.log(`✅ Added test case: "${testCase.name}" with ${testCase.steps.length} steps`);
      }
    }

    return testCases;
  }

  private static findColumnIndex(headers: string[], possibleNames: string[]): number {
    for (const name of possibleNames) {
      const index = headers.findIndex(h => h.includes(name));
      if (index >= 0) return index;
    }
    return -1;
  }

  private static extractStepsFromDescription(description: string): string[] {
    // Try different patterns to extract steps
    const patterns = [
      /\d+\.\s*(.+?)(?=\d+\.|$)/g,  // "1. Step one 2. Step two"
      /Step\s*\d+:\s*(.+?)(?=Step\s*\d+:|$)/gi,  // "Step 1: Do this Step 2: Do that"
      /[-•]\s*(.+?)(?=[-•]|$)/g,  // "- Step one • Step two"
    ];

    for (const pattern of patterns) {
      const matches = [...description.matchAll(pattern)];
      if (matches.length > 0) {
        return matches.map(match => match[1].trim()).filter(step => step.length > 0);
      }
    }

    // If no pattern matches, split by common delimiters
    const delimiters = ['\n', ';', ','];
    for (const delimiter of delimiters) {
      if (description.includes(delimiter)) {
        const steps = description.split(delimiter)
          .map(step => step.trim())
          .filter(step => step.length > 3); // Filter out very short strings
        
        if (steps.length > 1) {
          return steps;
        }
      }
    }

    // Return as single step if no parsing worked
    return [description];
  }

  static async writeTestCasesToBatches(testCases: ExcelTestCase[], outputDir = 'split-cases') {
    const batchSize = Math.ceil(testCases.length / 2);
    
    for (let i = 0; i < testCases.length; i += batchSize) {
      const batch = testCases.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      
      let content = '';
      for (const testCase of batch) {
        content += `Test Case: ${testCase.name}\n`;
        if (testCase.description) {
          content += `Description: ${testCase.description}\n`;
        }
        content += 'Steps:\n';
        testCase.steps.forEach((step, index) => {
          content += `${index + 1}. ${step}\n`;
        });
        content += '\n---\n\n';
      }

      const outputPath = `${outputDir}/test-case-batch-${batchNumber}.txt`;
      fs.mkdirSync(outputDir, { recursive: true });
      fs.writeFileSync(outputPath, content);
      console.log(`✅ Created batch ${batchNumber}: ${outputPath}`);
    }
  }
}
