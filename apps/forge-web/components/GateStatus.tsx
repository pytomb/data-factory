'use client';

import { useState, useEffect } from 'react';
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { type GateId, GATES } from '../lib/workflow';

interface GateResult {
  gateId: string;
  passed: boolean;
  message: string;
  blockers: string[];
  warnings: string[];
  metrics: Record<string, number>;
  checkedAt: string;
}

interface GateStatusProps {
  gateId: GateId;
  projectPath?: string;
  onRecheck?: () => void;
}

export default function GateStatus({ gateId, projectPath, onRecheck }: GateStatusProps) {
  const [result, setResult] = useState<GateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const gate = GATES[gateId];

  const checkGate = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ gateId });
      if (projectPath) params.append('project', projectPath);

      const res = await fetch(`/api/gate?${params}`);
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } catch (e) {
      console.error('Failed to check gate:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkGate();
  }, [gateId, projectPath]);

  const handleRecheck = () => {
    checkGate();
    onRecheck?.();
  };

  const getStatusIcon = () => {
    if (loading) return <Loader2 size={16} className="animate-spin text-gray-400" />;
    if (!result) return <Shield size={16} className="text-gray-500" />;
    if (result.passed) return <CheckCircle size={16} className="text-green-400" />;
    if (result.blockers.length > 0) return <XCircle size={16} className="text-red-400" />;
    return <AlertTriangle size={16} className="text-yellow-400" />;
  };

  const getStatusColor = () => {
    if (!result) return 'border-gray-700 bg-gray-800/50';
    if (result.passed) return 'border-green-900/50 bg-green-900/20';
    if (result.blockers.length > 0) return 'border-red-900/50 bg-red-900/20';
    return 'border-yellow-900/50 bg-yellow-900/20';
  };

  return (
    <div className={`rounded-lg border ${getStatusColor()} overflow-hidden`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition"
      >
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm font-medium text-gray-300">{gate.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {result && (
            <span className={`text-xs ${result.passed ? 'text-green-400' : 'text-red-400'}`}>
              {result.passed ? 'PASSED' : 'FAILED'}
            </span>
          )}
          {expanded ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-gray-800">
          <p className="text-xs text-gray-500 pt-3">{gate.description}</p>

          {result && (
            <>
              {/* Message */}
              <p className="text-sm text-gray-400">{result.message}</p>

              {/* Blockers */}
              {result.blockers.length > 0 && (
                <div className="space-y-1">
                  <h4 className="text-xs font-medium text-red-400">Blockers</h4>
                  {result.blockers.map((blocker, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-red-300">
                      <XCircle size={12} className="mt-0.5 flex-shrink-0" />
                      <span>{blocker}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Warnings */}
              {result.warnings.length > 0 && (
                <div className="space-y-1">
                  <h4 className="text-xs font-medium text-yellow-400">Warnings</h4>
                  {result.warnings.map((warning, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-yellow-300">
                      <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                      <span>{warning}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Metrics */}
              {Object.keys(result.metrics).length > 0 && (
                <div className="space-y-1">
                  <h4 className="text-xs font-medium text-gray-400">Metrics</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(result.metrics).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-xs bg-gray-800 px-2 py-1 rounded">
                        <span className="text-gray-500">{key.replace(/_/g, ' ')}</span>
                        <span className="text-gray-300">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Checked At */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                <span className="text-xs text-gray-500">
                  Last checked: {new Date(result.checkedAt).toLocaleString()}
                </span>
                <button
                  onClick={handleRecheck}
                  disabled={loading}
                  className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition"
                >
                  <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                  Recheck
                </button>
              </div>
            </>
          )}

          {!result && !loading && (
            <p className="text-xs text-gray-500">Gate has not been checked yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
