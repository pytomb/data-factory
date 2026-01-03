'use client';

import { useState } from 'react';
import {
  BookOpen,
  Search,
  Shield,
  Download,
  Tag,
  CheckCircle,
  Circle,
  PlayCircle,
  AlertCircle,
  Clock,
  XCircle,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Eraser,
  FileJson,
  Split,
  BarChart2,
  Cpu,
  Award,
  Minimize2,
  Upload,
  Smartphone,
  FileText,
  Code,
  MessageSquare,
} from 'lucide-react';
import { WORKFLOW_STEPS, PHASES, type PhaseId, type StepId } from '../lib/workflow';

// Icon mapping for steps
const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  BookOpen,
  Search,
  Shield,
  Download,
  Tag,
  CheckCircle,
  Eraser,
  FileJson,
  Split,
  BarChart2,
  Cpu,
  Award,
  Minimize2,
  Upload,
  Smartphone,
  FileText,
  Code,
  MessageSquare,
};

type StepStatus = 'pending' | 'in_progress' | 'needs_review' | 'completed' | 'blocked' | 'skipped';

// Status icon and color mapping
const STATUS_CONFIG: Record<StepStatus, {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
}> = {
  pending: {
    icon: Circle,
    color: 'text-gray-400',
    bgColor: 'bg-gray-800',
    borderColor: 'border-gray-600',
    label: 'Pending',
  },
  in_progress: {
    icon: PlayCircle,
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/30',
    borderColor: 'border-blue-500',
    label: 'In Progress',
  },
  needs_review: {
    icon: Clock,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-900/30',
    borderColor: 'border-yellow-500',
    label: 'Needs Review',
  },
  completed: {
    icon: CheckCircle,
    color: 'text-green-400',
    bgColor: 'bg-green-900/30',
    borderColor: 'border-green-500',
    label: 'Completed',
  },
  blocked: {
    icon: XCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-900/30',
    borderColor: 'border-red-500',
    label: 'Blocked',
  },
  skipped: {
    icon: AlertCircle,
    color: 'text-gray-500',
    bgColor: 'bg-gray-800/50',
    borderColor: 'border-gray-700',
    label: 'Skipped',
  },
};

// Phase color mapping
const PHASE_COLORS: Record<PhaseId, { bg: string; border: string; text: string }> = {
  discovery: { bg: 'bg-blue-500/20', border: 'border-blue-500', text: 'text-blue-400' },
  collection: { bg: 'bg-purple-500/20', border: 'border-purple-500', text: 'text-purple-400' },
  preparation: { bg: 'bg-orange-500/20', border: 'border-orange-500', text: 'text-orange-400' },
  training: { bg: 'bg-red-500/20', border: 'border-red-500', text: 'text-red-400' },
  deployment: { bg: 'bg-green-500/20', border: 'border-green-500', text: 'text-green-400' },
  handoff: { bg: 'bg-teal-500/20', border: 'border-teal-500', text: 'text-teal-400' },
};

interface WorkflowState {
  project_name: string;
  current_step: StepId | null;
  steps: Record<string, { status: StepStatus }>;
}

interface StepTimelineProps {
  state: WorkflowState | null;
  onStepSelect: (stepId: string) => void;
  selectedStepId: string | null;
}

export default function StepTimeline({ state, onStepSelect, selectedStepId }: StepTimelineProps) {
  const [expandedPhase, setExpandedPhase] = useState<PhaseId | null>('discovery');

  const getStepStatus = (stepId: string): StepStatus => {
    if (!state) return 'pending';
    const stepState = state.steps[stepId];
    if (!stepState) return 'pending';
    // Handle status aliases (status could come from API as "complete" instead of "completed")
    const status = stepState.status as string;
    return (status === 'complete' ? 'completed' : status) as StepStatus;
  };

  const isStepCurrent = (stepId: string): boolean => {
    return state?.current_step === stepId;
  };

  const getPhaseProgress = (phaseId: PhaseId): { completed: number; total: number } => {
    const phaseSteps = WORKFLOW_STEPS.filter(s => s.phase === phaseId);
    const completed = phaseSteps.filter(s => {
      const status = getStepStatus(s.id);
      return status === 'completed' || status === 'skipped';
    }).length;
    return { completed, total: phaseSteps.length };
  };

  const totalProgress = {
    completed: WORKFLOW_STEPS.filter(s => {
      const status = getStepStatus(s.id);
      return status === 'completed' || status === 'skipped';
    }).length,
    total: WORKFLOW_STEPS.length,
  };

  return (
    <div className="relative">
      {/* Timeline Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Sparkles size={20} className="text-orange-400" />
          Data Pipeline
        </h3>
        <span className="text-sm text-gray-400">
          {totalProgress.completed} / {totalProgress.total} steps
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 bg-gray-700 rounded-full mb-6 overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500"
          style={{ width: `${(totalProgress.completed / totalProgress.total) * 100}%` }}
        />
      </div>

      {/* Phase Accordion */}
      <div className="space-y-2">
        {(Object.keys(PHASES) as PhaseId[]).map((phaseId) => {
          const phase = PHASES[phaseId];
          const phaseSteps = WORKFLOW_STEPS.filter(s => s.phase === phaseId);
          const progress = getPhaseProgress(phaseId);
          const isExpanded = expandedPhase === phaseId;
          const phaseColors = PHASE_COLORS[phaseId];

          return (
            <div key={phaseId} className={`border rounded-lg ${phaseColors.border} ${phaseColors.bg}`}>
              {/* Phase Header */}
              <button
                onClick={() => setExpandedPhase(isExpanded ? null : phaseId)}
                className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <ChevronRight
                    size={16}
                    className={`${phaseColors.text} transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  />
                  <span className={`font-semibold ${phaseColors.text}`}>
                    {phase.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {phase.description}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {progress.completed}/{progress.total}
                  </span>
                  {progress.completed === progress.total && progress.total > 0 && (
                    <CheckCircle size={14} className="text-green-400" />
                  )}
                </div>
              </button>

              {/* Phase Steps */}
              {isExpanded && (
                <div className="px-3 pb-3 space-y-1">
                  {phaseSteps.map((step, index) => {
                    const status = getStepStatus(step.id);
                    const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
                    const StepIcon = ICON_MAP[step.icon] || Circle;
                    const StatusIcon = statusConfig.icon;
                    const isSelected = selectedStepId === step.id;
                    const isCurrent = isStepCurrent(step.id);
                    const hasGate = step.gate !== null;
                    const hasExpert = step.expert !== null;

                    return (
                      <button
                        key={step.id}
                        onClick={() => onStepSelect(step.id)}
                        className={`
                          w-full flex items-center gap-3 p-2 rounded-lg transition
                          ${isSelected ? 'bg-white/10 ring-1 ring-orange-500' : 'hover:bg-white/5'}
                          ${isCurrent ? 'animate-pulse' : ''}
                        `}
                      >
                        {/* Step Icon */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${statusConfig.bgColor} border ${statusConfig.borderColor}`}>
                          <StepIcon size={16} className={statusConfig.color} />
                        </div>

                        {/* Step Info */}
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                              {step.name}
                            </span>
                            {hasGate && (
                              <div className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center" title="Has quality gate">
                                <AlertCircle size={10} className="text-yellow-900" />
                              </div>
                            )}
                            {hasExpert && (
                              <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center" title="Expert review">
                                <Sparkles size={10} className="text-white" />
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 line-clamp-1">
                            {step.description}
                          </span>
                        </div>

                        {/* Status Icon */}
                        <StatusIcon size={16} className={statusConfig.color} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <Circle size={12} className="text-gray-400" />
          <span>Pending</span>
        </div>
        <div className="flex items-center gap-1">
          <PlayCircle size={12} className="text-blue-400" />
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle size={12} className="text-green-400" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-yellow-500 flex items-center justify-center">
            <AlertCircle size={8} className="text-yellow-900" />
          </div>
          <span>Has Gate</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-purple-500 flex items-center justify-center">
            <Sparkles size={8} className="text-white" />
          </div>
          <span>Expert Review</span>
        </div>
      </div>
    </div>
  );
}
