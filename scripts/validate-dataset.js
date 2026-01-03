#!/usr/bin/env node

/**
 * Data Factory - Dataset Validation Script
 *
 * Validates training datasets for:
 * - JSONL schema validity
 * - No duplicate entries
 * - Train/val/test split ratios
 * - No data leakage between splits
 * - Token length distribution
 * - Language detection accuracy
 *
 * Usage:
 *   node scripts/validate-dataset.js <dataset-path>
 *   node scripts/validate-dataset.js data/training/dataset.jsonl
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(title) {
  console.log('\n' + '═'.repeat(60));
  log(`  ${title}`, 'cyan');
  console.log('═'.repeat(60) + '\n');
}

// Validation results
const results = {
  passed: [],
  warnings: [],
  errors: [],
};

function pass(check, details = '') {
  results.passed.push({ check, details });
  log(`  ✓ ${check}${details ? ': ' + details : ''}`, 'green');
}

function warn(check, details = '') {
  results.warnings.push({ check, details });
  log(`  ⚠ ${check}${details ? ': ' + details : ''}`, 'yellow');
}

function fail(check, details = '') {
  results.errors.push({ check, details });
  log(`  ✗ ${check}${details ? ': ' + details : ''}`, 'red');
}

/**
 * Parse JSONL file
 */
function parseJSONL(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  const entries = [];
  const parseErrors = [];

  lines.forEach((line, index) => {
    if (!line.trim()) return;
    try {
      entries.push(JSON.parse(line));
    } catch (e) {
      parseErrors.push({ line: index + 1, error: e.message });
    }
  });

  return { entries, parseErrors };
}

/**
 * Validate JSONL schema
 */
function validateSchema(entries) {
  logHeader('Schema Validation');

  const requiredFields = ['instruction', 'output'];
  const optionalFields = ['input', 'id', 'metadata'];

  let validCount = 0;
  let invalidCount = 0;
  const schemaIssues = [];

  entries.forEach((entry, index) => {
    const issues = [];

    // Check required fields
    for (const field of requiredFields) {
      if (!entry[field] || typeof entry[field] !== 'string') {
        issues.push(`Missing or invalid '${field}'`);
      }
    }

    // Check field types
    if (entry.input !== undefined && typeof entry.input !== 'string') {
      issues.push("'input' must be a string");
    }

    if (entry.metadata !== undefined && typeof entry.metadata !== 'object') {
      issues.push("'metadata' must be an object");
    }

    if (issues.length > 0) {
      invalidCount++;
      if (schemaIssues.length < 5) {
        schemaIssues.push({ index, issues });
      }
    } else {
      validCount++;
    }
  });

  if (invalidCount === 0) {
    pass('Schema valid', `${validCount} entries conform to schema`);
  } else {
    fail('Schema issues found', `${invalidCount}/${entries.length} entries invalid`);
    schemaIssues.forEach(({ index, issues }) => {
      log(`    Entry ${index}: ${issues.join(', ')}`, 'red');
    });
  }

  return invalidCount === 0;
}

/**
 * Check for duplicates
 */
function checkDuplicates(entries) {
  logHeader('Duplicate Detection');

  const hashes = new Map();
  const duplicates = [];

  entries.forEach((entry, index) => {
    // Hash based on instruction + input + output
    const content = `${entry.instruction}|${entry.input || ''}|${entry.output}`;
    const hash = crypto.createHash('md5').update(content).digest('hex');

    if (hashes.has(hash)) {
      duplicates.push({ index, originalIndex: hashes.get(hash) });
    } else {
      hashes.set(hash, index);
    }
  });

  if (duplicates.length === 0) {
    pass('No duplicates', `${entries.length} unique entries`);
  } else {
    fail('Duplicates found', `${duplicates.length} duplicate entries`);
    duplicates.slice(0, 5).forEach(({ index, originalIndex }) => {
      log(`    Entry ${index} is duplicate of ${originalIndex}`, 'red');
    });
  }

  return duplicates.length === 0;
}

/**
 * Validate split ratios
 */
function validateSplits(dataDir) {
  logHeader('Split Validation');

  const splitFiles = {
    train: path.join(dataDir, 'splits', 'train.jsonl'),
    val: path.join(dataDir, 'splits', 'val.jsonl'),
    test: path.join(dataDir, 'splits', 'test.jsonl'),
  };

  const counts = {};
  let total = 0;

  for (const [split, filePath] of Object.entries(splitFiles)) {
    if (fs.existsSync(filePath)) {
      const { entries } = parseJSONL(filePath);
      counts[split] = entries.length;
      total += entries.length;
    } else {
      counts[split] = 0;
    }
  }

  if (total === 0) {
    warn('No split files found', 'Expected train.jsonl, val.jsonl, test.jsonl in data/splits/');
    return false;
  }

  const ratios = {
    train: counts.train / total,
    val: counts.val / total,
    test: counts.test / total,
  };

  log(`  Split counts: train=${counts.train}, val=${counts.val}, test=${counts.test}`, 'blue');
  log(`  Split ratios: train=${(ratios.train * 100).toFixed(1)}%, val=${(ratios.val * 100).toFixed(1)}%, test=${(ratios.test * 100).toFixed(1)}%`, 'blue');

  // Check standard 80/10/10 or 70/15/15 splits
  if (ratios.train >= 0.7 && ratios.train <= 0.85) {
    pass('Train ratio acceptable', `${(ratios.train * 100).toFixed(1)}%`);
  } else {
    warn('Train ratio unusual', `${(ratios.train * 100).toFixed(1)}% (expected 70-85%)`);
  }

  if (ratios.test >= 0.1) {
    pass('Test set sufficient', `${counts.test} samples (${(ratios.test * 100).toFixed(1)}%)`);
  } else {
    warn('Test set may be too small', `${counts.test} samples`);
  }

  return true;
}

/**
 * Check for data leakage between splits
 */
function checkLeakage(dataDir) {
  logHeader('Leakage Detection');

  const splitFiles = {
    train: path.join(dataDir, 'splits', 'train.jsonl'),
    val: path.join(dataDir, 'splits', 'val.jsonl'),
    test: path.join(dataDir, 'splits', 'test.jsonl'),
  };

  const splitHashes = {};

  for (const [split, filePath] of Object.entries(splitFiles)) {
    if (!fs.existsSync(filePath)) continue;

    const { entries } = parseJSONL(filePath);
    splitHashes[split] = new Set();

    entries.forEach((entry) => {
      const content = `${entry.instruction}|${entry.input || ''}|${entry.output}`;
      const hash = crypto.createHash('md5').update(content).digest('hex');
      splitHashes[split].add(hash);
    });
  }

  const leaks = [];

  // Check train-test leakage
  if (splitHashes.train && splitHashes.test) {
    const trainTestLeaks = [...splitHashes.train].filter((h) => splitHashes.test.has(h));
    if (trainTestLeaks.length > 0) {
      leaks.push({ splits: 'train-test', count: trainTestLeaks.length });
    }
  }

  // Check train-val leakage
  if (splitHashes.train && splitHashes.val) {
    const trainValLeaks = [...splitHashes.train].filter((h) => splitHashes.val.has(h));
    if (trainValLeaks.length > 0) {
      leaks.push({ splits: 'train-val', count: trainValLeaks.length });
    }
  }

  // Check val-test leakage
  if (splitHashes.val && splitHashes.test) {
    const valTestLeaks = [...splitHashes.val].filter((h) => splitHashes.test.has(h));
    if (valTestLeaks.length > 0) {
      leaks.push({ splits: 'val-test', count: valTestLeaks.length });
    }
  }

  if (leaks.length === 0) {
    pass('No data leakage', 'Splits are properly isolated');
  } else {
    leaks.forEach(({ splits, count }) => {
      fail('Data leakage detected', `${count} samples shared between ${splits}`);
    });
  }

  return leaks.length === 0;
}

/**
 * Analyze token length distribution
 */
function analyzeTokens(entries) {
  logHeader('Token Analysis');

  // Simple word-based tokenization (approximation)
  const tokenCounts = entries.map((entry) => {
    const text = `${entry.instruction} ${entry.input || ''} ${entry.output}`;
    return text.split(/\s+/).length;
  });

  const min = Math.min(...tokenCounts);
  const max = Math.max(...tokenCounts);
  const avg = tokenCounts.reduce((a, b) => a + b, 0) / tokenCounts.length;
  const sorted = [...tokenCounts].sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.5)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];

  log(`  Token distribution (word-based approximation):`, 'blue');
  log(`    Min: ${min}, Max: ${max}, Avg: ${avg.toFixed(0)}`, 'blue');
  log(`    P50: ${p50}, P95: ${p95}`, 'blue');

  if (max > 2048) {
    warn('Very long sequences detected', `Max ${max} tokens may exceed model context`);
  } else {
    pass('Token lengths acceptable', `Max ${max} tokens`);
  }

  if (min < 10) {
    warn('Very short sequences detected', `Min ${min} tokens may lack context`);
  }

  return true;
}

/**
 * Detect languages in dataset
 */
function detectLanguages(entries) {
  logHeader('Language Detection');

  // Simple heuristic: count dialect markers and local terms
  const dialectMarkers = ['cedis', 'pesewas', 'Medaaase', 'Akwaaba', 'yam', 'fufu', 'kenkey'];
  const markerCounts = {};

  entries.forEach((entry) => {
    const text = `${entry.instruction} ${entry.input || ''} ${entry.output}`.toLowerCase();
    dialectMarkers.forEach((marker) => {
      if (text.includes(marker.toLowerCase())) {
        markerCounts[marker] = (markerCounts[marker] || 0) + 1;
      }
    });
  });

  const foundMarkers = Object.entries(markerCounts);
  if (foundMarkers.length > 0) {
    pass('Localization markers found', `${foundMarkers.length} types detected`);
    foundMarkers.forEach(([marker, count]) => {
      log(`    "${marker}": ${count} occurrences`, 'blue');
    });
  } else {
    warn('No localization markers detected', 'Consider adding local context');
  }

  // Check metadata for language info
  const languagesFromMeta = new Set();
  entries.forEach((entry) => {
    if (entry.metadata?.language) {
      languagesFromMeta.add(entry.metadata.language);
    }
  });

  if (languagesFromMeta.size > 0) {
    pass('Language metadata present', `Languages: ${[...languagesFromMeta].join(', ')}`);
  } else {
    warn('No language metadata', 'Consider adding language field to metadata');
  }

  return true;
}

/**
 * Main validation function
 */
function validateDataset(inputPath) {
  const resolvedPath = path.resolve(inputPath);

  logHeader('Data Factory - Dataset Validation');
  log(`  Dataset: ${resolvedPath}`, 'blue');

  // Check if file exists
  if (!fs.existsSync(resolvedPath)) {
    fail('File not found', resolvedPath);
    return false;
  }

  // Determine if this is a single file or directory
  const stats = fs.statSync(resolvedPath);
  let dataDir = stats.isDirectory() ? resolvedPath : path.dirname(resolvedPath);
  let mainDataset = stats.isDirectory()
    ? path.join(resolvedPath, 'training', 'dataset.jsonl')
    : resolvedPath;

  if (!fs.existsSync(mainDataset)) {
    // Try splits
    mainDataset = path.join(dataDir, 'splits', 'train.jsonl');
  }

  if (!fs.existsSync(mainDataset)) {
    fail('No dataset found', 'Expected dataset.jsonl or train.jsonl');
    return false;
  }

  log(`  Main dataset: ${mainDataset}`, 'blue');

  // Parse dataset
  const { entries, parseErrors } = parseJSONL(mainDataset);

  if (parseErrors.length > 0) {
    fail('JSONL parse errors', `${parseErrors.length} lines failed to parse`);
    parseErrors.slice(0, 5).forEach(({ line, error }) => {
      log(`    Line ${line}: ${error}`, 'red');
    });
    return false;
  }

  pass('JSONL parsing', `${entries.length} entries loaded`);

  // Run validations
  validateSchema(entries);
  checkDuplicates(entries);
  validateSplits(dataDir);
  checkLeakage(dataDir);
  analyzeTokens(entries);
  detectLanguages(entries);

  // Summary
  logHeader('Validation Summary');

  log(`  Passed: ${results.passed.length}`, 'green');
  log(`  Warnings: ${results.warnings.length}`, 'yellow');
  log(`  Errors: ${results.errors.length}`, 'red');

  console.log('\n');

  if (results.errors.length > 0) {
    log('VALIDATION FAILED - Fix errors before training', 'red');
    return false;
  } else if (results.warnings.length > 0) {
    log('VALIDATION PASSED WITH WARNINGS - Review before training', 'yellow');
    return true;
  } else {
    log('VALIDATION PASSED - Dataset ready for training', 'green');
    return true;
  }
}

// Run if called directly
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node scripts/validate-dataset.js <dataset-path>');
    console.log('       node scripts/validate-dataset.js data/training/dataset.jsonl');
    console.log('       node scripts/validate-dataset.js data/');
    process.exit(1);
  }

  const success = validateDataset(args[0]);
  process.exit(success ? 0 : 1);
}

module.exports = { validateDataset };
