'use client';

import { useState } from 'react';
import {
  X,
  Play,
  SkipForward,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { PHASES, type WorkflowStep, type PhaseId } from '../lib/workflow';

type StepStatus = 'pending' | 'in_progress' | 'needs_review' | 'completed' | 'blocked' | 'skipped';

interface StepState {
  status: StepStatus;
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

interface StepDetailProps {
  step: WorkflowStep;
  state: WorkflowState;
  onRunStep: (stepId: string) => void;
  onSkipStep: (stepId: string) => void;
  onRequestReview: (stepId: string, expertId: string) => void;
  onClose: () => void;
  onViewFile: (filePath: string) => void;
}

const STATUS_STYLES: Record<StepStatus, { icon: typeof CheckCircle; color: string; bg: string }> = {
  pending: { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-800' },
  in_progress: { icon: Loader2, color: 'text-blue-400', bg: 'bg-blue-900/30' },
  needs_review: { icon: AlertCircle, color: 'text-yellow-400', bg: 'bg-yellow-900/30' },
  completed: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-900/30' },
  blocked: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-900/30' },
  skipped: { icon: SkipForward, color: 'text-gray-500', bg: 'bg-gray-800/50' },
};

export default function StepDetail({
  step,
  state,
  onRunStep,
  onSkipStep,
  onRequestReview,
  onClose,
  onViewFile,
}: StepDetailProps) {
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [skipReason, setSkipReason] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const stepState = state.steps[step.id] || {
    status: 'pending',
    started_at: null,
    completed_at: null,
    output_files: [],
    expert_reviewed: false,
    error: null,
    skipped_reason: null,
  };

  const statusStyle = STATUS_STYLES[stepState.status] || STATUS_STYLES.pending;
  const StatusIcon = statusStyle.icon;
  const phase = PHASES[step.phase as PhaseId];

  const handleRun = async () => {
    setIsRunning(true);
    try {
      await onRunStep(step.id);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSkip = () => {
    if (skipReason.trim()) {
      onSkipStep(step.id);
      setShowSkipConfirm(false);
      setSkipReason('');
    }
  };

  const canRun = stepState.status === 'pending' || stepState.status === 'blocked';
  const canSkip = stepState.status === 'pending';

  return (
    <div className="bg-gray-900/80 border border-gray-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${statusStyle.bg} flex items-center justify-center`}>
            <StatusIcon size={20} className={`${statusStyle.color} ${stepState.status === 'in_progress' ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <h3 className="font-bold text-white">{step.name}</h3>
            <p className="text-xs text-gray-500">
              {phase.name} • {step.agent}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-800 rounded-lg transition"
        >
          <X size={18} className="text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Description */}
        <p className="text-sm text-gray-300">{step.description}</p>

        {/* Status Banner */}
        <div className={`p-3 rounded-lg ${statusStyle.bg} border border-gray-700`}>
          <div className="flex items-center gap-2">
            <StatusIcon size={16} className={statusStyle.color} />
            <span className={`text-sm font-medium ${statusStyle.color}`}>
              {stepState.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          {stepState.error && (
            <p className="mt-2 text-xs text-red-400">{stepState.error}</p>
          )}
          {stepState.skipped_reason && (
            <p className="mt-2 text-xs text-gray-400">Reason: {stepState.skipped_reason}</p>
          )}
        </div>

        {/* Gate Info */}
        {step.gate && (
          <div className="p-3 bg-yellow-900/20 border border-yellow-900/50 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-400">
              <AlertCircle size={14} />
              <span className="text-xs font-medium">Quality Gate: {step.gate}</span>
            </div>
          </div>
        )}

        {/* Expert Info */}
        {step.expert && (
          <div className="p-3 bg-purple-900/20 border border-purple-900/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-400">
                <span className="text-xs font-medium">Expert: {step.expert}</span>
              </div>
              {stepState.status === 'needs_review' && (
                <button
                  onClick={() => onRequestReview(step.id, step.expert!)}
                  className="text-xs px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded transition"
                >
                  Request Review
                </button>
              )}
            </div>
          </div>
        )}

        {/* Inputs & Outputs */}
        <div className="grid grid-cols-2 gap-4">
          {step.inputs.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-500 mb-2">Inputs</h4>
              <div className="space-y-1">
                {step.inputs.map((input, i) => (
                  <button
                    key={i}
                    onClick={() => onViewFile(input)}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition"
                  >
                    <FileText size={12} />
                    {input.split('/').pop()}
                  </button>
                ))}
              </div>
            </div>
          )}
          {step.outputs.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-500 mb-2">Outputs</h4>
              <div className="space-y-1">
                {step.outputs.map((output, i) => (
                  <button
                    key={i}
                    onClick={() => onViewFile(output)}
                    className="flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 transition"
                  >
                    <FileText size={12} />
                    {output.split('/').pop()}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Timestamps */}
        {(stepState.started_at || stepState.completed_at) && (
          <div className="text-xs text-gray-500 space-y-1">
            {stepState.started_at && (
              <p>Started: {new Date(stepState.started_at).toLocaleString()}</p>
            )}
            {stepState.completed_at && (
              <p>Completed: {new Date(stepState.completed_at).toLocaleString()}</p>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-800 space-y-2">
        {/* Skip Confirmation */}
        {showSkipConfirm ? (
          <div className="space-y-2">
            <input
              type="text"
              value={skipReason}
              onChange={(e) => setSkipReason(e.target.value)}
              placeholder="Reason for skipping..."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSkip}
                disabled={!skipReason.trim()}
                className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white text-sm rounded-lg transition"
              >
                Confirm Skip
              </button>
              <button
                onClick={() => setShowSkipConfirm(false)}
                className="px-3 py-2 text-gray-400 hover:text-white text-sm transition"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            {canRun && (
              <button
                onClick={handleRun}
                disabled={isRunning}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:bg-gray-700 text-white font-medium rounded-lg transition"
              >
                {isRunning ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play size={16} fill="currentColor" />
                    Run Step
                  </>
                )}
              </button>
            )}
            {canSkip && (
              <button
                onClick={() => setShowSkipConfirm(true)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition"
              >
                <SkipForward size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
