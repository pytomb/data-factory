/**
 * Data Factory Workflow Definition
 *
 * Defines the phases, steps, and gates for the data collection
 * and model training pipeline.
 */

export type PhaseId =
  | 'discovery'    // What knowledge do we need?
  | 'collection'   // Gather raw material
  | 'preparation'  // Make it training-ready
  | 'training'     // Create the model
  | 'deployment'   // Make it usable
  | 'handoff';     // Connect to MVP Factory

export type StepId =
  // Phase 1: Discovery
  | 'intake'       // Define domain, language, use cases
  | 'sources'      // Identify data sources
  | 'ethics'       // Data governance and consent
  // Phase 2: Collection
  | 'capture'      // Record/digitize/scrape content
  | 'annotate'     // Label data with domain experts
  | 'validate'     // Quality check annotations
  // Phase 3: Preparation
  | 'clean'        // Normalize, dedupe, fix encoding
  | 'format'       // Convert to training format (JSONL)
  | 'split'        // Train/val/test splits
  // Phase 4: Training
  | 'baseline'     // Evaluate base model
  | 'finetune'     // Run training
  | 'evaluate'     // Domain-specific metrics
  // Phase 5: Deployment
  | 'quantize'     // Optimize for target hardware
  | 'registry'     // Push to HuggingFace
  | 'edge-test'    // Verify runs on target devices
  // Phase 6: Handoff
  | 'model-card'   // Document capabilities
  | 'api-spec'     // Define inference API
  | 'examples';    // Sample prompts

export type GateId =
  // Discovery gates
  | 'data-scope-defined'      // Domain, languages, use cases documented
  // Collection gates
  | 'sources-identified'      // Data sources catalogued
  | 'ethics-approved'         // Governance reviewed, consent documented
  | 'raw-data-quality'        // Minimum samples, coverage verified
  // Preparation gates
  | 'annotations-validated'   // Inter-annotator agreement threshold
  | 'dataset-validated'       // Schema valid, no leakage, quality metrics
  // Training gates
  | 'baseline-established'    // Base model performance measured
  | 'model-performance'       // Beats baseline by threshold
  // Deployment gates
  | 'quantization-verified'   // Quantized model maintains quality
  | 'deployment-ready'        // Runs on target hardware
  // Handoff gates
  | 'integration-ready';      // Model card complete, API documented

export type ExpertId =
  | 'domain-expert'           // Subject matter expertise
  | 'data-scientist'          // ML/data expertise
  | 'ethics-reviewer'         // Data governance
  | 'annotation-lead'         // Annotation quality
  | 'ml-engineer';            // Training/deployment

export interface WorkflowStep {
  id: StepId;
  name: string;
  phase: PhaseId;
  agent: string;
  description: string;
  icon: string;
  inputs: string[];
  outputs: string[];
  gate: GateId | null;
  expert: ExpertId | null;
  action: string;
}

export const PHASES: Record<PhaseId, { name: string; description: string; color: string }> = {
  discovery: {
    name: 'Discovery',
    description: 'Define what domain knowledge we need to capture',
    color: 'blue',
  },
  collection: {
    name: 'Collection',
    description: 'Gather and annotate raw training material',
    color: 'purple',
  },
  preparation: {
    name: 'Preparation',
    description: 'Clean and format data for training',
    color: 'orange',
  },
  training: {
    name: 'Training',
    description: 'Fine-tune the base model on domain data',
    color: 'red',
  },
  deployment: {
    name: 'Deployment',
    description: 'Optimize and deploy the trained model',
    color: 'green',
  },
  handoff: {
    name: 'Handoff',
    description: 'Prepare model for use in MVP Factory',
    color: 'teal',
  },
};

export const WORKFLOW_STEPS: WorkflowStep[] = [
  // ============================================================
  // PHASE 1: DISCOVERY
  // ============================================================
  {
    id: 'intake',
    name: 'Domain Intake',
    phase: 'discovery',
    agent: 'Domain Researcher',
    description: 'Define the domain, target languages, dialects, and intended use cases. What knowledge should the model have?',
    icon: 'BookOpen',
    inputs: [],
    outputs: ['docs/domain-brief.md'],
    gate: null,
    expert: 'domain-expert',
    action: 'intake',
  },
  {
    id: 'sources',
    name: 'Source Identification',
    phase: 'discovery',
    agent: 'Source Scout',
    description: 'Identify and evaluate potential data sources: textbooks, curricula, expert interviews, existing corpora, web content.',
    icon: 'Search',
    inputs: ['docs/domain-brief.md'],
    outputs: ['docs/data-sources.md', 'docs/source-inventory.md'],
    gate: 'sources-identified',
    expert: 'domain-expert',
    action: 'sources',
  },
  {
    id: 'ethics',
    name: 'Data Ethics Review',
    phase: 'discovery',
    agent: 'Ethics Reviewer',
    description: 'Review data governance requirements: consent, privacy, sovereignty, licensing. Document ethical considerations.',
    icon: 'Shield',
    inputs: ['docs/data-sources.md'],
    outputs: ['docs/data-governance.md', 'docs/consent-log.md'],
    gate: 'ethics-approved',
    expert: 'ethics-reviewer',
    action: 'ethics',
  },

  // ============================================================
  // PHASE 2: COLLECTION
  // ============================================================
  {
    id: 'capture',
    name: 'Data Capture',
    phase: 'collection',
    agent: 'Data Collector',
    description: 'Execute data collection: record interviews, digitize documents, scrape approved sources, gather expert contributions.',
    icon: 'Download',
    inputs: ['docs/data-sources.md', 'docs/data-governance.md'],
    outputs: ['data/raw/'],
    gate: null,
    expert: null,
    action: 'capture',
  },
  {
    id: 'annotate',
    name: 'Annotation',
    phase: 'collection',
    agent: 'Annotation Lead',
    description: 'Label data with domain experts: topic tags, difficulty levels, language markers, local context indicators.',
    icon: 'Tag',
    inputs: ['data/raw/'],
    outputs: ['data/annotated/', 'docs/annotation-guidelines.md'],
    gate: 'annotations-validated',
    expert: 'annotation-lead',
    action: 'annotate',
  },
  {
    id: 'validate',
    name: 'Collection Validation',
    phase: 'collection',
    agent: 'Quality Validator',
    description: 'Verify collection quality: sample counts, coverage metrics, annotation agreement, source diversity.',
    icon: 'CheckCircle',
    inputs: ['data/annotated/'],
    outputs: ['docs/collection-report.md'],
    gate: 'raw-data-quality',
    expert: 'data-scientist',
    action: 'validate',
  },

  // ============================================================
  // PHASE 3: PREPARATION
  // ============================================================
  {
    id: 'clean',
    name: 'Data Cleaning',
    phase: 'preparation',
    agent: 'Data Cleaner',
    description: 'Normalize text, fix encoding issues, remove duplicates, handle missing values, standardize formats.',
    icon: 'Eraser',
    inputs: ['data/annotated/'],
    outputs: ['data/cleaned/'],
    gate: null,
    expert: null,
    action: 'clean',
  },
  {
    id: 'format',
    name: 'Format Conversion',
    phase: 'preparation',
    agent: 'Format Converter',
    description: 'Convert cleaned data to training format (JSONL with instruction/input/output structure).',
    icon: 'FileJson',
    inputs: ['data/cleaned/'],
    outputs: ['data/training/dataset.jsonl'],
    gate: null,
    expert: null,
    action: 'format',
  },
  {
    id: 'split',
    name: 'Dataset Splitting',
    phase: 'preparation',
    agent: 'Split Manager',
    description: 'Create train/validation/test splits with proper stratification. Verify no data leakage.',
    icon: 'Split',
    inputs: ['data/training/dataset.jsonl'],
    outputs: ['data/splits/train.jsonl', 'data/splits/val.jsonl', 'data/splits/test.jsonl'],
    gate: 'dataset-validated',
    expert: 'data-scientist',
    action: 'split',
  },

  // ============================================================
  // PHASE 4: TRAINING
  // ============================================================
  {
    id: 'baseline',
    name: 'Baseline Evaluation',
    phase: 'training',
    agent: 'Baseline Evaluator',
    description: 'Measure base model performance on domain tasks BEFORE fine-tuning. Establish the improvement target.',
    icon: 'BarChart2',
    inputs: ['data/splits/test.jsonl'],
    outputs: ['docs/baseline-eval.md', 'metrics/baseline.json'],
    gate: 'baseline-established',
    expert: 'ml-engineer',
    action: 'baseline',
  },
  {
    id: 'finetune',
    name: 'Fine-tuning',
    phase: 'training',
    agent: 'Training Runner',
    description: 'Run fine-tuning job using Unsloth/Axolotl. Monitor loss, save checkpoints, track experiments.',
    icon: 'Cpu',
    inputs: ['data/splits/train.jsonl', 'data/splits/val.jsonl'],
    outputs: ['models/checkpoints/', 'logs/training.log'],
    gate: null,
    expert: 'ml-engineer',
    action: 'finetune',
  },
  {
    id: 'evaluate',
    name: 'Model Evaluation',
    phase: 'training',
    agent: 'Model Evaluator',
    description: 'Comprehensive evaluation: domain metrics, human preference, factual accuracy, localization score.',
    icon: 'Award',
    inputs: ['models/checkpoints/', 'data/splits/test.jsonl'],
    outputs: ['docs/model-eval.md', 'metrics/evaluation.json'],
    gate: 'model-performance',
    expert: 'ml-engineer',
    action: 'evaluate',
  },

  // ============================================================
  // PHASE 5: DEPLOYMENT
  // ============================================================
  {
    id: 'quantize',
    name: 'Quantization',
    phase: 'deployment',
    agent: 'Quantization Expert',
    description: 'Optimize model for target hardware: 4-bit/8-bit quantization, GGUF conversion for edge deployment.',
    icon: 'Minimize2',
    inputs: ['models/checkpoints/'],
    outputs: ['models/quantized/'],
    gate: 'quantization-verified',
    expert: 'ml-engineer',
    action: 'quantize',
  },
  {
    id: 'registry',
    name: 'Registry Push',
    phase: 'deployment',
    agent: 'Registry Manager',
    description: 'Push model to HuggingFace Hub or private registry. Configure access and versioning.',
    icon: 'Upload',
    inputs: ['models/quantized/'],
    outputs: ['docs/registry-info.md'],
    gate: null,
    expert: null,
    action: 'registry',
  },
  {
    id: 'edge-test',
    name: 'Edge Testing',
    phase: 'deployment',
    agent: 'Edge Tester',
    description: 'Verify model runs on target hardware: CPU inference speed, memory usage, offline operation.',
    icon: 'Smartphone',
    inputs: ['models/quantized/'],
    outputs: ['docs/edge-verification.md'],
    gate: 'deployment-ready',
    expert: 'ml-engineer',
    action: 'edge-test',
  },

  // ============================================================
  // PHASE 6: HANDOFF
  // ============================================================
  {
    id: 'model-card',
    name: 'Model Card',
    phase: 'handoff',
    agent: 'Documentation Writer',
    description: 'Create comprehensive model card: capabilities, limitations, biases, intended use, training data summary.',
    icon: 'FileText',
    inputs: ['docs/model-eval.md', 'docs/domain-brief.md'],
    outputs: ['docs/model-card.md'],
    gate: null,
    expert: 'domain-expert',
    action: 'model-card',
  },
  {
    id: 'api-spec',
    name: 'API Specification',
    phase: 'handoff',
    agent: 'API Designer',
    description: 'Define how applications will call the model: input format, parameters, response structure.',
    icon: 'Code',
    inputs: ['models/quantized/'],
    outputs: ['docs/inference-api.md', 'factory/model-config.json'],
    gate: null,
    expert: 'ml-engineer',
    action: 'api-spec',
  },
  {
    id: 'examples',
    name: 'Prompt Examples',
    phase: 'handoff',
    agent: 'Example Curator',
    description: 'Create library of effective prompts: what works well, edge cases, failure modes to avoid.',
    icon: 'MessageSquare',
    inputs: ['docs/model-eval.md'],
    outputs: ['docs/prompt-examples.md', 'factory/example-prompts.json'],
    gate: 'integration-ready',
    expert: 'domain-expert',
    action: 'examples',
  },
];

export const GATES: Record<GateId, { name: string; description: string; script: string }> = {
  'data-scope-defined': {
    name: 'Data Scope Defined',
    description: 'Domain, target languages, and use cases are clearly documented',
    script: 'scripts/check-scope.js',
  },
  'sources-identified': {
    name: 'Sources Identified',
    description: 'Data sources catalogued with access method and quality assessment',
    script: 'scripts/check-sources.js',
  },
  'ethics-approved': {
    name: 'Ethics Approved',
    description: 'Data governance reviewed, consent documented, sovereignty requirements met',
    script: 'scripts/check-ethics.js',
  },
  'raw-data-quality': {
    name: 'Raw Data Quality',
    description: 'Minimum samples collected (1000+), coverage verified (80%+), source diversity (3+)',
    script: 'scripts/check-raw-quality.js',
  },
  'annotations-validated': {
    name: 'Annotations Validated',
    description: 'Inter-annotator agreement meets threshold (85%+)',
    script: 'scripts/check-annotations.js',
  },
  'dataset-validated': {
    name: 'Dataset Validated',
    description: 'Schema valid, no train/test leakage, quality metrics pass',
    script: 'scripts/validate-dataset.js',
  },
  'baseline-established': {
    name: 'Baseline Established',
    description: 'Base model performance measured on domain tasks',
    script: 'scripts/check-baseline.js',
  },
  'model-performance': {
    name: 'Model Performance',
    description: 'Fine-tuned model beats baseline by threshold (+20% localization)',
    script: 'scripts/check-model-performance.js',
  },
  'quantization-verified': {
    name: 'Quantization Verified',
    description: 'Quantized model maintains quality within acceptable degradation',
    script: 'scripts/check-quantization.js',
  },
  'deployment-ready': {
    name: 'Deployment Ready',
    description: 'Model runs on target hardware with acceptable speed and memory',
    script: 'scripts/check-deployment.js',
  },
  'integration-ready': {
    name: 'Integration Ready',
    description: 'Model card complete, API documented, examples validated',
    script: 'scripts/check-integration.js',
  },
};

/**
 * Get steps for a specific phase
 */
export function getPhaseSteps(phaseId: PhaseId): WorkflowStep[] {
  return WORKFLOW_STEPS.filter(step => step.phase === phaseId);
}

/**
 * Get the next step after a given step
 */
export function getNextStep(currentStepId: StepId): WorkflowStep | null {
  const currentIndex = WORKFLOW_STEPS.findIndex(s => s.id === currentStepId);
  if (currentIndex === -1 || currentIndex === WORKFLOW_STEPS.length - 1) {
    return null;
  }
  return WORKFLOW_STEPS[currentIndex + 1];
}

/**
 * Get step by ID
 */
export function getStep(stepId: StepId): WorkflowStep | undefined {
  return WORKFLOW_STEPS.find(s => s.id === stepId);
}

/**
 * Calculate workflow progress
 */
export function calculateProgress(completedSteps: StepId[]): number {
  return (completedSteps.length / WORKFLOW_STEPS.length) * 100;
}
