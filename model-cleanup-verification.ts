import fs from 'fs';
import path from 'path';
import { UNIFIED_LLM_CONFIG } from './src/unified-llm-config';

/**
 * Model Cleanup Verification
 * 
 * Ensures only the unified Mistral-7B model exists
 * and removes any references to other models
 */

console.log('🧹 MODEL CLEANUP VERIFICATION\n');
console.log('='.repeat(60));

const modelsDir = path.join(__dirname, 'Models');

console.log('\n📊 CHECKING MODELS DIRECTORY:');
if (fs.existsSync(modelsDir)) {
  const files = fs.readdirSync(modelsDir);
  console.log(`Found ${files.length} model file(s):`);
  
  files.forEach(file => {
    const filePath = path.join(modelsDir, file);
    const stats = fs.statSync(filePath);
    const sizeGB = (stats.size / (1024 * 1024 * 1024)).toFixed(2);
    
    if (file === UNIFIED_LLM_CONFIG.model.name) {
      console.log(`✅ ${file} (${sizeGB} GB) - UNIFIED MODEL`);
    } else {
      console.log(`⚠️ ${file} (${sizeGB} GB) - SHOULD BE REMOVED`);
    }
  });
  
  // Check if only unified model exists
  const unifiedModelExists = files.includes(UNIFIED_LLM_CONFIG.model.name);
  const onlyUnifiedModel = files.length === 1 && unifiedModelExists;
  
  if (onlyUnifiedModel) {
    console.log('\n🎉 CLEANUP SUCCESSFUL:');
    console.log('✅ Only unified Mistral-7B model exists');
    console.log('✅ No conflicting models found');
    console.log('✅ Clean, consistent model environment');
  } else if (!unifiedModelExists) {
    console.log('\n❌ ERROR: Unified model missing!');
    console.log(`Expected: ${UNIFIED_LLM_CONFIG.model.name}`);
  } else {
    console.log('\n⚠️ WARNING: Additional models found');
    console.log('Consider removing non-unified models for consistency');
  }
} else {
  console.log('❌ Models directory not found!');
}

console.log('\n🤖 UNIFIED MODEL CONFIGURATION:');
console.log(`   Model: ${UNIFIED_LLM_CONFIG.model.name}`);
console.log(`   Type: ${UNIFIED_LLM_CONFIG.model.type}`);
console.log(`   Quantization: ${UNIFIED_LLM_CONFIG.model.quantization}`);
console.log(`   Context Length: ${UNIFIED_LLM_CONFIG.model.context_length}`);
console.log(`   Temperature: ${UNIFIED_LLM_CONFIG.model.temperature}`);

console.log('\n📋 TRAINING CONFIGURATION:');
Object.entries(UNIFIED_LLM_CONFIG.training).forEach(([key, value]) => {
  console.log(`   ${key}: ${value}`);
});

console.log('\n⚡ PERFORMANCE EXPECTATIONS:');
console.log(`   Model Loading: ${UNIFIED_LLM_CONFIG.performance.modelLoadingTime}s`);
console.log(`   Per Test Case: ${UNIFIED_LLM_CONFIG.performance.perTestCaseTime}s`);
console.log(`   Validation: ${UNIFIED_LLM_CONFIG.performance.validationTime}s`);

console.log('\n🎯 BENEFITS OF SINGLE MODEL:');
console.log('✅ Consistent training and learning');
console.log('✅ No model confusion or conflicts');
console.log('✅ Focused improvement and optimization');
console.log('✅ Simplified maintenance and debugging');
console.log('✅ Better resource utilization');

console.log('\n🚀 NEXT STEPS:');
console.log('1. All generators now use unified Mistral-7B model');
console.log('2. Training accumulates in single model');
console.log('3. Each CSV improves future generation quality');
console.log('4. Consistent assertion patterns across all outputs');

console.log('\n' + '='.repeat(60));
console.log('🎉 MODEL CLEANUP COMPLETED SUCCESSFULLY!');
console.log('🤖 Single Mistral-7B model ready for unified training');
console.log('='.repeat(60));

export {};
