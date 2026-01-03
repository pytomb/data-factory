'use client';

import { useState } from 'react';
import { X, Hammer, ChevronRight, ChevronLeft, Check, Loader2 } from 'lucide-react';

interface NewProjectWizardProps {
  onClose: () => void;
}

interface ProjectFormData {
  name: string;
  displayName: string;
  domain: string;
  languages: string[];
  useCases: string[];
  baseModel: string;
  targetHardware: 'cloud' | 'edge' | 'both';
  minMemoryGb: number;
}

const STEP_TITLES = [
  'Project Info',
  'Domain',
  'Base Model',
  'Hardware',
];

const COMMON_LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese',
  'Arabic', 'Hindi', 'Portuguese', 'Swahili', 'Twi', 'Yoruba',
];

const BASE_MODELS = [
  { id: 'google/gemma-2b-it', name: 'Gemma 2B', provider: 'Google', size: '2B' },
  { id: 'google/gemma-7b-it', name: 'Gemma 7B', provider: 'Google', size: '7B' },
  { id: 'meta-llama/Llama-2-7b-chat-hf', name: 'Llama 2 7B', provider: 'Meta', size: '7B' },
  { id: 'mistralai/Mistral-7B-Instruct-v0.2', name: 'Mistral 7B', provider: 'Mistral AI', size: '7B' },
  { id: 'Qwen/Qwen2-1.5B-Instruct', name: 'Qwen 2 1.5B', provider: 'Alibaba', size: '1.5B' },
];

export default function NewProjectWizard({ onClose }: NewProjectWizardProps) {
  const [step, setStep] = useState(0);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    displayName: '',
    domain: '',
    languages: [],
    useCases: [],
    baseModel: 'google/gemma-2b-it',
    targetHardware: 'edge',
    minMemoryGb: 4,
  });

  const updateField = <K extends keyof ProjectFormData>(field: K, value: ProjectFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleLanguage = (lang: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang],
    }));
  };

  const addUseCase = (useCase: string) => {
    if (useCase.trim() && !formData.useCases.includes(useCase.trim())) {
      setFormData(prev => ({
        ...prev,
        useCases: [...prev.useCases, useCase.trim()],
      }));
    }
  };

  const removeUseCase = (useCase: string) => {
    setFormData(prev => ({
      ...prev,
      useCases: prev.useCases.filter(u => u !== useCase),
    }));
  };

  const handleNext = () => {
    if (step < STEP_TITLES.length - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onClose();
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Failed to create project: ${error.message || 'Unknown error'}`);
      }
    } catch (e) {
      console.error('Failed to create project:', e);
      alert('Failed to create project. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 0:
        return formData.name.trim().length > 0 && formData.displayName.trim().length > 0;
      case 1:
        return formData.domain.trim().length > 0 && formData.languages.length > 0;
      case 2:
        return formData.baseModel.length > 0;
      case 3:
        return formData.minMemoryGb > 0;
      default:
        return true;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <Hammer className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-white">New Data Factory Project</h2>
              <p className="text-xs text-gray-500">Step {step + 1} of {STEP_TITLES.length}: {STEP_TITLES[step]}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-4 pt-4">
          <div className="flex gap-1">
            {STEP_TITLES.map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-1 rounded-full transition ${
                  i <= step ? 'bg-orange-500' : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Project Name (slug)
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => updateField('name', e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
                  placeholder="my-data-project"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                />
                <p className="text-xs text-gray-500 mt-1">Used for folder and file names</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={e => updateField('displayName', e.target.value)}
                  placeholder="My Data Project"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Domain / Subject Area
                </label>
                <input
                  type="text"
                  value={formData.domain}
                  onChange={e => updateField('domain', e.target.value)}
                  placeholder="e.g., Education, Healthcare, Agriculture, Legal"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Target Languages
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_LANGUAGES.map(lang => (
                    <button
                      key={lang}
                      onClick={() => toggleLanguage(lang)}
                      className={`px-3 py-1 rounded-full text-sm transition ${
                        formData.languages.includes(lang)
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Use Cases
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Add a use case..."
                    className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        addUseCase((e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.useCases.map(useCase => (
                    <span
                      key={useCase}
                      className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm flex items-center gap-2"
                    >
                      {useCase}
                      <button onClick={() => removeUseCase(useCase)} className="text-gray-500 hover:text-white">
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Base Model
              </label>
              <div className="grid gap-2">
                {BASE_MODELS.map(model => (
                  <button
                    key={model.id}
                    onClick={() => updateField('baseModel', model.id)}
                    className={`flex items-center justify-between p-4 rounded-lg border transition ${
                      formData.baseModel === model.id
                        ? 'bg-orange-500/20 border-orange-500'
                        : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="text-left">
                      <div className="font-medium text-white">{model.name}</div>
                      <div className="text-xs text-gray-500">{model.provider} • {model.size}</div>
                    </div>
                    {formData.baseModel === model.id && (
                      <Check size={20} className="text-orange-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Target Hardware
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['cloud', 'edge', 'both'] as const).map(hw => (
                    <button
                      key={hw}
                      onClick={() => updateField('targetHardware', hw)}
                      className={`p-4 rounded-lg border transition ${
                        formData.targetHardware === hw
                          ? 'bg-orange-500/20 border-orange-500'
                          : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="font-medium text-white capitalize">{hw}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {hw === 'cloud' && 'GPU servers'}
                        {hw === 'edge' && 'Mobile/local'}
                        {hw === 'both' && 'All platforms'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Minimum Memory (GB)
                </label>
                <input
                  type="number"
                  value={formData.minMemoryGb}
                  onChange={e => updateField('minMemoryGb', parseInt(e.target.value) || 0)}
                  min={1}
                  max={128}
                  className="w-32 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-800">
          <button
            onClick={handleBack}
            disabled={step === 0}
            className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft size={16} />
            Back
          </button>

          {step < STEP_TITLES.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={!isStepValid()}
              className="flex items-center gap-2 px-6 py-2 bg-orange-600 hover:bg-orange-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-lg transition"
            >
              Next
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={!isStepValid() || creating}
              className="flex items-center gap-2 px-6 py-2 bg-orange-600 hover:bg-orange-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-lg transition"
            >
              {creating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Create Project
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
