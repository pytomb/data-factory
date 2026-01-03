'use client';

import { useState } from 'react';
import { X, AlertTriangle, XCircle, ArrowRight, Shield } from 'lucide-react';

interface GateResult {
  gateId: string;
  passed: boolean;
  message: string;
  blockers: string[];
  warnings: string[];
  metrics: Record<string, number>;
  checkedAt: string;
}

interface GateBlockingModalProps {
  gate: GateResult;
  stepName: string;
  onProceedAnyway: (riskAcknowledgment: string) => void;
  onFixIssues: () => void;
  onCancel: () => void;
}

export default function GateBlockingModal({
  gate,
  stepName,
  onProceedAnyway,
  onFixIssues,
  onCancel,
}: GateBlockingModalProps) {
  const [showRiskForm, setShowRiskForm] = useState(false);
  const [riskAcknowledgment, setRiskAcknowledgment] = useState('');

  const handleProceed = () => {
    if (riskAcknowledgment.trim()) {
      onProceedAnyway(riskAcknowledgment);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-red-900/50 rounded-xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-800 bg-red-900/20">
          <div className="w-10 h-10 rounded-lg bg-red-900/30 flex items-center justify-center">
            <Shield size={20} className="text-red-400" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-red-400">Quality Gate Failed</h2>
            <p className="text-xs text-gray-400">Step: {stepName}</p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-800 rounded-lg transition"
          >
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-300">{gate.message}</p>

          {/* Blockers */}
          {gate.blockers.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-red-400 flex items-center gap-2">
                <XCircle size={14} />
                Blocking Issues ({gate.blockers.length})
              </h3>
              <div className="space-y-1">
                {gate.blockers.map((blocker, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 p-2 bg-red-900/20 border border-red-900/30 rounded text-xs text-red-300"
                  >
                    <span className="text-red-500">•</span>
                    {blocker}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {gate.warnings.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-yellow-400 flex items-center gap-2">
                <AlertTriangle size={14} />
                Warnings ({gate.warnings.length})
              </h3>
              <div className="space-y-1">
                {gate.warnings.map((warning, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 p-2 bg-yellow-900/20 border border-yellow-900/30 rounded text-xs text-yellow-300"
                  >
                    <span className="text-yellow-500">•</span>
                    {warning}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metrics */}
          {Object.keys(gate.metrics).length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-400">Metrics</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(gate.metrics).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-xs bg-gray-800 px-3 py-2 rounded">
                    <span className="text-gray-500">{key.replace(/_/g, ' ')}</span>
                    <span className="text-gray-300">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk Form */}
          {showRiskForm && (
            <div className="space-y-2 p-3 bg-orange-900/20 border border-orange-900/30 rounded-lg">
              <h3 className="text-sm font-medium text-orange-400">Acknowledge Risk</h3>
              <p className="text-xs text-gray-400">
                Explain why you're proceeding despite the gate failure. This will be logged.
              </p>
              <textarea
                value={riskAcknowledgment}
                onChange={(e) => setRiskAcknowledgment(e.target.value)}
                placeholder="I understand the risks and am proceeding because..."
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 resize-none"
                rows={3}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-800 space-y-2">
          {showRiskForm ? (
            <div className="flex gap-2">
              <button
                onClick={handleProceed}
                disabled={!riskAcknowledgment.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-lg transition"
              >
                <ArrowRight size={16} />
                Proceed Anyway
              </button>
              <button
                onClick={() => setShowRiskForm(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition"
              >
                Back
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={onFixIssues}
                className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-medium rounded-lg transition"
              >
                Fix Issues
              </button>
              <button
                onClick={() => setShowRiskForm(true)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition"
              >
                Override
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
