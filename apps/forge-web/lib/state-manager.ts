/**
 * Data Factory State Manager
 *
 * Handles reading/writing workflow state from the file system.
 * Manages .factory/ directory structure for data projects.
 */

import * as fs from 'fs';
import * as path from 'path';
import { WorkflowState, initializeWorkflowState } from './workflow-executor';

const FACTORY_DIR = '.factory';
const STATE_FILE = 'state.json';
const CONFIG_FILE = 'config.json';
const DATA_MANIFEST_FILE = 'data-manifest.json';

export interface FactoryConfig {
  project_name: string;
  display_name: string;
  factory_version: string;
  domain: {
    name: string;
    languages: string[];
    use_cases: string[];
  };
  base_model: {
    id: string;
    provider: string;
    size: string;
  };
  target_hardware: {
    type: 'cloud' | 'edge' | 'both';
    min_memory_gb: number;
    quantization: string;
  };
  created_at: string;
  last_updated: string;
}

export interface DataManifest {
  project_id: string;
  datasets: Record<string, DatasetInfo>;
  models: Record<string, ModelInfo>;
  last_updated: string;
}

export interface DatasetInfo {
  id: string;
  name: string;
  path: string;
  format: 'raw' | 'annotated' | 'cleaned' | 'training';
  sample_count: number;
  size_mb: number;
  created_at: string;
  validated: boolean;
  validation_report?: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  path: string;
  base_model: string;
  checkpoint: string;
  quantization?: string;
  metrics?: Record<string, number>;
  created_at: string;
  deployed: boolean;
  registry_url?: string;
}

/**
 * Ensure .factory directory exists
 */
export function ensureFactoryDir(projectPath: string): string {
  const factoryDir = path.join(projectPath, FACTORY_DIR);
  if (!fs.existsSync(factoryDir)) {
    fs.mkdirSync(factoryDir, { recursive: true });
  }
  return factoryDir;
}

/**
 * Read workflow state from project
 */
export function readState(projectPath: string): WorkflowState | null {
  const statePath = path.join(projectPath, FACTORY_DIR, STATE_FILE);

  // Also check root level for legacy projects
  const legacyPath = path.join(projectPath, STATE_FILE);

  let targetPath = statePath;
  if (!fs.existsSync(statePath) && fs.existsSync(legacyPath)) {
    targetPath = legacyPath;
  }

  if (!fs.existsSync(targetPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(targetPath, 'utf-8');
    return JSON.parse(content) as WorkflowState;
  } catch (error) {
    console.error(`Error reading state from ${targetPath}:`, error);
    return null;
  }
}

/**
 * Write workflow state to project
 */
export function writeState(projectPath: string, state: WorkflowState): void {
  const factoryDir = ensureFactoryDir(projectPath);
  const statePath = path.join(factoryDir, STATE_FILE);

  const updatedState = {
    ...state,
    last_updated: new Date().toISOString(),
  };

  fs.writeFileSync(statePath, JSON.stringify(updatedState, null, 2));
}

/**
 * Read factory config
 */
export function readConfig(projectPath: string): FactoryConfig | null {
  const configPath = path.join(projectPath, FACTORY_DIR, CONFIG_FILE);

  if (!fs.existsSync(configPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(content) as FactoryConfig;
  } catch (error) {
    console.error(`Error reading config from ${configPath}:`, error);
    return null;
  }
}

/**
 * Write factory config
 */
export function writeConfig(projectPath: string, config: FactoryConfig): void {
  const factoryDir = ensureFactoryDir(projectPath);
  const configPath = path.join(factoryDir, CONFIG_FILE);

  const updatedConfig = {
    ...config,
    last_updated: new Date().toISOString(),
  };

  fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2));
}

/**
 * Read data manifest
 */
export function readDataManifest(projectPath: string): DataManifest | null {
  const manifestPath = path.join(projectPath, FACTORY_DIR, DATA_MANIFEST_FILE);

  if (!fs.existsSync(manifestPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(manifestPath, 'utf-8');
    return JSON.parse(content) as DataManifest;
  } catch (error) {
    console.error(`Error reading data manifest from ${manifestPath}:`, error);
    return null;
  }
}

/**
 * Write data manifest
 */
export function writeDataManifest(projectPath: string, manifest: DataManifest): void {
  const factoryDir = ensureFactoryDir(projectPath);
  const manifestPath = path.join(factoryDir, DATA_MANIFEST_FILE);

  const updatedManifest = {
    ...manifest,
    last_updated: new Date().toISOString(),
  };

  fs.writeFileSync(manifestPath, JSON.stringify(updatedManifest, null, 2));
}

/**
 * Initialize a new Data Factory project
 */
export function initializeProject(
  projectPath: string,
  projectName: string,
  config: Partial<FactoryConfig>
): { state: WorkflowState; config: FactoryConfig; manifest: DataManifest } {
  const now = new Date().toISOString();

  // Create .factory directory
  ensureFactoryDir(projectPath);

  // Create directory structure
  const directories = [
    'data/raw',
    'data/annotated',
    'data/cleaned',
    'data/training',
    'data/splits',
    'models/checkpoints',
    'models/quantized',
    'metrics',
    'logs',
    'docs/research-system',
    'docs/data-system',
    'docs/ml-system',
  ];

  for (const dir of directories) {
    const dirPath = path.join(projectPath, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  // Initialize state
  const state = initializeWorkflowState(projectName);

  // Initialize config
  const fullConfig: FactoryConfig = {
    project_name: projectName,
    display_name: config.display_name || projectName,
    factory_version: '1.0.0',
    domain: config.domain || {
      name: 'undefined',
      languages: [],
      use_cases: [],
    },
    base_model: config.base_model || {
      id: 'google/gemma-2b-it',
      provider: 'google',
      size: '2B',
    },
    target_hardware: config.target_hardware || {
      type: 'edge',
      min_memory_gb: 4,
      quantization: '4bit-nf4',
    },
    created_at: now,
    last_updated: now,
  };

  // Initialize data manifest
  const manifest: DataManifest = {
    project_id: projectName,
    datasets: {},
    models: {},
    last_updated: now,
  };

  // Write all files
  writeState(projectPath, state);
  writeConfig(projectPath, fullConfig);
  writeDataManifest(projectPath, manifest);

  return { state, config: fullConfig, manifest };
}

/**
 * Register a new dataset in the manifest
 */
export function registerDataset(
  projectPath: string,
  dataset: Omit<DatasetInfo, 'created_at'>
): void {
  const manifest = readDataManifest(projectPath);
  if (!manifest) {
    throw new Error('Data manifest not found. Initialize project first.');
  }

  manifest.datasets[dataset.id] = {
    ...dataset,
    created_at: new Date().toISOString(),
  };

  writeDataManifest(projectPath, manifest);
}

/**
 * Register a new model in the manifest
 */
export function registerModel(
  projectPath: string,
  model: Omit<ModelInfo, 'created_at'>
): void {
  const manifest = readDataManifest(projectPath);
  if (!manifest) {
    throw new Error('Data manifest not found. Initialize project first.');
  }

  manifest.models[model.id] = {
    ...model,
    created_at: new Date().toISOString(),
  };

  writeDataManifest(projectPath, manifest);
}

/**
 * Get project summary
 */
export function getProjectSummary(projectPath: string): {
  exists: boolean;
  name?: string;
  phase?: string;
  progress?: number;
  datasets?: number;
  models?: number;
} {
  const state = readState(projectPath);
  const config = readConfig(projectPath);
  const manifest = readDataManifest(projectPath);

  if (!state || !config) {
    return { exists: false };
  }

  // Calculate progress
  const steps = Object.values(state.steps);
  const completed = steps.filter(
    (s) => s.status === 'completed' || s.status === 'skipped'
  ).length;
  const progress = Math.round((completed / steps.length) * 100);

  // Determine current phase
  let phase = 'discovery';
  if (state.current_step) {
    const phaseMap: Record<string, string> = {
      intake: 'discovery',
      sources: 'discovery',
      ethics: 'discovery',
      capture: 'collection',
      annotate: 'collection',
      validate: 'collection',
      clean: 'preparation',
      format: 'preparation',
      split: 'preparation',
      baseline: 'training',
      finetune: 'training',
      evaluate: 'training',
      quantize: 'deployment',
      registry: 'deployment',
      'edge-test': 'deployment',
      'model-card': 'handoff',
      'api-spec': 'handoff',
      examples: 'handoff',
    };
    phase = phaseMap[state.current_step] || 'discovery';
  }

  return {
    exists: true,
    name: config.display_name,
    phase,
    progress,
    datasets: manifest ? Object.keys(manifest.datasets).length : 0,
    models: manifest ? Object.keys(manifest.models).length : 0,
  };
}
