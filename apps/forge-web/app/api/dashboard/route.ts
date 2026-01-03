import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

// Default project path
const DEFAULT_PROJECT_PATH = process.env.DATA_FACTORY_PROJECT_PATH ||
  path.join(process.cwd(), '..', '..', 'projects', 'ellembelle-education');

interface ProjectSummary {
  exists: boolean;
  name?: string;
  phase?: string;
  progress?: number;
  datasets?: number;
  models?: number;
}

interface DataManifest {
  project_id: string;
  datasets: Record<string, unknown>;
  models: Record<string, unknown>;
  last_updated: string;
}

interface FactoryConfig {
  project_name: string;
  display_name: string;
  domain: {
    name: string;
    languages: string[];
    use_cases: string[];
  };
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

function getProjectSummary(projectPath: string): ProjectSummary {
  const configPath = path.join(projectPath, '.factory', 'config.json');
  const statePath = path.join(projectPath, '.factory', 'state.json');
  const manifestPath = path.join(projectPath, '.factory', 'data-manifest.json');

  const config = readJson<FactoryConfig>(configPath);
  const state = readJson<WorkflowState>(statePath);
  const manifest = readJson<DataManifest>(manifestPath);

  if (!config && !state) {
    return { exists: false };
  }

  // Calculate progress
  let progress = 0;
  let phase = 'discovery';

  if (state && state.steps) {
    const steps = Object.values(state.steps);
    const completed = steps.filter(
      (s) => s.status === 'completed' || s.status === 'skipped'
    ).length;
    progress = Math.round((completed / steps.length) * 100);

    // Determine current phase
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

  return {
    exists: true,
    name: config?.display_name || config?.project_name || 'Unknown Project',
    phase,
    progress,
    datasets: manifest ? Object.keys(manifest.datasets || {}).length : 0,
    models: manifest ? Object.keys(manifest.models || {}).length : 0,
  };
}

export async function GET(request: NextRequest) {
  const projectPath = request.nextUrl.searchParams.get('project') || DEFAULT_PROJECT_PATH;

  const summary = getProjectSummary(projectPath);

  return NextResponse.json(summary);
}
