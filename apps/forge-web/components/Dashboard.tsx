'use client';

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, FileText, Play, Loader2, Database, FlaskConical, Hammer } from 'lucide-react';
import StepTimeline from './StepTimeline';
import { getStep, WORKFLOW_STEPS, PHASES, type StepId, type PhaseId } from '../lib/workflow';

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
  created_at: string;
  last_updated: string;
  execution_mode: string;
  current_step: StepId | null;
  steps: Record<string, StepState>;
  gates: Record<string, unknown>;
  reviews: Record<string, unknown>;
}

interface ProjectSummary {
  exists: boolean;
  name?: string;
  phase?: string;
  progress?: number;
  datasets?: number;
  models?: number;
}

export default function Dashboard() {
  const [workflowState, setWorkflowState] = useState<WorkflowState | null>(null);
  const [projectSummary, setProjectSummary] = useState<ProjectSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningAction, setRunningAction] = useState<string | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [stateRes, summaryRes] = await Promise.all([
        fetch('/api/state'),
        fetch('/api/dashboard'),
      ]);

      if (stateRes.ok) {
        const stateJson = await stateRes.json();
        setWorkflowState(stateJson);
      }

      if (summaryRes.ok) {
        const summaryJson = await summaryRes.json();
        setProjectSummary(summaryJson);
      }
    } catch (e) {
      console.error('Failed to fetch data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRunStep = async (stepId: string) => {
    if (!stepId) return;
    setRunningAction(stepId);

    try {
      await fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_step',
          stepId,
          status: 'in_progress',
        }),
      });

      await fetchData();
    } catch (e) {
      console.error('Failed to run step:', e);
    } finally {
      setRunningAction(null);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !workflowState) {
    return (
      <div className="p-8 flex items-center gap-3 text-gray-400">
        <Loader2 className="animate-spin" size={20} />
        Loading Forge Command Center...
      </div>
    );
  }

  // Check if this is a fresh project (no steps completed)
  const isNewProject = !workflowState || Object.values(workflowState.steps).every(
    step => step.status === 'pending'
  );

  const selectedStep = selectedStepId ? getStep(selectedStepId as StepId) : null;

  // Calculate phase progress
  const getPhaseProgress = (phaseId: PhaseId) => {
    if (!workflowState) return { completed: 0, total: 0 };
    const phaseSteps = WORKFLOW_STEPS.filter(s => s.phase === phaseId);
    const completed = phaseSteps.filter(s => {
      const status = workflowState.steps[s.id]?.status;
      return status === 'completed' || status === 'skipped';
    }).length;
    return { completed, total: phaseSteps.length };
  };

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6 border-b border-gray-800/50 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-200">
              {workflowState?.project_name || 'Forge Floor'}
            </h2>
            {runningAction && (
              <div className="flex items-center gap-2 text-xs text-orange-400 bg-orange-500/10 px-2 py-1 rounded">
                <Loader2 size={12} className="animate-spin" />
                Running {runningAction}...
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {workflowState ? (
              <>
                Mode: {workflowState.execution_mode} | Last updated: {
                  workflowState.last_updated
                    ? new Date(workflowState.last_updated).toLocaleString()
                    : 'Never'
                }
              </>
            ) : (
              'No project loaded'
            )}
          </p>
        </div>

        <button
          onClick={fetchData}
          className="p-2 bg-gray-800 rounded hover:bg-gray-700 transition"
          title="Refresh"
        >
          <RefreshCw size={18} className="text-gray-400" />
        </button>
      </div>

      {/* Getting Started Banner for New Projects */}
      {isNewProject && (
        <div className="mb-6 p-6 bg-gradient-to-r from-orange-900/30 to-red-900/30 border border-orange-500/30 rounded-xl">
          <h3 className="text-lg font-bold text-orange-300 mb-2">Welcome to the Data Factory!</h3>
          <p className="text-gray-300 mb-4">
            Start by defining your domain and data requirements. Click the button below to begin the discovery process,
            or select a step in the timeline to learn more.
          </p>
          <button
            onClick={() => handleRunStep('intake')}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg transition flex items-center gap-2"
          >
            <Play size={16} fill="currentColor" />
            Start Domain Intake
          </button>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-3 gap-6 min-h-0">
        {/* Step Timeline (Left 2/3) */}
        <div className="col-span-2 bg-gray-900/50 border border-gray-800 rounded-xl p-4 overflow-auto">
          <StepTimeline
            state={workflowState}
            onStepSelect={setSelectedStepId}
            selectedStepId={selectedStepId}
          />
        </div>

        {/* Side Panel (Right 1/3) */}
        <div className="space-y-4 overflow-auto">
          {/* Step Detail Panel */}
          {selectedStep ? (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
              <h3 className="font-bold text-white mb-2">{selectedStep.name}</h3>
              <p className="text-sm text-gray-400 mb-4">{selectedStep.description}</p>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">Phase:</span>
                  <span className="ml-2 text-gray-300">{PHASES[selectedStep.phase].name}</span>
                </div>
                <div>
                  <span className="text-gray-500">Agent:</span>
                  <span className="ml-2 text-gray-300">{selectedStep.agent}</span>
                </div>
                {selectedStep.gate && (
                  <div>
                    <span className="text-gray-500">Gate:</span>
                    <span className="ml-2 text-yellow-400">{selectedStep.gate}</span>
                  </div>
                )}
                {selectedStep.expert && (
                  <div>
                    <span className="text-gray-500">Expert:</span>
                    <span className="ml-2 text-purple-400">{selectedStep.expert}</span>
                  </div>
                )}

                {selectedStep.inputs.length > 0 && (
                  <div>
                    <span className="text-gray-500 block mb-1">Inputs:</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedStep.inputs.map((input, i) => (
                        <span key={i} className="text-xs bg-gray-800 px-2 py-0.5 rounded text-gray-400">
                          {input}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedStep.outputs.length > 0 && (
                  <div>
                    <span className="text-gray-500 block mb-1">Outputs:</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedStep.outputs.map((output, i) => (
                        <span key={i} className="text-xs bg-green-900/30 px-2 py-0.5 rounded text-green-400">
                          {output}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleRunStep(selectedStep.id)}
                disabled={runningAction !== null}
                className="mt-4 w-full px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
              >
                {runningAction === selectedStep.id ? (
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
            </div>
          ) : (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
              <p className="text-gray-500 text-sm text-center">
                Select a step to view details
              </p>
            </div>
          )}

          {/* Project Stats */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
            <h3 className="font-semibold text-gray-400 mb-3 flex items-center gap-2">
              <Hammer size={16} className="text-orange-400" />
              Project Stats
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 flex items-center gap-2">
                  <Database size={14} />
                  Datasets
                </span>
                <span className="text-gray-300">{projectSummary?.datasets ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 flex items-center gap-2">
                  <FlaskConical size={14} />
                  Models
                </span>
                <span className="text-gray-300">{projectSummary?.models ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Progress</span>
                <span className="text-gray-300">{projectSummary?.progress ?? 0}%</span>
              </div>
            </div>
          </div>

          {/* Phase Progress */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
            <h3 className="font-semibold text-gray-400 mb-3">Phase Progress</h3>
            <div className="space-y-2">
              {(Object.keys(PHASES) as PhaseId[]).map((phaseId) => {
                const phase = PHASES[phaseId];
                const progress = getPhaseProgress(phaseId);
                const percentage = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;

                return (
                  <div key={phaseId}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">{phase.name}</span>
                      <span className="text-gray-400">{progress.completed}/{progress.total}</span>
                    </div>
                    <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          phaseId === 'discovery' ? 'bg-blue-500' :
                          phaseId === 'collection' ? 'bg-purple-500' :
                          phaseId === 'preparation' ? 'bg-orange-500' :
                          phaseId === 'training' ? 'bg-red-500' :
                          phaseId === 'deployment' ? 'bg-green-500' :
                          'bg-teal-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Output Files */}
          {workflowState && (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
              <h3 className="font-semibold text-gray-400 mb-3 flex items-center gap-2">
                <FileText size={16} />
                Generated Files
              </h3>
              <div className="flex flex-wrap gap-2">
                {WORKFLOW_STEPS.filter(step =>
                  workflowState.steps[step.id]?.status === 'completed'
                ).flatMap(step =>
                  step.outputs.filter(f => !f.includes('*') && !f.endsWith('/'))
                ).filter((file, index, arr) => arr.indexOf(file) === index)
                .slice(0, 8)
                .map(file => (
                  <button
                    key={file}
                    className="flex items-center gap-1.5 px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded text-xs transition"
                  >
                    <FileText size={10} />
                    {file.split('/').pop()}
                  </button>
                ))}
                {WORKFLOW_STEPS.filter(step =>
                  workflowState.steps[step.id]?.status === 'completed'
                ).length === 0 && (
                  <span className="text-gray-600 text-xs">No files generated yet</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
