import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

// Default projects directory
const PROJECTS_DIR = process.env.DATA_FACTORY_PROJECTS_DIR ||
  path.join(process.cwd(), '..', '..', 'projects');

interface ProjectInfo {
  id: string;
  name: string;
  displayName: string;
  path: string;
  phase: string;
  progress: number;
  lastUpdated: string | null;
}

interface FactoryConfig {
  project_name: string;
  display_name: string;
  last_updated?: string;
}

interface WorkflowState {
  current_step: string | null;
  steps: Record<string, { status: string }>;
}

function readJson<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

function scanProjects(): ProjectInfo[] {
  if (!fs.existsSync(PROJECTS_DIR)) {
    return [];
  }

  const projects: ProjectInfo[] = [];
  const entries = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const projectPath = path.join(PROJECTS_DIR, entry.name);
    const configPath = path.join(projectPath, '.factory', 'config.json');
    const statePath = path.join(projectPath, '.factory', 'state.json');

    // Check if this is a valid Data Factory project
    if (!fs.existsSync(configPath)) continue;

    const config = readJson<FactoryConfig>(configPath);
    const state = readJson<WorkflowState>(statePath);

    if (!config) continue;

    // Calculate progress and phase
    let progress = 0;
    let phase = 'discovery';

    if (state && state.steps) {
      const steps = Object.values(state.steps);
      const completed = steps.filter(
        (s) => s.status === 'completed' || s.status === 'skipped'
      ).length;
      progress = Math.round((completed / steps.length) * 100);

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
    }

    projects.push({
      id: entry.name,
      name: config.project_name || entry.name,
      displayName: config.display_name || config.project_name || entry.name,
      path: projectPath,
      phase,
      progress,
      lastUpdated: config.last_updated || null,
    });
  }

  return projects.sort((a, b) => {
    if (a.lastUpdated && b.lastUpdated) {
      return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
    }
    return a.name.localeCompare(b.name);
  });
}

function createProject(data: {
  name: string;
  displayName: string;
  domain: string;
  languages: string[];
  useCases: string[];
  baseModel: string;
  targetHardware: 'cloud' | 'edge' | 'both';
  minMemoryGb: number;
}): { success: boolean; path?: string; error?: string } {
  const projectPath = path.join(PROJECTS_DIR, data.name);

  if (fs.existsSync(projectPath)) {
    return { success: false, error: 'Project already exists' };
  }

  try {
    // Create directories
    const directories = [
      '.factory',
      'data/raw',
      'data/annotated',
      'data/cleaned',
      'data/training',
      'data/splits',
      'models/checkpoints',
      'models/quantized',
      'metrics',
      'logs',
      'docs',
    ];

    for (const dir of directories) {
      fs.mkdirSync(path.join(projectPath, dir), { recursive: true });
    }

    const now = new Date().toISOString();

    // Create config
    const config = {
      project_name: data.name,
      display_name: data.displayName,
      factory_version: '1.0.0',
      domain: {
        name: data.domain,
        languages: data.languages,
        use_cases: data.useCases,
      },
      base_model: {
        id: data.baseModel,
        provider: data.baseModel.split('/')[0],
        size: data.baseModel.includes('2b') ? '2B' : '7B',
      },
      target_hardware: {
        type: data.targetHardware,
        min_memory_gb: data.minMemoryGb,
        quantization: '4bit-nf4',
      },
      created_at: now,
      last_updated: now,
    };

    fs.writeFileSync(
      path.join(projectPath, '.factory', 'config.json'),
      JSON.stringify(config, null, 2)
    );

    // Create initial state
    const stepIds = [
      'intake', 'sources', 'ethics',
      'capture', 'annotate', 'validate',
      'clean', 'format', 'split',
      'baseline', 'finetune', 'evaluate',
      'quantize', 'registry', 'edge-test',
      'model-card', 'api-spec', 'examples',
    ];

    const steps: Record<string, unknown> = {};
    for (const id of stepIds) {
      steps[id] = {
        status: 'pending',
        started_at: null,
        completed_at: null,
        output_files: [],
        expert_reviewed: false,
        error: null,
        skipped_reason: null,
      };
    }

    const state = {
      project_name: data.displayName,
      created_at: now,
      last_updated: now,
      execution_mode: 'interactive',
      current_step: 'intake',
      steps,
      gates: {},
      reviews: {},
    };

    fs.writeFileSync(
      path.join(projectPath, '.factory', 'state.json'),
      JSON.stringify(state, null, 2)
    );

    // Create data manifest
    const manifest = {
      project_id: data.name,
      datasets: {},
      models: {},
      last_updated: now,
    };

    fs.writeFileSync(
      path.join(projectPath, '.factory', 'data-manifest.json'),
      JSON.stringify(manifest, null, 2)
    );

    return { success: true, path: projectPath };
  } catch (error) {
    console.error('Error creating project:', error);
    return { success: false, error: String(error) };
  }
}

export async function GET() {
  const projects = scanProjects();
  return NextResponse.json({ projects });
}

export async function POST(request: NextRequest) {
  const data = await request.json();

  if (!data.name || !data.displayName) {
    return NextResponse.json(
      { success: false, message: 'Project name and display name are required' },
      { status: 400 }
    );
  }

  const result = createProject(data);

  if (!result.success) {
    return NextResponse.json(
      { success: false, message: result.error },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true, path: result.path });
}
