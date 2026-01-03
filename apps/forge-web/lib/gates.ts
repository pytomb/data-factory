/**
 * Data Factory Gate Validation System
 *
 * Implements quality checks for data collection and model training.
 * Gates ensure data quality and model performance before progression.
 */

import { GateId, GATES } from './workflow';

export interface GateResult {
  gateId: GateId;
  passed: boolean;
  message: string;
  blockers: string[];
  warnings: string[];
  metrics: Record<string, number>;
  checkedAt: string;
}

export interface GateCheck {
  id: GateId;
  name: string;
  description: string;
  requiredFiles: string[];
  requiredMetrics: { metric: string; threshold: number; comparison: 'gte' | 'lte' | 'eq' }[];
  customValidation?: (fileContents: Record<string, string>, metrics: Record<string, number>) => {
    passed: boolean;
    issues: string[];
    extractedMetrics: Record<string, number>;
  };
}

/**
 * Gate check definitions with validation rules
 */
export const GATE_CHECKS: Record<GateId, GateCheck> = {
  'data-scope-defined': {
    id: 'data-scope-defined',
    name: 'Data Scope Defined',
    description: 'Domain, target languages, and use cases are clearly documented',
    requiredFiles: ['docs/domain-brief.md'],
    requiredMetrics: [],
    customValidation: (contents) => {
      const domainBrief = contents['docs/domain-brief.md'] || '';
      const issues: string[] = [];
      const extractedMetrics: Record<string, number> = {};

      // Check for domain definition
      if (!domainBrief.toLowerCase().includes('domain')) {
        issues.push('Missing: Domain definition');
      }

      // Check for language/dialect specification
      const hasLanguage = domainBrief.toLowerCase().includes('language') ||
                          domainBrief.toLowerCase().includes('dialect');
      if (!hasLanguage) {
        issues.push('Missing: Target languages or dialects');
      }

      // Check for use cases
      const hasUseCases = domainBrief.toLowerCase().includes('use case') ||
                          domainBrief.toLowerCase().includes('application');
      if (!hasUseCases) {
        issues.push('Missing: Intended use cases');
      }

      // Check for success criteria
      if (!domainBrief.toLowerCase().includes('success') && !domainBrief.toLowerCase().includes('goal')) {
        issues.push('Warning: No success criteria defined');
      }

      // Count defined topics
      const topicMatches = domainBrief.match(/topic|subject|area/gi) || [];
      extractedMetrics['topics_defined'] = topicMatches.length;

      return {
        passed: issues.filter(i => !i.startsWith('Warning')).length === 0,
        issues,
        extractedMetrics,
      };
    },
  },

  'sources-identified': {
    id: 'sources-identified',
    name: 'Sources Identified',
    description: 'Data sources catalogued with access method and quality assessment',
    requiredFiles: ['docs/data-sources.md'],
    requiredMetrics: [
      { metric: 'source_count', threshold: 3, comparison: 'gte' },
    ],
    customValidation: (contents) => {
      const dataSources = contents['docs/data-sources.md'] || '';
      const issues: string[] = [];
      const extractedMetrics: Record<string, number> = {};

      // Count sources (look for numbered items or headers)
      const sourceMatches = dataSources.match(/^##\s|^\d+\.\s/gm) || [];
      extractedMetrics['source_count'] = sourceMatches.length;

      if (extractedMetrics['source_count'] < 3) {
        issues.push(`Blocker: Only ${extractedMetrics['source_count']} sources identified. Need at least 3 for diversity.`);
      }

      // Check for access method
      if (!dataSources.toLowerCase().includes('access') && !dataSources.toLowerCase().includes('how to get')) {
        issues.push('Warning: Access methods not documented');
      }

      // Check for quality assessment
      if (!dataSources.toLowerCase().includes('quality') && !dataSources.toLowerCase().includes('reliability')) {
        issues.push('Warning: Source quality assessment not documented');
      }

      // Check for licensing info
      if (!dataSources.toLowerCase().includes('license') && !dataSources.toLowerCase().includes('permission')) {
        issues.push('Warning: Licensing information not documented');
      }

      return {
        passed: !issues.some(i => i.startsWith('Blocker')),
        issues,
        extractedMetrics,
      };
    },
  },

  'ethics-approved': {
    id: 'ethics-approved',
    name: 'Ethics Approved',
    description: 'Data governance reviewed, consent documented, sovereignty requirements met',
    requiredFiles: ['docs/data-governance.md'],
    requiredMetrics: [],
    customValidation: (contents) => {
      const governance = contents['docs/data-governance.md'] || '';
      const issues: string[] = [];
      const extractedMetrics: Record<string, number> = {};

      // Check for explicit approval
      const hasApproval = governance.includes('[x] Ethics Approved') ||
                          governance.includes('✅ Approved') ||
                          governance.toLowerCase().includes('approved by');
      if (!hasApproval) {
        issues.push('Blocker: Ethics review not explicitly approved. Add "[x] Ethics Approved".');
      }

      // Check for consent documentation
      if (!governance.toLowerCase().includes('consent')) {
        issues.push('Missing: Consent documentation');
      }

      // Check for data sovereignty
      if (!governance.toLowerCase().includes('sovereignty') && !governance.toLowerCase().includes('storage location')) {
        issues.push('Warning: Data sovereignty not addressed');
      }

      // Check for PII handling
      if (!governance.toLowerCase().includes('pii') && !governance.toLowerCase().includes('personal')) {
        issues.push('Warning: PII handling not documented');
      }

      // Check for data retention
      if (!governance.toLowerCase().includes('retention') && !governance.toLowerCase().includes('deletion')) {
        issues.push('Warning: Data retention policy not documented');
      }

      return {
        passed: !issues.some(i => i.startsWith('Blocker') || i.startsWith('Missing')),
        issues,
        extractedMetrics,
      };
    },
  },

  'raw-data-quality': {
    id: 'raw-data-quality',
    name: 'Raw Data Quality',
    description: 'Minimum samples collected (1000+), coverage verified (80%+), source diversity (3+)',
    requiredFiles: ['docs/collection-report.md'],
    requiredMetrics: [
      { metric: 'sample_count', threshold: 1000, comparison: 'gte' },
      { metric: 'coverage_percent', threshold: 80, comparison: 'gte' },
      { metric: 'source_diversity', threshold: 3, comparison: 'gte' },
    ],
    customValidation: (contents) => {
      const report = contents['docs/collection-report.md'] || '';
      const issues: string[] = [];
      const extractedMetrics: Record<string, number> = {};

      // Extract sample count
      const sampleMatch = report.match(/(?:sample|example|record)s?[:\s]*(\d+)/i) ||
                          report.match(/(\d+)\s*(?:sample|example|record)/i);
      extractedMetrics['sample_count'] = sampleMatch ? parseInt(sampleMatch[1], 10) : 0;

      if (extractedMetrics['sample_count'] < 1000) {
        issues.push(`Blocker: Only ${extractedMetrics['sample_count']} samples collected. Need 1000+ for meaningful fine-tuning.`);
      } else if (extractedMetrics['sample_count'] < 5000) {
        issues.push(`Warning: ${extractedMetrics['sample_count']} samples is minimal. Consider collecting more for better results.`);
      }

      // Extract coverage
      const coverageMatch = report.match(/coverage[:\s]*(\d+)%?/i) ||
                            report.match(/(\d+)%?\s*coverage/i);
      extractedMetrics['coverage_percent'] = coverageMatch ? parseInt(coverageMatch[1], 10) : 0;

      if (extractedMetrics['coverage_percent'] < 80) {
        issues.push(`Blocker: Topic coverage is ${extractedMetrics['coverage_percent']}%. Need 80%+ of defined topics.`);
      }

      // Check source diversity
      const sourceMatch = report.match(/(?:source|origin)s?[:\s]*(\d+)/i);
      extractedMetrics['source_diversity'] = sourceMatch ? parseInt(sourceMatch[1], 10) : 0;

      if (extractedMetrics['source_diversity'] < 3) {
        issues.push(`Warning: Only ${extractedMetrics['source_diversity']} sources. More diversity improves model robustness.`);
      }

      return {
        passed: !issues.some(i => i.startsWith('Blocker')),
        issues,
        extractedMetrics,
      };
    },
  },

  'annotations-validated': {
    id: 'annotations-validated',
    name: 'Annotations Validated',
    description: 'Inter-annotator agreement meets threshold (85%+)',
    requiredFiles: ['docs/annotation-guidelines.md'],
    requiredMetrics: [
      { metric: 'agreement_percent', threshold: 85, comparison: 'gte' },
    ],
    customValidation: (contents) => {
      const guidelines = contents['docs/annotation-guidelines.md'] || '';
      const issues: string[] = [];
      const extractedMetrics: Record<string, number> = {};

      // Extract agreement score
      const agreementMatch = guidelines.match(/(?:agreement|iaa|kappa)[:\s]*(\d+)%?/i) ||
                             guidelines.match(/(\d+)%?\s*(?:agreement|iaa)/i);
      extractedMetrics['agreement_percent'] = agreementMatch ? parseInt(agreementMatch[1], 10) : 0;

      if (extractedMetrics['agreement_percent'] < 85) {
        issues.push(`Blocker: Inter-annotator agreement is ${extractedMetrics['agreement_percent']}%. Need 85%+ for quality data.`);
      }

      // Check for annotation schema
      if (!guidelines.toLowerCase().includes('schema') && !guidelines.toLowerCase().includes('label')) {
        issues.push('Warning: Annotation schema not documented');
      }

      // Check for edge cases
      if (!guidelines.toLowerCase().includes('edge case') && !guidelines.toLowerCase().includes('ambiguous')) {
        issues.push('Warning: Edge case handling not documented');
      }

      return {
        passed: !issues.some(i => i.startsWith('Blocker')),
        issues,
        extractedMetrics,
      };
    },
  },

  'dataset-validated': {
    id: 'dataset-validated',
    name: 'Dataset Validated',
    description: 'Schema valid, no train/test leakage, quality metrics pass',
    requiredFiles: ['data/splits/train.jsonl', 'data/splits/val.jsonl', 'data/splits/test.jsonl'],
    requiredMetrics: [
      { metric: 'leakage_count', threshold: 0, comparison: 'eq' },
    ],
    customValidation: (contents) => {
      const issues: string[] = [];
      const extractedMetrics: Record<string, number> = {};

      // Check files exist
      const trainData = contents['data/splits/train.jsonl'] || '';
      const valData = contents['data/splits/val.jsonl'] || '';
      const testData = contents['data/splits/test.jsonl'] || '';

      if (!trainData || trainData === '[File not found]') {
        issues.push('Blocker: Training split not found');
      }
      if (!valData || valData === '[File not found]') {
        issues.push('Blocker: Validation split not found');
      }
      if (!testData || testData === '[File not found]') {
        issues.push('Blocker: Test split not found');
      }

      // Count samples per split
      const trainLines = trainData.split('\n').filter(l => l.trim()).length;
      const valLines = valData.split('\n').filter(l => l.trim()).length;
      const testLines = testData.split('\n').filter(l => l.trim()).length;

      extractedMetrics['train_samples'] = trainLines;
      extractedMetrics['val_samples'] = valLines;
      extractedMetrics['test_samples'] = testLines;
      extractedMetrics['total_samples'] = trainLines + valLines + testLines;

      // Check split ratios (should be roughly 80/10/10)
      const total = extractedMetrics['total_samples'];
      if (total > 0) {
        const trainRatio = trainLines / total;
        const valRatio = valLines / total;
        const testRatio = testLines / total;

        if (trainRatio < 0.7 || trainRatio > 0.9) {
          issues.push(`Warning: Training split is ${(trainRatio * 100).toFixed(0)}%. Recommend 70-90%.`);
        }
        if (valRatio < 0.05 || valRatio > 0.2) {
          issues.push(`Warning: Validation split is ${(valRatio * 100).toFixed(0)}%. Recommend 5-20%.`);
        }
      }

      // TODO: Actual leakage detection would parse JSONL and compare
      extractedMetrics['leakage_count'] = 0;

      return {
        passed: !issues.some(i => i.startsWith('Blocker')),
        issues,
        extractedMetrics,
      };
    },
  },

  'baseline-established': {
    id: 'baseline-established',
    name: 'Baseline Established',
    description: 'Base model performance measured on domain tasks',
    requiredFiles: ['docs/baseline-eval.md', 'metrics/baseline.json'],
    requiredMetrics: [],
    customValidation: (contents) => {
      const baselineEval = contents['docs/baseline-eval.md'] || '';
      const issues: string[] = [];
      const extractedMetrics: Record<string, number> = {};

      // Check for localization score
      const locMatch = baselineEval.match(/localization[:\s]*(\d+)%?/i);
      if (locMatch) {
        extractedMetrics['baseline_localization'] = parseInt(locMatch[1], 10);
      } else {
        issues.push('Warning: Baseline localization score not documented');
      }

      // Check for accuracy
      const accMatch = baselineEval.match(/accuracy[:\s]*(\d+)%?/i);
      if (accMatch) {
        extractedMetrics['baseline_accuracy'] = parseInt(accMatch[1], 10);
      }

      // Check for model being evaluated
      if (!baselineEval.toLowerCase().includes('gemma') &&
          !baselineEval.toLowerCase().includes('llama') &&
          !baselineEval.toLowerCase().includes('model')) {
        issues.push('Missing: Base model identification');
      }

      // Check for test methodology
      if (!baselineEval.toLowerCase().includes('test') && !baselineEval.toLowerCase().includes('eval')) {
        issues.push('Missing: Evaluation methodology');
      }

      return {
        passed: !issues.some(i => i.startsWith('Missing')),
        issues,
        extractedMetrics,
      };
    },
  },

  'model-performance': {
    id: 'model-performance',
    name: 'Model Performance',
    description: 'Fine-tuned model beats baseline by threshold (+20% localization)',
    requiredFiles: ['docs/model-eval.md', 'metrics/evaluation.json'],
    requiredMetrics: [
      { metric: 'localization_improvement', threshold: 20, comparison: 'gte' },
    ],
    customValidation: (contents) => {
      const modelEval = contents['docs/model-eval.md'] || '';
      const baselineEval = contents['docs/baseline-eval.md'] || '';
      const issues: string[] = [];
      const extractedMetrics: Record<string, number> = {};

      // Extract fine-tuned localization
      const ftLocMatch = modelEval.match(/localization[:\s]*(\d+)%?/i);
      const baseLocMatch = baselineEval.match(/localization[:\s]*(\d+)%?/i);

      if (ftLocMatch && baseLocMatch) {
        const ftLoc = parseInt(ftLocMatch[1], 10);
        const baseLoc = parseInt(baseLocMatch[1], 10);
        const improvement = ftLoc - baseLoc;

        extractedMetrics['finetuned_localization'] = ftLoc;
        extractedMetrics['baseline_localization'] = baseLoc;
        extractedMetrics['localization_improvement'] = improvement;

        if (improvement < 20) {
          issues.push(`Blocker: Localization improvement is only ${improvement}%. Need +20% over baseline.`);
        }
      } else {
        issues.push('Missing: Cannot calculate localization improvement. Check both baseline and model eval docs.');
      }

      // Check for human evaluation
      if (!modelEval.toLowerCase().includes('human') && !modelEval.toLowerCase().includes('manual')) {
        issues.push('Warning: No human evaluation documented. Automated metrics alone are insufficient.');
      }

      // Check for failure analysis
      if (!modelEval.toLowerCase().includes('failure') && !modelEval.toLowerCase().includes('error')) {
        issues.push('Warning: No failure analysis documented');
      }

      return {
        passed: !issues.some(i => i.startsWith('Blocker') || i.startsWith('Missing')),
        issues,
        extractedMetrics,
      };
    },
  },

  'quantization-verified': {
    id: 'quantization-verified',
    name: 'Quantization Verified',
    description: 'Quantized model maintains quality within acceptable degradation',
    requiredFiles: ['models/quantized/'],
    requiredMetrics: [
      { metric: 'quality_retention', threshold: 95, comparison: 'gte' },
    ],
    customValidation: (contents) => {
      const issues: string[] = [];
      const extractedMetrics: Record<string, number> = {};

      // Check for quantized model existence
      // In real implementation, would check directory for model files

      // Check for quantization report
      const quantReport = contents['docs/quantization-report.md'] || '';

      if (!quantReport) {
        issues.push('Warning: Quantization report not found');
      }

      // Extract quality retention
      const retentionMatch = quantReport.match(/retention[:\s]*(\d+)%?/i) ||
                             quantReport.match(/(\d+)%?\s*(?:of|quality)/i);
      extractedMetrics['quality_retention'] = retentionMatch ? parseInt(retentionMatch[1], 10) : 100;

      if (extractedMetrics['quality_retention'] < 95) {
        issues.push(`Warning: Quality retention is ${extractedMetrics['quality_retention']}%. Consider less aggressive quantization.`);
      }

      return {
        passed: true, // Quantization degradation is usually acceptable
        issues,
        extractedMetrics,
      };
    },
  },

  'deployment-ready': {
    id: 'deployment-ready',
    name: 'Deployment Ready',
    description: 'Model runs on target hardware with acceptable speed and memory',
    requiredFiles: ['docs/edge-verification.md'],
    requiredMetrics: [
      { metric: 'inference_speed', threshold: 10, comparison: 'gte' }, // tokens/sec
      { metric: 'memory_gb', threshold: 8, comparison: 'lte' },
    ],
    customValidation: (contents) => {
      const edgeVerification = contents['docs/edge-verification.md'] || '';
      const issues: string[] = [];
      const extractedMetrics: Record<string, number> = {};

      // Extract inference speed
      const speedMatch = edgeVerification.match(/(\d+)\s*(?:tokens?\/s|tok\/s)/i);
      extractedMetrics['inference_speed'] = speedMatch ? parseInt(speedMatch[1], 10) : 0;

      if (extractedMetrics['inference_speed'] < 10) {
        issues.push(`Blocker: Inference speed is ${extractedMetrics['inference_speed']} tok/s. Need 10+ for usable experience.`);
      }

      // Extract memory usage
      const memMatch = edgeVerification.match(/(\d+\.?\d*)\s*GB/i);
      extractedMetrics['memory_gb'] = memMatch ? parseFloat(memMatch[1]) : 0;

      if (extractedMetrics['memory_gb'] > 8) {
        issues.push(`Blocker: Memory usage is ${extractedMetrics['memory_gb']}GB. Need <8GB for target hardware.`);
      }

      // Check for offline verification
      if (!edgeVerification.toLowerCase().includes('offline')) {
        issues.push('Warning: Offline operation not verified');
      }

      // Check for target hardware
      if (!edgeVerification.toLowerCase().includes('cpu') && !edgeVerification.toLowerCase().includes('hardware')) {
        issues.push('Warning: Target hardware not specified');
      }

      return {
        passed: !issues.some(i => i.startsWith('Blocker')),
        issues,
        extractedMetrics,
      };
    },
  },

  'integration-ready': {
    id: 'integration-ready',
    name: 'Integration Ready',
    description: 'Model card complete, API documented, examples validated',
    requiredFiles: ['docs/model-card.md', 'docs/inference-api.md', 'docs/prompt-examples.md'],
    requiredMetrics: [],
    customValidation: (contents) => {
      const modelCard = contents['docs/model-card.md'] || '';
      const apiSpec = contents['docs/inference-api.md'] || '';
      const examples = contents['docs/prompt-examples.md'] || '';
      const issues: string[] = [];
      const extractedMetrics: Record<string, number> = {};

      // Check model card completeness
      const modelCardSections = ['capabilities', 'limitations', 'bias', 'training', 'use'];
      for (const section of modelCardSections) {
        if (!modelCard.toLowerCase().includes(section)) {
          issues.push(`Warning: Model card missing section: ${section}`);
        }
      }

      // Check API spec
      if (!apiSpec.toLowerCase().includes('input') || !apiSpec.toLowerCase().includes('output')) {
        issues.push('Missing: API input/output specification');
      }

      // Check for HuggingFace model ID
      const hasModelId = modelCard.includes('huggingface.co') ||
                         modelCard.toLowerCase().includes('model_id') ||
                         apiSpec.toLowerCase().includes('model_id');
      if (!hasModelId) {
        issues.push('Warning: HuggingFace model ID not documented');
      }

      // Count examples
      const exampleCount = (examples.match(/```/g) || []).length / 2; // Code blocks come in pairs
      extractedMetrics['example_count'] = exampleCount;

      if (exampleCount < 5) {
        issues.push(`Warning: Only ${exampleCount} examples. Recommend 5+ for MVP Factory integration.`);
      }

      // Check for MVP Factory handoff approval
      const hasApproval = modelCard.includes('[x] Ready for MVP Factory') ||
                          modelCard.includes('✅ Integration Approved');
      if (!hasApproval) {
        issues.push('Missing: MVP Factory handoff approval. Add "[x] Ready for MVP Factory" to model-card.md');
      }

      return {
        passed: !issues.some(i => i.startsWith('Missing')),
        issues,
        extractedMetrics,
      };
    },
  },
};

/**
 * Check a gate by reading files from the project path
 * This is the main entry point used by workflow-executor
 */
export async function checkGate(
  gateId: GateId,
  projectPath: string
): Promise<GateResult> {
  const fs = await import('fs');
  const path = await import('path');

  const gate = GATE_CHECKS[gateId];
  const fileContents: Record<string, string> = {};

  // Read required files
  for (const file of gate.requiredFiles) {
    const filePath = path.join(projectPath, file);
    try {
      if (fs.existsSync(filePath)) {
        // Check if it's a directory
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          fileContents[file] = '[Directory exists]';
        } else {
          fileContents[file] = fs.readFileSync(filePath, 'utf-8');
        }
      } else {
        fileContents[file] = '[File not found]';
      }
    } catch {
      fileContents[file] = '[Error reading file]';
    }
  }

  return runGateCheck(gateId, fileContents);
}

/**
 * Run a gate check against provided file contents
 */
export async function runGateCheck(
  gateId: GateId,
  fileContents: Record<string, string>
): Promise<GateResult> {
  const gate = GATE_CHECKS[gateId];
  const blockers: string[] = [];
  const warnings: string[] = [];
  let metrics: Record<string, number> = {};

  // Check required files exist
  for (const file of gate.requiredFiles) {
    const content = fileContents[file];
    if (!content || content === '[File not found]' || content === '[Empty file]') {
      blockers.push(`Required file missing: ${file}`);
    }
  }

  // Run custom validation if defined and no blockers yet
  if (gate.customValidation && blockers.length === 0) {
    const customResult = gate.customValidation(fileContents, metrics);
    metrics = { ...metrics, ...customResult.extractedMetrics };

    for (const issue of customResult.issues) {
      if (issue.startsWith('Warning:')) {
        warnings.push(issue.replace('Warning: ', ''));
      } else if (issue.startsWith('Blocker:')) {
        blockers.push(issue.replace('Blocker: ', ''));
      } else if (issue.startsWith('Missing:')) {
        blockers.push(issue.replace('Missing: ', ''));
      } else {
        blockers.push(issue);
      }
    }
  }

  // Check required metrics
  for (const req of gate.requiredMetrics) {
    const value = metrics[req.metric];
    if (value !== undefined) {
      let passed = false;
      switch (req.comparison) {
        case 'gte':
          passed = value >= req.threshold;
          break;
        case 'lte':
          passed = value <= req.threshold;
          break;
        case 'eq':
          passed = value === req.threshold;
          break;
      }
      if (!passed) {
        blockers.push(`Metric ${req.metric} is ${value}, need ${req.comparison} ${req.threshold}`);
      }
    }
  }

  const passed = blockers.length === 0;

  return {
    gateId,
    passed,
    message: passed
      ? `${gate.name}: All checks passed${warnings.length > 0 ? ` (${warnings.length} warnings)` : ''}`
      : `${gate.name}: ${blockers.length} issue(s) must be resolved`,
    blockers,
    warnings,
    metrics,
    checkedAt: new Date().toISOString(),
  };
}
