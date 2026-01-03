'use client';

import { useState, useEffect } from 'react';
import {
  FlaskConical,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  BarChart2,
} from 'lucide-react';

interface ModelInfo {
  id: string;
  name: string;
  path: string;
  base_model: string;
  checkpoint: string;
  quantization?: string;
  metrics?: Record<string, number>;
  created_at: string;
  deployed: boolean;
  registry_url?: string;
}

interface ModelMetricsProps {
  projectPath?: string;
}

export default function ModelMetrics({ projectPath }: ModelMetricsProps) {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  const fetchModels = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (projectPath) params.append('project', projectPath);

      const res = await fetch(`/api/model?${params}`);
      if (res.ok) {
        const data = await res.json();
        setModels(data.models || []);
        if (data.models?.length > 0 && !selectedModel) {
          setSelectedModel(data.models[0].id);
        }
      } else {
        setError('Failed to load model information');
      }
    } catch (e) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, [projectPath]);

  const currentModel = models.find(m => m.id === selectedModel);

  const getMetricTrend = (value: number, threshold: number) => {
    if (value >= threshold * 1.1) return { icon: TrendingUp, color: 'text-green-400' };
    if (value <= threshold * 0.9) return { icon: TrendingDown, color: 'text-red-400' };
    return { icon: Minus, color: 'text-gray-400' };
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-300 flex items-center gap-2">
          <FlaskConical size={16} className="text-purple-400" />
          Model Performance
        </h3>
        <button
          onClick={fetchModels}
          disabled={loading}
          className="p-1.5 hover:bg-gray-800 rounded transition"
        >
          <RefreshCw size={14} className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-32 gap-2 text-gray-500">
          <Loader2 size={16} className="animate-spin" />
          Loading models...
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center h-32 gap-2 text-gray-500">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {models.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-8">
              No models trained yet
            </div>
          ) : (
            <>
              {/* Model Selector */}
              {models.length > 1 && (
                <div className="mb-4">
                  <select
                    value={selectedModel || ''}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
                  >
                    {models.map(model => (
                      <option key={model.id} value={model.id}>{model.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {currentModel && (
                <>
                  {/* Model Info */}
                  <div className="bg-gray-800 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">{currentModel.name}</span>
                      {currentModel.deployed ? (
                        <span className="flex items-center gap-1 text-xs text-green-400">
                          <CheckCircle size={12} />
                          Deployed
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <XCircle size={12} />
                          Not Deployed
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Base:</span>
                        <span className="text-gray-300 ml-1">{currentModel.base_model}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Checkpoint:</span>
                        <span className="text-gray-300 ml-1">{currentModel.checkpoint}</span>
                      </div>
                      {currentModel.quantization && (
                        <div>
                          <span className="text-gray-500">Quantization:</span>
                          <span className="text-gray-300 ml-1">{currentModel.quantization}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Metrics */}
                  {currentModel.metrics && Object.keys(currentModel.metrics).length > 0 ? (
                    <div className="space-y-3">
                      <h4 className="text-xs font-medium text-gray-500 flex items-center gap-1">
                        <BarChart2 size={12} />
                        Performance Metrics
                      </h4>
                      <div className="space-y-2">
                        {Object.entries(currentModel.metrics).map(([key, value]) => {
                          const threshold = key.includes('accuracy') ? 80 : key.includes('loss') ? 0.5 : 50;
                          const trend = getMetricTrend(value, threshold);
                          const TrendIcon = trend.icon;
                          const isPercentage = key.includes('accuracy') || key.includes('percent') || key.includes('score');

                          return (
                            <div key={key} className="flex items-center justify-between">
                              <span className="text-sm text-gray-400">{key.replace(/_/g, ' ')}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-white font-mono">
                                  {isPercentage ? `${value}%` : value.toFixed(3)}
                                </span>
                                <TrendIcon size={14} className={trend.color} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 text-sm py-4">
                      No metrics recorded yet
                    </div>
                  )}

                  {/* Registry Link */}
                  {currentModel.registry_url && (
                    <a
                      href={currentModel.registry_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 block text-center text-sm text-purple-400 hover:text-purple-300 transition"
                    >
                      View on HuggingFace →
                    </a>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
