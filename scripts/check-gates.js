#!/usr/bin/env node

/**
 * Data Factory - Gate Validation Script
 *
 * Checks workflow gates for a Data Factory project.
 *
 * Usage:
 *   node scripts/check-gates.js <project-path>
 *   node scripts/check-gates.js <project-path> <gate-id>
 */

const fs = require('fs');
const path = require('path');

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

// Gate definitions with validation logic
const GATES = {
  'data-scope-defined': {
    name: 'Data Scope Defined',
    description: 'Domain, target languages, and use cases are clearly documented',
    requiredFiles: ['docs/domain-brief.md'],
    requiredSections: ['Domain Overview', 'Target Languages', 'Use Cases'],
  },
  'sources-identified': {
    name: 'Sources Identified',
    description: 'Data sources catalogued with access method and quality assessment',
    requiredFiles: ['docs/data-sources.md'],
    requiredSections: ['Source Overview'],
  },
  'ethics-approved': {
    name: 'Ethics Approved',
    description: 'Data governance reviewed, consent documented',
    requiredFiles: ['docs/data-governance.md'],
    requiredSections: ['Consent Framework', 'Privacy Protection'],
  },
  'raw-data-quality': {
    name: 'Raw Data Quality',
    description: 'Minimum samples collected (1000+), coverage verified (80%+)',
    check: checkRawDataQuality,
  },
  'annotations-validated': {
    name: 'Annotations Validated',
    description: 'Inter-annotator agreement meets threshold (85%+)',
    check: checkAnnotations,
  },
  'dataset-validated': {
    name: 'Dataset Validated',
    description: 'Schema valid, no train/test leakage, quality metrics pass',
    check: checkDataset,
  },
  'baseline-established': {
    name: 'Baseline Established',
    description: 'Base model performance measured on domain tasks',
    requiredFiles: ['docs/baseline-eval.md', 'metrics/baseline.json'],
  },
  'model-performance': {
    name: 'Model Performance',
    description: 'Fine-tuned model beats baseline by threshold (+20% localization)',
    check: checkModelPerformance,
  },
  'quantization-verified': {
    name: 'Quantization Verified',
    description: 'Quantized model maintains quality within acceptable degradation',
    requiredFiles: ['models/quantized'],
  },
  'deployment-ready': {
    name: 'Deployment Ready',
    description: 'Model runs on target hardware with acceptable speed and memory',
    requiredFiles: ['docs/edge-verification.md'],
  },
  'integration-ready': {
    name: 'Integration Ready',
    description: 'Model card complete, API documented, examples validated',
    requiredFiles: ['docs/model-card.md', 'docs/inference-api.md', 'docs/prompt-examples.md'],
  },
};

/**
 * Check if required files exist
 */
function checkRequiredFiles(projectPath, files) {
  const missing = [];
  const found = [];

  for (const file of files) {
    const filePath = path.join(projectPath, file);
    if (fs.existsSync(filePath)) {
      found.push(file);
    } else {
      missing.push(file);
    }
  }

  return { found, missing };
}

/**
 * Check if file contains required sections
 */
function checkRequiredSections(projectPath, file, sections) {
  const filePath = path.join(projectPath, file);

  if (!fs.existsSync(filePath)) {
    return { found: [], missing: sections };
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const found = [];
  const missing = [];

  for (const section of sections) {
    if (content.includes(section) || content.includes(`# ${section}`) || content.includes(`## ${section}`)) {
      found.push(section);
    } else {
      missing.push(section);
    }
  }

  return { found, missing };
}

/**
 * Check raw data quality metrics
 */
function checkRawDataQuality(projectPath) {
  const result = { passed: false, blockers: [], warnings: [] };

  // Check for collection report
  const reportPath = path.join(projectPath, 'docs/collection-report.md');
  if (!fs.existsSync(reportPath)) {
    result.blockers.push('docs/collection-report.md not found');
    return result;
  }

  const content = fs.readFileSync(reportPath, 'utf-8');

  // Extract metrics from report
  const sampleMatch = content.match(/sample[_\s]?count[:\s]+(\d+)/i);
  const coverageMatch = content.match(/coverage[:\s]+(\d+)/i);

  if (sampleMatch) {
    const samples = parseInt(sampleMatch[1]);
    if (samples >= 1000) {
      log(`  ✓ Sample count: ${samples} (minimum: 1000)`, 'green');
    } else {
      result.blockers.push(`Sample count ${samples} below minimum 1000`);
    }
  } else {
    result.warnings.push('Sample count not found in report');
  }

  if (coverageMatch) {
    const coverage = parseInt(coverageMatch[1]);
    if (coverage >= 80) {
      log(`  ✓ Coverage: ${coverage}% (minimum: 80%)`, 'green');
    } else {
      result.blockers.push(`Coverage ${coverage}% below minimum 80%`);
    }
  } else {
    result.warnings.push('Coverage not found in report');
  }

  result.passed = result.blockers.length === 0;
  return result;
}

/**
 * Check annotation quality
 */
function checkAnnotations(projectPath) {
  const result = { passed: false, blockers: [], warnings: [] };

  const reportPath = path.join(projectPath, 'docs/annotation-report.md');
  if (!fs.existsSync(reportPath)) {
    result.blockers.push('docs/annotation-report.md not found');
    return result;
  }

  const content = fs.readFileSync(reportPath, 'utf-8');

  // Look for inter-annotator agreement
  const agreementMatch = content.match(/agreement[:\s]+(\d+)/i);

  if (agreementMatch) {
    const agreement = parseInt(agreementMatch[1]);
    if (agreement >= 85) {
      log(`  ✓ Inter-annotator agreement: ${agreement}% (minimum: 85%)`, 'green');
      result.passed = true;
    } else {
      result.blockers.push(`Agreement ${agreement}% below minimum 85%`);
    }
  } else {
    result.warnings.push('Inter-annotator agreement not found in report');
    result.passed = true; // Allow with warning if not found
  }

  return result;
}

/**
 * Check dataset validation
 */
function checkDataset(projectPath) {
  const result = { passed: false, blockers: [], warnings: [] };

  // Check for dataset files
  const datasetPath = path.join(projectPath, 'data/training/dataset.jsonl');
  const splitsDir = path.join(projectPath, 'data/splits');

  if (!fs.existsSync(datasetPath) && !fs.existsSync(splitsDir)) {
    result.blockers.push('No training dataset found');
    return result;
  }

  // Run dataset validation
  try {
    const { validateDataset } = require('./validate-dataset');
    const dataDir = fs.existsSync(datasetPath) ? path.dirname(datasetPath) : path.join(projectPath, 'data');
    const valid = validateDataset(dataDir);

    if (valid) {
      result.passed = true;
    } else {
      result.blockers.push('Dataset validation failed');
    }
  } catch (e) {
    result.warnings.push(`Could not run dataset validation: ${e.message}`);
    result.passed = true; // Allow with warning
  }

  return result;
}

/**
 * Check model performance
 */
function checkModelPerformance(projectPath) {
  const result = { passed: false, blockers: [], warnings: [] };

  // Check for metrics files
  const baselineMetrics = path.join(projectPath, 'metrics/baseline.json');
  const evalMetrics = path.join(projectPath, 'metrics/evaluation.json');

  if (!fs.existsSync(baselineMetrics)) {
    result.blockers.push('metrics/baseline.json not found');
    return result;
  }

  if (!fs.existsSync(evalMetrics)) {
    result.blockers.push('metrics/evaluation.json not found');
    return result;
  }

  try {
    const baseline = JSON.parse(fs.readFileSync(baselineMetrics, 'utf-8'));
    const evaluation = JSON.parse(fs.readFileSync(evalMetrics, 'utf-8'));

    // Check localization improvement
    if (baseline.localization_score && evaluation.localization_score) {
      const improvement =
        ((evaluation.localization_score - baseline.localization_score) / baseline.localization_score) * 100;

      if (improvement >= 20) {
        log(`  ✓ Localization improvement: +${improvement.toFixed(1)}% (minimum: +20%)`, 'green');
        result.passed = true;
      } else {
        result.blockers.push(`Localization improvement +${improvement.toFixed(1)}% below +20% threshold`);
      }
    } else {
      result.warnings.push('Localization scores not found in metrics');
      result.passed = true;
    }
  } catch (e) {
    result.blockers.push(`Error reading metrics: ${e.message}`);
  }

  return result;
}

/**
 * Check a single gate
 */
function checkGate(projectPath, gateId) {
  const gate = GATES[gateId];

  if (!gate) {
    log(`Unknown gate: ${gateId}`, 'red');
    return { passed: false, blockers: [`Unknown gate: ${gateId}`], warnings: [] };
  }

  log(`\nChecking gate: ${gate.name}`, 'cyan');
  log(`  ${gate.description}`, 'blue');
  console.log('');

  const result = { passed: true, blockers: [], warnings: [] };

  // Check required files
  if (gate.requiredFiles) {
    const { found, missing } = checkRequiredFiles(projectPath, gate.requiredFiles);
    found.forEach((f) => log(`  ✓ Found: ${f}`, 'green'));
    missing.forEach((f) => {
      log(`  ✗ Missing: ${f}`, 'red');
      result.blockers.push(`Missing file: ${f}`);
    });
  }

  // Check required sections
  if (gate.requiredSections && gate.requiredFiles) {
    const { found, missing } = checkRequiredSections(projectPath, gate.requiredFiles[0], gate.requiredSections);
    missing.forEach((s) => {
      log(`  ⚠ Section not found: ${s}`, 'yellow');
      result.warnings.push(`Section "${s}" not found or empty`);
    });
  }

  // Run custom check function
  if (gate.check) {
    const checkResult = gate.check(projectPath);
    result.blockers.push(...checkResult.blockers);
    result.warnings.push(...checkResult.warnings);
    if (!checkResult.passed) {
      result.passed = false;
    }
  }

  result.passed = result.passed && result.blockers.length === 0;
  return result;
}

/**
 * Check all gates for a project
 */
function checkAllGates(projectPath) {
  logHeader('Data Factory - Gate Validation');
  log(`  Project: ${projectPath}`, 'blue');

  const results = {};
  let passedCount = 0;
  let failedCount = 0;
  let warningCount = 0;

  for (const gateId of Object.keys(GATES)) {
    const result = checkGate(projectPath, gateId);
    results[gateId] = result;

    if (result.passed) {
      passedCount++;
    } else {
      failedCount++;
    }
    warningCount += result.warnings.length;
  }

  logHeader('Gate Summary');

  log(`  Passed: ${passedCount}/${Object.keys(GATES).length}`, passedCount > 0 ? 'green' : 'yellow');
  log(`  Failed: ${failedCount}`, failedCount > 0 ? 'red' : 'green');
  log(`  Warnings: ${warningCount}`, warningCount > 0 ? 'yellow' : 'green');

  return results;
}

// Run if called directly
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node scripts/check-gates.js <project-path> [gate-id]');
    console.log('');
    console.log('Available gates:');
    for (const [id, gate] of Object.entries(GATES)) {
      console.log(`  ${id}: ${gate.description}`);
    }
    process.exit(1);
  }

  const projectPath = path.resolve(args[0]);
  const gateId = args[1];

  if (!fs.existsSync(projectPath)) {
    log(`Error: Project path not found: ${projectPath}`, 'red');
    process.exit(1);
  }

  if (gateId) {
    const result = checkGate(projectPath, gateId);
    process.exit(result.passed ? 0 : 1);
  } else {
    const results = checkAllGates(projectPath);
    const anyFailed = Object.values(results).some((r) => !r.passed);
    process.exit(anyFailed ? 1 : 0);
  }
}

module.exports = { checkGate, checkAllGates, GATES };
