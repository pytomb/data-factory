import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

// Default project path - in production this would come from config
const DEFAULT_PROJECT_PATH = process.env.DATA_FACTORY_PROJECT_PATH ||
  path.join(process.cwd(), '..', '..', 'projects', 'ellembelle-education');

interface StepState {
  status: 'pending' | 'in_progress' | 'needs_review' | 'completed' | 'blocked' | 'skipped';
  started_at: string | null;
  completed_at: string | null;
  output_files: string[];
  expert_reviewed: boolean;
  error: string | null;
  skipped_reason: string | null;
}

interface WorkflowState {
  project_name: string;
  created_at: string;
  last_updated: string;
  execution_mode: string;
  current_step: string | null;
  steps: Record<string, StepState>;
  gates: Record<string, unknown>;
  reviews: Record<string, unknown>;
}

function getStatePath(projectPath: string): string {
  // Check .factory/ first, then root
  const factoryPath = path.join(projectPath, '.factory', 'state.json');
  const rootPath = path.join(projectPath, 'state.json');

  if (fs.existsSync(factoryPath)) return factoryPath;
  if (fs.existsSync(rootPath)) return rootPath;

  // Default to .factory path for new projects
  return factoryPath;
}

function readState(projectPath: string): WorkflowState | null {
  const statePath = getStatePath(projectPath);

  if (!fs.existsSync(statePath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(statePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading state:', error);
    return null;
  }
}

function writeState(projectPath: string, state: WorkflowState): void {
  const factoryDir = path.join(projectPath, '.factory');
  if (!fs.existsSync(factoryDir)) {
    fs.mkdirSync(factoryDir, { recursive: true });
  }

  const statePath = path.join(factoryDir, 'state.json');
  const updatedState = {
    ...state,
    last_updated: new Date().toISOString(),
  };

  fs.writeFileSync(statePath, JSON.stringify(updatedState, null, 2));
}

function initializeState(projectName: string): WorkflowState {
  const stepIds = [
    'intake', 'sources', 'ethics',
    'capture', 'annotate', 'validate',
    'clean', 'format', 'split',
    'baseline', 'finetune', 'evaluate',
    'quantize', 'registry', 'edge-test',
    'model-card', 'api-spec', 'examples',
  ];

  const steps: Record<string, StepState> = {};
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

  return {
    project_name: projectName,
    created_at: new Date().toISOString(),
    last_updated: new Date().toISOString(),
    execution_mode: 'interactive',
    current_step: 'intake',
    steps,
    gates: {},
    reviews: {},
  };
}

export async function GET(request: NextRequest) {
  const projectPath = request.nextUrl.searchParams.get('project') || DEFAULT_PROJECT_PATH;

  let state = readState(projectPath);

  if (!state) {
    // Return a default state for demo purposes
    state = initializeState('Demo Project');
  }

  return NextResponse.json(state);
}

export async function POST(request: NextRequest) {
  const projectPath = request.nextUrl.searchParams.get('project') || DEFAULT_PROJECT_PATH;
  const body = await request.json();

  let state = readState(projectPath);

  if (!state) {
    state = initializeState(body.projectName || 'New Project');
  }

  const { action, stepId, status } = body;

  switch (action) {
    case 'update_step':
      if (stepId && status && state.steps[stepId]) {
        state.steps[stepId].status = status;
        if (status === 'in_progress') {
          state.steps[stepId].started_at = new Date().toISOString();
          state.current_step = stepId;
        } else if (status === 'completed') {
          state.steps[stepId].completed_at = new Date().toISOString();
        }
      }
      break;

    case 'reset':
      state = initializeState(state.project_name);
      break;

    default:
      break;
  }

  writeState(projectPath, state);

  return NextResponse.json({ success: true, state });
}
