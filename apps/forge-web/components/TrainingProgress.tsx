'use client';

import { useState, useEffect } from 'react';
import {
  Cpu,
  Activity,
  Clock,
  Zap,
  CheckCircle,
  Loader2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

interface TrainingStatus {
  running: boolean;
  step: number;
  total_steps: number;
  epoch: number;
  total_epochs: number;
  loss: number;
  learning_rate: number;
  eta_seconds: number;
  started_at: string | null;
  checkpoint_at: string | null;
  error: string | null;
}

interface TrainingProgressProps {
  projectPath?: string;
}

export default function TrainingProgress({ projectPath }: TrainingProgressProps) {
  const [status, setStatus] = useState<TrainingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (projectPath) params.append('project', projectPath);

      const res = await fetch(`/api/training?${params}`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      } else {
        setError('Failed to load training status');
      }
    } catch (e) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Poll every 5 seconds if training is running
    const interval = setInterval(() => {
      if (status?.running) {
        fetchStatus();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [projectPath, status?.running]);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  const progress = status ? (status.step / status.total_steps) * 100 : 0;

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-300 flex items-center gap-2">
          <Cpu size={16} className="text-red-400" />
          Training Progress
        </h3>
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="p-1.5 hover:bg-gray-800 rounded transition"
        >
          <RefreshCw size={14} className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && !status && (
        <div className="flex items-center justify-center h-32 gap-2 text-gray-500">
          <Loader2 size={16} className="animate-spin" />
          Loading training status...
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center h-32 gap-2 text-gray-500">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {status && (
        <>
          {/* Status Banner */}
          <div className={`rounded-lg p-3 mb-4 ${
            status.running
              ? 'bg-blue-900/30 border border-blue-900/50'
              : status.error
              ? 'bg-red-900/30 border border-red-900/50'
              : 'bg-green-900/30 border border-green-900/50'
          }`}>
            <div className="flex items-center gap-2">
              {status.running ? (
                <>
                  <Activity size={16} className="text-blue-400 animate-pulse" />
                  <span className="text-blue-400 font-medium">Training in Progress</span>
                </>
              ) : status.error ? (
                <>
                  <AlertCircle size={16} className="text-red-400" />
                  <span className="text-red-400 font-medium">Training Failed</span>
                </>
              ) : (
                <>
                  <CheckCircle size={16} className="text-green-400" />
                  <span className="text-green-400 font-medium">Training Complete</span>
                </>
              )}
            </div>
            {status.error && (
              <p className="mt-2 text-xs text-red-300">{status.error}</p>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500">
                Step {status.step.toLocaleString()} / {status.total_steps.toLocaleString()}
              </span>
              <span className="text-gray-400">{progress.toFixed(1)}%</span>
            </div>
            <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  status.running ? 'bg-blue-500' : status.error ? 'bg-red-500' : 'bg-green-500'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                <Activity size={12} />
                Epoch
              </div>
              <div className="text-white font-mono">
                {status.epoch} / {status.total_epochs}
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                <Zap size={12} />
                Loss
              </div>
              <div className="text-white font-mono">
                {status.loss.toFixed(4)}
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                <Activity size={12} />
                Learning Rate
              </div>
              <div className="text-white font-mono text-sm">
                {status.learning_rate.toExponential(2)}
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                <Clock size={12} />
                ETA
              </div>
              <div className="text-white font-mono">
                {status.running ? formatTime(status.eta_seconds) : '--'}
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="text-xs text-gray-500 space-y-1">
            {status.started_at && (
              <p>Started: {new Date(status.started_at).toLocaleString()}</p>
            )}
            {status.checkpoint_at && (
              <p>Last checkpoint: {new Date(status.checkpoint_at).toLocaleString()}</p>
            )}
          </div>
        </>
      )}

      {!loading && !error && !status && (
        <div className="text-center text-gray-500 text-sm py-8">
          No training session active
        </div>
      )}
    </div>
  );
}
