'use client';

import { useState, useEffect } from 'react';
import {
  Database,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  BarChart2,
} from 'lucide-react';

interface DatasetInfo {
  id: string;
  name: string;
  path: string;
  format: 'raw' | 'annotated' | 'cleaned' | 'training';
  sample_count: number;
  size_mb: number;
  created_at: string;
  validated: boolean;
  validation_report?: string;
}

interface DataManifest {
  project_id: string;
  datasets: Record<string, DatasetInfo>;
  models: Record<string, unknown>;
  last_updated: string;
}

interface DatasetStatsProps {
  projectPath?: string;
}

const FORMAT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  raw: { bg: 'bg-gray-800', text: 'text-gray-400', border: 'border-gray-700' },
  annotated: { bg: 'bg-purple-900/30', text: 'text-purple-400', border: 'border-purple-900/50' },
  cleaned: { bg: 'bg-blue-900/30', text: 'text-blue-400', border: 'border-blue-900/50' },
  training: { bg: 'bg-green-900/30', text: 'text-green-400', border: 'border-green-900/50' },
};

export default function DatasetStats({ projectPath }: DatasetStatsProps) {
  const [manifest, setManifest] = useState<DataManifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchManifest = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (projectPath) params.append('project', projectPath);

      const res = await fetch(`/api/dataset?${params}`);
      if (res.ok) {
        const data = await res.json();
        setManifest(data);
      } else {
        setError('Failed to load dataset information');
      }
    } catch (e) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManifest();
  }, [projectPath]);

  const datasets = manifest ? Object.values(manifest.datasets) : [];
  const totalSamples = datasets.reduce((sum, d) => sum + d.sample_count, 0);
  const totalSize = datasets.reduce((sum, d) => sum + d.size_mb, 0);
  const validatedCount = datasets.filter(d => d.validated).length;

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-300 flex items-center gap-2">
          <Database size={16} className="text-blue-400" />
          Dataset Overview
        </h3>
        <button
          onClick={fetchManifest}
          disabled={loading}
          className="p-1.5 hover:bg-gray-800 rounded transition"
        >
          <RefreshCw size={14} className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-32 gap-2 text-gray-500">
          <Loader2 size={16} className="animate-spin" />
          Loading datasets...
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center h-32 gap-2 text-gray-500">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-gray-800 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-white">{datasets.length}</div>
              <div className="text-xs text-gray-500">Datasets</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-white">{totalSamples.toLocaleString()}</div>
              <div className="text-xs text-gray-500">Samples</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-white">{totalSize.toFixed(1)} MB</div>
              <div className="text-xs text-gray-500">Total Size</div>
            </div>
          </div>

          {/* Validation Status */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500">Validation Progress</span>
              <span className="text-gray-400">{validatedCount}/{datasets.length} validated</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-500"
                style={{ width: datasets.length > 0 ? `${(validatedCount / datasets.length) * 100}%` : '0%' }}
              />
            </div>
          </div>

          {/* Dataset List */}
          <div className="space-y-2">
            {datasets.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-4">
                No datasets registered yet
              </div>
            ) : (
              datasets.map((dataset) => {
                const colors = FORMAT_COLORS[dataset.format] || FORMAT_COLORS.raw;
                return (
                  <div
                    key={dataset.id}
                    className={`flex items-center justify-between p-2 rounded-lg border ${colors.bg} ${colors.border}`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText size={14} className={colors.text} />
                      <div>
                        <div className="text-sm text-white">{dataset.name}</div>
                        <div className="text-xs text-gray-500">
                          {dataset.sample_count.toLocaleString()} samples • {dataset.size_mb.toFixed(1)} MB
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                        {dataset.format}
                      </span>
                      {dataset.validated ? (
                        <CheckCircle size={14} className="text-green-400" />
                      ) : (
                        <XCircle size={14} className="text-gray-500" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
