import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { WORKFLOW_STEPS, getStep, type StepId } from '../../../../lib/workflow';

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
  current_step: string | null;
  steps: Record<string, StepState>;
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

export async function GET(request: NextRequest) {
  const projectPath = request.nextUrl.searchParams.get('project') || DEFAULT_PROJECT_PATH;

  const state = readState(projectPath);
  if (!state) {
    return NextResponse.json(
      { error: 'Project state not found' },
      { status: 404 }
    );
  }

  // Check if workflow is complete
  const allComplete = Object.values(state.steps).every(
    (s) => s.status === 'completed' || s.status === 'skipped'
  );

  if (allComplete) {
    return NextResponse.json({
      action: 'complete',
      message: 'Data Factory workflow complete! Model ready for handoff to MVP Factory.',
      progress: {
        completed: WORKFLOW_STEPS.length,
        total: WORKFLOW_STEPS.length,
        percentage: 100,
      },
    });
  }

  // Check for steps needing review
  for (const step of WORKFLOW_STEPS) {
    if (state.steps[step.id]?.status === 'needs_review') {
      return NextResponse.json({
        action: 'await_review',
        step: step.id,
        stepName: step.name,
        expert: step.expert,
        message: `Awaiting ${step.expert} review for step: ${step.name}`,
        command: `POST /api/workflow/execute { "stepId": "${step.id}", "action": "complete" }`,
      });
    }
  }

  // Check for blocked steps (gate failures)
  for (const step of WORKFLOW_STEPS) {
    if (state.steps[step.id]?.status === 'blocked') {
      return NextResponse.json({
        action: 'fix_blocker',
        step: step.id,
        stepName: step.name,
        gate: step.gate,
        error: state.steps[step.id].error,
        message: `Step ${step.name} blocked. Fix issues and re-check gate: ${step.gate}`,
        command: `GET /api/gate?gateId=${step.gate}`,
      });
    }
  }

  // Check for in-progress step
  if (state.current_step && state.steps[state.current_step]?.status === 'in_progress') {
    const step = getStep(state.current_step as StepId);
    return NextResponse.json({
      action: 'continue_step',
      step: state.current_step,
      stepName: step?.name,
      message: `Continue step: ${step?.name} - ${step?.description}`,
      command: `POST /api/workflow/execute { "stepId": "${state.current_step}", "action": "complete" }`,
    });
  }

  // Find next pending step
  for (const step of WORKFLOW_STEPS) {
    if (state.steps[step.id]?.status === 'pending') {
      const completedCount = Object.values(state.steps).filter(
        (s) => s.status === 'completed' || s.status === 'skipped'
      ).length;

      return NextResponse.json({
        action: 'execute_step',
        step: step.id,
        stepName: step.name,
        phase: step.phase,
        description: step.description,
        message: `Execute step: ${step.name} - ${step.description}`,
        command: `POST /api/workflow/execute { "stepId": "${step.id}", "action": "start" }`,
        progress: {
          completed: completedCount,
          total: WORKFLOW_STEPS.length,
          percentage: Math.round((completedCount / WORKFLOW_STEPS.length) * 100),
        },
      });
    }
  }

  return NextResponse.json({
    action: 'unknown',
    message: 'Workflow status unclear. Check state for issues.',
  });
}
