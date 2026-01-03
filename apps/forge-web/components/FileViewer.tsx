'use client';

import { useState, useEffect } from 'react';
import { X, FileText, Download, Copy, Check, Loader2, AlertCircle } from 'lucide-react';

interface FileViewerProps {
  filePath: string;
  onClose: () => void;
}

export default function FileViewer({ filePath, onClose }: FileViewerProps) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchFile = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/file?path=${encodeURIComponent(filePath)}`);
        if (res.ok) {
          const data = await res.json();
          setContent(data.content);
        } else {
          const errData = await res.json();
          setError(errData.error || 'Failed to load file');
        }
      } catch (e) {
        setError('Failed to load file');
      } finally {
        setLoading(false);
      }
    };

    fetchFile();
  }, [filePath]);

  const handleCopy = async () => {
    if (content) {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (content) {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filePath.split('/').pop() || 'file.txt';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const getLanguage = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'json':
      case 'jsonl':
        return 'json';
      case 'md':
        return 'markdown';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'py':
        return 'python';
      case 'yaml':
      case 'yml':
        return 'yaml';
      default:
        return 'text';
    }
  };

  const fileName = filePath.split('/').pop() || filePath;
  const language = getLanguage(filePath);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-orange-400" />
            <div>
              <h2 className="font-bold text-white">{fileName}</h2>
              <p className="text-xs text-gray-500">{filePath}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={!content}
              className="p-2 hover:bg-gray-800 rounded-lg transition"
              title="Copy to clipboard"
            >
              {copied ? (
                <Check size={18} className="text-green-400" />
              ) : (
                <Copy size={18} className="text-gray-400" />
              )}
            </button>
            <button
              onClick={handleDownload}
              disabled={!content}
              className="p-2 hover:bg-gray-800 rounded-lg transition"
              title="Download"
            >
              <Download size={18} className="text-gray-400" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition"
            >
              <X size={18} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {loading && (
            <div className="flex items-center justify-center h-32 gap-2 text-gray-400">
              <Loader2 size={20} className="animate-spin" />
              Loading file...
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-32 gap-2 text-red-400">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          {content !== null && !loading && !error && (
            <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap break-words bg-gray-950 p-4 rounded-lg border border-gray-800 overflow-x-auto">
              {content || <span className="text-gray-500 italic">Empty file</span>}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-800 text-xs text-gray-500">
          <span>Language: {language}</span>
          {content && <span>{content.split('\n').length} lines</span>}
        </div>
      </div>
    </div>
  );
}
