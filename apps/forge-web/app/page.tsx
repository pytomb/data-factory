'use client';

import { useState } from 'react';
import Dashboard from '@/components/Dashboard';
import NewProjectWizard from '@/components/NewProjectWizard';
import { Database, Hammer, FlaskConical, FolderOpen, Settings, Plus } from 'lucide-react';

type TabId = 'forge' | 'datasets' | 'models' | 'projects' | 'settings';

interface Tab {
  id: TabId;
  name: string;
  icon: React.ReactNode;
  color: string;
}

const TABS: Tab[] = [
  { id: 'forge', name: 'Forge Floor', icon: <Hammer className="w-4 h-4" />, color: 'text-orange-400' },
  { id: 'datasets', name: 'Datasets', icon: <Database className="w-4 h-4" />, color: 'text-blue-400' },
  { id: 'models', name: 'Models', icon: <FlaskConical className="w-4 h-4" />, color: 'text-purple-400' },
  { id: 'projects', name: 'Projects', icon: <FolderOpen className="w-4 h-4" />, color: 'text-green-400' },
  { id: 'settings', name: 'Settings', icon: <Settings className="w-4 h-4" />, color: 'text-gray-400' },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>('forge');
  const [showNewProject, setShowNewProject] = useState(false);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'forge':
        return <Dashboard />;
      case 'datasets':
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-4">Datasets</h2>
            <p className="text-gray-400">View and manage training datasets across all projects.</p>
            <div className="mt-8 p-8 border border-dashed border-gray-700 rounded-lg text-center text-gray-500">
              Dataset management coming soon
            </div>
          </div>
        );
      case 'models':
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-4">Models</h2>
            <p className="text-gray-400">View trained models, metrics, and deployment status.</p>
            <div className="mt-8 p-8 border border-dashed border-gray-700 rounded-lg text-center text-gray-500">
              Model registry coming soon
            </div>
          </div>
        );
      case 'projects':
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-4">Projects</h2>
            <p className="text-gray-400">Manage Data Factory projects.</p>
            <button
              onClick={() => setShowNewProject(true)}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
            <div className="mt-8 p-8 border border-dashed border-gray-700 rounded-lg text-center text-gray-500">
              Project list coming soon
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-4">Settings</h2>
            <p className="text-gray-400">Configure Data Factory preferences.</p>
            <div className="mt-8 p-8 border border-dashed border-gray-700 rounded-lg text-center text-gray-500">
              Settings panel coming soon
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <Hammer className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Data Factory</h1>
              <p className="text-xs text-gray-400">Forge</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="flex items-center gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <span className={activeTab === tab.id ? tab.color : ''}>{tab.icon}</span>
                <span className="text-sm">{tab.name}</span>
              </button>
            ))}
          </nav>

          <button
            onClick={() => setShowNewProject(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>
      </header>

      {/* Tab Content */}
      <div className="flex-1">
        {renderTabContent()}
      </div>

      {/* New Project Modal */}
      {showNewProject && (
        <NewProjectWizard onClose={() => setShowNewProject(false)} />
      )}
    </main>
  );
}
