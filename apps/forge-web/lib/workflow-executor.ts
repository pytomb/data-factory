/**
 * Data Factory Workflow Executor
 *
 * Handles workflow state transitions, step execution,
 * and gate validation for the data collection/training pipeline.
 */

import {
  PhaseId,
  StepId,
  GateId,
  WORKFLOW_STEPS,
  PHASES,
  getStep,
  getNextStep,
  getPhaseSteps,
} from './workflow';
import { checkGate, GateResult, GATE_CHECKS } from './gates';

export type StepStatus =
  | 'pending'
  | 'in_progress'
  | 'needs_review'
  | 'completed'
  | 'blocked'
  | 'skipped';

export interface StepState {
  status: StepStatus;
  started_at: string | null;
  completed_at: string | null;
  output_files: string[];
  expert_reviewed: boolean;
  error: string | null;
  skipped_reason: string | null;
}

export interface WorkflowState {
  project_name: string;
  created_at: string;
  last_updated: string;
  execution_mode: 'interactive' | 'semi-automated' | 'auto-pilot';
  current_step: StepId | null;
  steps: Record<StepId, StepState>;
  gates: Record<GateId, GateResult>;
  reviews: Record<string, ExpertReview>;
  audit_log: AuditEntry[];
}

export interface ExpertReview {
  expertId: string;
  stepId: StepId;
  approved: boolean;
  comments: string;
  reviewed_at: string;
}

export interface AuditEntry {
  timestamp: string;
  action: string;
  step?: StepId;
  gate?: GateId;
  details: string;
  actor: 'system' | 'user' | 'expert';
}

/**
 * Initialize a new workflow state
 */
export function initializeWorkflowState(projectName: string): WorkflowState {
  const now = new Date().toISOString();

  // Initialize all steps as pending
  const steps: Record<string, StepState> = {};
  for (const step of WORKFLOW_STEPS) {
    steps[step.id] = {
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
    created_at: now,
    last_updated: now,
    execution_mode: 'interactive',
    current_step: 'intake',
    steps: steps as Record<StepId, StepState>,
    gates: {} as Record<GateId, GateResult>,
    reviews: {},
    audit_log: [
      {
        timestamp: now,
        action: 'workflow_initialized',
        details: `Data Factory workflow initialized for project: ${projectName}`,
        actor: 'system',
      },
    ],
  };
}

/**
 * Start a workflow step
 */
export function startStep(
  state: WorkflowState,
  stepId: StepId
): WorkflowState {
  const now = new Date().toISOString();
  const step = getStep(stepId);

  if (!step) {
    throw new Error(`Unknown step: ${stepId}`);
  }

  // Check if previous step is complete (unless this is the first step)
  const stepIndex = WORKFLOW_STEPS.findIndex((s) => s.id === stepId);
  if (stepIndex > 0) {
    const prevStep = WORKFLOW_STEPS[stepIndex - 1];
    const prevStepState = state.steps[prevStep.id];
    if (prevStepState.status !== 'completed' && prevStepState.status !== 'skipped') {
      throw new Error(
        `Cannot start ${stepId}: previous step ${prevStep.id} not complete`
      );
    }
  }

  return {
    ...state,
    last_updated: now,
    current_step: stepId,
    steps: {
      ...state.steps,
      [stepId]: {
        ...state.steps[stepId],
        status: 'in_progress',
        started_at: now,
      },
    },
    audit_log: [
      ...state.audit_log,
      {
        timestamp: now,
        action: 'step_started',
        step: stepId,
        details: `Started step: ${step.name}`,
        actor: 'system',
      },
    ],
  };
}

/**
 * Complete a workflow step
 */
export async function completeStep(
  state: WorkflowState,
  stepId: StepId,
  outputFiles: string[],
  projectPath: string
): Promise<{ state: WorkflowState; gateResult?: GateResult }> {
  const now = new Date().toISOString();
  const step = getStep(stepId);

  if (!step) {
    throw new Error(`Unknown step: ${stepId}`);
  }

  // Check gate if this step has one
  let gateResult: GateResult | undefined;
  if (step.gate) {
    gateResult = await checkGate(step.gate, projectPath);

    if (!gateResult.passed && gateResult.blockers.length > 0) {
      // Gate failed with blockers - step is blocked
      return {
        state: {
          ...state,
          last_updated: now,
          steps: {
            ...state.steps,
            [stepId]: {
              ...state.steps[stepId],
              status: 'blocked',
              error: `Gate ${step.gate} failed: ${gateResult.blockers.join(', ')}`,
            },
          },
          gates: {
            ...state.gates,
            [step.gate]: gateResult,
          },
          audit_log: [
            ...state.audit_log,
            {
              timestamp: now,
              action: 'gate_failed',
              step: stepId,
              gate: step.gate,
              details: `Gate blocked: ${gateResult.blockers.join(', ')}`,
              actor: 'system',
            },
          ],
        },
        gateResult,
      };
    }
  }

  // Check if expert review is required
  const needsReview = step.expert !== null && !state.steps[stepId].expert_reviewed;

  const newStatus: StepStatus = needsReview ? 'needs_review' : 'completed';

  return {
    state: {
      ...state,
      last_updated: now,
      steps: {
        ...state.steps,
        [stepId]: {
          ...state.steps[stepId],
          status: newStatus,
          completed_at: needsReview ? null : now,
          output_files: outputFiles,
        },
      },
      gates: step.gate
        ? {
            ...state.gates,
            [step.gate]: gateResult!,
          }
        : state.gates,
      audit_log: [
        ...state.audit_log,
        {
          timestamp: now,
          action: needsReview ? 'step_needs_review' : 'step_completed',
          step: stepId,
          gate: step.gate || undefined,
          details: needsReview
            ? `Step ${step.name} awaiting ${step.expert} review`
            : `Completed step: ${step.name}`,
          actor: 'system',
        },
      ],
    },
    gateResult,
  };
}

/**
 * Add expert review to a step
 */
export function addExpertReview(
  state: WorkflowState,
  stepId: StepId,
  review: Omit<ExpertReview, 'stepId' | 'reviewed_at'>
): WorkflowState {
  const now = new Date().toISOString();
  const step = getStep(stepId);

  if (!step) {
    throw new Error(`Unknown step: ${stepId}`);
  }

  const reviewKey = `${stepId}-${review.expertId}`;

  const newState: WorkflowState = {
    ...state,
    last_updated: now,
    steps: {
      ...state.steps,
      [stepId]: {
        ...state.steps[stepId],
        expert_reviewed: review.approved,
        status: review.approved ? 'completed' : 'needs_review',
        completed_at: review.approved ? now : null,
      },
    },
    reviews: {
      ...state.reviews,
      [reviewKey]: {
        ...review,
        stepId,
        reviewed_at: now,
      },
    },
    audit_log: [
      ...state.audit_log,
      {
        timestamp: now,
        action: 'expert_review',
        step: stepId,
        details: review.approved
          ? `${review.expertId} approved step ${step.name}`
          : `${review.expertId} requested changes for step ${step.name}: ${review.comments}`,
        actor: 'expert',
      },
    ],
  };

  return newState;
}

/**
 * Skip a step with reason
 */
export function skipStep(
  state: WorkflowState,
  stepId: StepId,
  reason: string
): WorkflowState {
  const now = new Date().toISOString();
  const step = getStep(stepId);

  if (!step) {
    throw new Error(`Unknown step: ${stepId}`);
  }

  return {
    ...state,
    last_updated: now,
    steps: {
      ...state.steps,
      [stepId]: {
        ...state.steps[stepId],
        status: 'skipped',
        skipped_reason: reason,
      },
    },
    audit_log: [
      ...state.audit_log,
      {
        timestamp: now,
        action: 'step_skipped',
        step: stepId,
        details: `Skipped step ${step.name}: ${reason}`,
        actor: 'user',
      },
    ],
  };
}

/**
 * Calculate overall workflow progress
 */
export function calculateProgress(state: WorkflowState): {
  percentage: number;
  completedSteps: number;
  totalSteps: number;
  currentPhase: PhaseId | null;
  phaseProgress: Record<PhaseId, { completed: number; total: number }>;
} {
  const completedSteps = Object.values(state.steps).filter(
    (s) => s.status === 'completed' || s.status === 'skipped'
  ).length;

  const totalSteps = WORKFLOW_STEPS.length;
  const percentage = Math.round((completedSteps / totalSteps) * 100);

  // Calculate per-phase progress
  const phaseProgress: Record<PhaseId, { completed: number; total: number }> = {
    discovery: { completed: 0, total: 0 },
    collection: { completed: 0, total: 0 },
    preparation: { completed: 0, total: 0 },
    training: { completed: 0, total: 0 },
    deployment: { completed: 0, total: 0 },
    handoff: { completed: 0, total: 0 },
  };

  for (const step of WORKFLOW_STEPS) {
    phaseProgress[step.phase].total++;
    const stepState = state.steps[step.id];
    if (stepState.status === 'completed' || stepState.status === 'skipped') {
      phaseProgress[step.phase].completed++;
    }
  }

  // Determine current phase
  let currentPhase: PhaseId | null = null;
  if (state.current_step) {
    const currentStep = getStep(state.current_step);
    if (currentStep) {
      currentPhase = currentStep.phase;
    }
  }

  return {
    percentage,
    completedSteps,
    totalSteps,
    currentPhase,
    phaseProgress,
  };
}

/**
 * Get the next recommended action
 */
export function getNextAction(state: WorkflowState): {
  action: 'execute_step' | 'check_gate' | 'await_review' | 'complete';
  step?: StepId;
  gate?: GateId;
  expert?: string;
  message: string;
} {
  // Check if workflow is complete
  const allComplete = Object.values(state.steps).every(
    (s) => s.status === 'completed' || s.status === 'skipped'
  );

  if (allComplete) {
    return {
      action: 'complete',
      message: 'Data Factory workflow complete! Model ready for handoff to MVP Factory.',
    };
  }

  // Check for steps needing review
  for (const step of WORKFLOW_STEPS) {
    if (state.steps[step.id].status === 'needs_review') {
      return {
        action: 'await_review',
        step: step.id,
        expert: step.expert || undefined,
        message: `Awaiting ${step.expert} review for step: ${step.name}`,
      };
    }
  }

  // Check for blocked steps (gate failures)
  for (const step of WORKFLOW_STEPS) {
    if (state.steps[step.id].status === 'blocked') {
      return {
        action: 'check_gate',
        step: step.id,
        gate: step.gate || undefined,
        message: `Step ${step.name} blocked. Fix issues and re-check gate: ${step.gate}`,
      };
    }
  }

  // Find next pending step
  for (const step of WORKFLOW_STEPS) {
    if (state.steps[step.id].status === 'pending') {
      return {
        action: 'execute_step',
        step: step.id,
        message: `Execute step: ${step.name} - ${step.description}`,
      };
    }
  }

  // Find in-progress step
  if (state.current_step && state.steps[state.current_step].status === 'in_progress') {
    const step = getStep(state.current_step);
    return {
      action: 'execute_step',
      step: state.current_step,
      message: `Continue step: ${step?.name} - ${step?.description}`,
    };
  }

  return {
    action: 'complete',
    message: 'Workflow status unclear. Check state for issues.',
  };
}

/**
 * Get consulting deliverables value for completed steps
 */
export function getConsultingValue(state: WorkflowState): {
  total: { min: number; max: number };
  byStep: Record<StepId, { min: number; max: number } | null>;
} {
  const deliverableValues: Record<StepId, { min: number; max: number }> = {
    intake: { min: 2000, max: 5000 },
    sources: { min: 1500, max: 3000 },
    ethics: { min: 3000, max: 8000 },
    capture: { min: 2000, max: 5000 },
    annotate: { min: 2000, max: 4000 },
    validate: { min: 1500, max: 3000 },
    clean: { min: 1000, max: 2000 },
    format: { min: 5000, max: 15000 },
    split: { min: 1000, max: 2000 },
    baseline: { min: 2000, max: 4000 },
    finetune: { min: 5000, max: 20000 },
    evaluate: { min: 3000, max: 6000 },
    quantize: { min: 2000, max: 5000 },
    registry: { min: 1000, max: 2000 },
    'edge-test': { min: 2000, max: 4000 },
    'model-card': { min: 1500, max: 3000 },
    'api-spec': { min: 1500, max: 3000 },
    examples: { min: 1000, max: 2000 },
  };

  let totalMin = 0;
  let totalMax = 0;
  const byStep: Record<string, { min: number; max: number } | null> = {};

  for (const step of WORKFLOW_STEPS) {
    const stepState = state.steps[step.id];
    if (stepState.status === 'completed') {
      const value = deliverableValues[step.id];
      totalMin += value.min;
      totalMax += value.max;
      byStep[step.id] = value;
    } else {
      byStep[step.id] = null;
    }
  }

  return {
    total: { min: totalMin, max: totalMax },
    byStep: byStep as Record<StepId, { min: number; max: number } | null>,
  };
}
