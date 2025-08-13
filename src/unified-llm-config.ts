import path from 'path';

/**
 * Unified LLM Configuration
 * 
 * Single source of truth for all LLM-based generators
 * This ensures consistent training and model usage across the entire system
 */

export const UNIFIED_LLM_CONFIG = {
  // Model Configuration - SINGLE MODEL FOR ALL OPERATIONS
  model: {
    name: 'mistral-7b-instruct-v0.1.Q2_K.gguf',
    path: path.join(__dirname, '../Models/mistral-7b-instruct-v0.1.Q2_K.gguf'),
    type: 'mistral-7b-instruct',
    quantization: 'Q2_K',
    context_length: 4096,
    temperature: 0.1, // Low temperature for consistent code generation
    top_p: 0.9,
    top_k: 40
  },

  // File Paths
  paths: {
    modelsDir: path.join(__dirname, '../Models'),
    generatedDir: path.join(__dirname, '../generated'),
    testFile: path.join(__dirname, '../excel-generated-tests-clean.spec.ts'),
    locksFile: path.join(__dirname, '../test-locks.json'),
    mappingFile: path.join(__dirname, '../csv-mappings.json'),
    trainingPatternsFile: path.join(__dirname, '../training-patterns.json'),
    projectRoot: path.join(__dirname, '..')
  },

  // Training Configuration
  training: {
    enhancedPatternsEnabled: true,
    comprehensiveAssertions: true,
    patternBasedFallback: true,
    codeValidationEnabled: true,
    dynamicDataGeneration: true
  },

  // Generation Settings
  generation: {
    timeout: 120000, // 2 minutes per test case
    maxRetries: 3,
    validateSyntax: true,
    createBackups: true,
    enableLocking: true
  },

  // Performance Metrics
  performance: {
    modelLoadingTime: 30, // seconds
    perTestCaseTime: 45, // seconds with enhanced training
    validationTime: 5, // seconds per test case
    estimatedTokensPerTestCase: 2000
  }
};

/**
 * Get model path for LLM loading
 */
export function getModelPath(): string {
  return UNIFIED_LLM_CONFIG.model.path;
}

/**
 * Get model name for LLM loading
 */
export function getModelName(): string {
  return UNIFIED_LLM_CONFIG.model.name;
}

/**
 * Get unified configuration summary
 */
export function getConfigSummary(): string {
  return `
🤖 UNIFIED LLM CONFIGURATION:
   Model: ${UNIFIED_LLM_CONFIG.model.name}
   Type: ${UNIFIED_LLM_CONFIG.model.type}
   Quantization: ${UNIFIED_LLM_CONFIG.model.quantization}
   Enhanced Training: ${UNIFIED_LLM_CONFIG.training.enhancedPatternsEnabled ? 'Enabled' : 'Disabled'}
   Comprehensive Assertions: ${UNIFIED_LLM_CONFIG.training.comprehensiveAssertions ? 'Enabled' : 'Disabled'}
   Performance: ${UNIFIED_LLM_CONFIG.performance.perTestCaseTime}s per test case
  `;
}

export default UNIFIED_LLM_CONFIG;
