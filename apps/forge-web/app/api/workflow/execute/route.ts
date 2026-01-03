import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { getStep, type StepId } from '../../../../lib/workflow';

// Default project path
const DEFAULT_PROJECT_PATH = process.env.DATA_FACTORY_PROJECT_PATH ||
  path.join(process.cwd(), '..', '..', 'projects', 'ellembelle-education');

interface StepState {
  status: string;
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
  audit_log?: Array<{
    timestamp: string;
    action: string;
    step?: string;
    details: string;
    actor: string;
  }>;
}

function readState(projectPath: string): WorkflowState | null {
  const statePath = path.join(projectPath, '.factory', 'state.json');
  const legacyPath = path.join(projectPath, 'state.json');

  let targetPath = statePath;
  if (!fs.existsSync(statePath) && fs.existsSync(legacyPath)) {
    targetPath = legacyPath;
  }

  if (!fs.existsSync(targetPath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(targetPath, 'utf-8'));
  } catch {
    return null;
  }
}

function writeState(projectPath: string, state: WorkflowState): void {
  const factoryDir = path.join(projectPath, '.factory');
  if (!fs.existsSync(factoryDir)) {
    fs.mkdirSync(factoryDir, { recursive: true });
  }

  const statePath = path.join(factoryDir, 'state.json');
  fs.writeFileSync(statePath, JSON.stringify({
    ...state,
    last_updated: new Date().toISOString(),
  }, null, 2));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { stepId, action, projectPath: bodyProjectPath } = body;
  const projectPath = bodyProjectPath || DEFAULT_PROJECT_PATH;

  if (!stepId) {
    return NextResponse.json(
      { error: 'stepId is required' },
      { status: 400 }
    );
  }

  const step = getStep(stepId as StepId);
  if (!step) {
    return NextResponse.json(
      { error: `Unknown step: ${stepId}` },
      { status: 400 }
    );
  }

  let state = readState(projectPath);
  if (!state) {
    return NextResponse.json(
      { error: 'Project state not found' },
      { status: 404 }
    );
  }

  const now = new Date().toISOString();

  switch (action) {
    case 'start':
      state.steps[stepId] = {
        ...state.steps[stepId],
        status: 'in_progress',
        started_at: now,
        error: null,
      };
      state.current_step = stepId;
      state.audit_log = [
        ...(state.audit_log || []),
        {
          timestamp: now,
          action: 'step_started',
          step: stepId,
          details: `Started step: ${step.name}`,
          actor: 'user',
        },
      ];
      break;

    case 'complete':
      state.steps[stepId] = {
        ...state.steps[stepId],
        status: step.expert ? 'needs_review' : 'completed',
        completed_at: now,
      };
      state.audit_log = [
        ...(state.audit_log || []),
        {
          timestamp: now,
          action: step.expert ? 'step_needs_review' : 'step_completed',
          step: stepId,
          details: step.expert
            ? `Step ${step.name} awaiting ${step.expert} review`
            : `Completed step: ${step.name}`,
          actor: 'system',
        },
      ];
      break;

    case 'skip':
      const { reason } = body;
      state.steps[stepId] = {
        ...state.steps[stepId],
        status: 'skipped',
        skipped_reason: reason || 'User skipped',
      };
      state.audit_log = [
        ...(state.audit_log || []),
        {
          timestamp: now,
          action: 'step_skipped',
          step: stepId,
          details: `Skipped step ${step.name}: ${reason || 'User skipped'}`,
          actor: 'user',
        },
      ];
      break;

    case 'block':
      const { error } = body;
      state.steps[stepId] = {
        ...state.steps[stepId],
        status: 'blocked',
        error: error || 'Step blocked',
      };
      state.audit_log = [
        ...(state.audit_log || []),
        {
          timestamp: now,
          action: 'step_blocked',
          step: stepId,
          details: `Step ${step.name} blocked: ${error || 'Unknown reason'}`,
          actor: 'system',
        },
      ];
      break;

    default:
      return NextResponse.json(
        { error: `Unknown action: ${action}. Use start, complete, skip, or block.` },
        { status: 400 }
      );
  }

  writeState(projectPath, state);

  return NextResponse.json({
    success: true,
    step: stepId,
    action,
    state: state.steps[stepId],
  });
}
