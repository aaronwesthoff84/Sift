import React from 'react';
import { Eye, FolderArchive, Sliders, Activity, Settings as SettingsIcon, RefreshCw } from 'lucide-react';
import { OllamaStatus } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  queueLength: number;
  ollamaStatus: OllamaStatus;
  activeModel?: string;
  onTestOllama: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  queueLength,
  ollamaStatus,
  activeModel,
  onTestOllama,
}) => {
  const navItems = [
    { id: 'watch', label: 'Watch', icon: Eye, badge: queueLength > 0 ? queueLength : null },
    { id: 'shelf', label: 'Shelf', icon: FolderArchive },
    { id: 'rules', label: 'Rules', icon: Sliders },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const getDotStatus = () => {
    if (ollamaStatus.connected === true) return { color: 'bg-emerald-500 animate-pulse', text: 'Ollama Online' };
    if (ollamaStatus.connected === false) return { color: 'bg-rose-500', text: 'Offline · Heuristics' };
    return { color: 'bg-amber-500 animate-spin', text: 'Connecting…' };
  };

  const status = getDotStatus();

  return (
    <aside className="w-[212px] flex-none bg-black/30 border-r border-white/10 flex flex-col p-3 gap-1 select-none text-slate-300 backdrop-blur-md">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex items-center gap-2.5 w-full text-xs font-semibold px-3 py-2.5 rounded-xl transition-all text-left relative ${
              isActive
                ? 'bg-white/10 text-indigo-400 font-bold border border-white/15 shadow-lg shadow-indigo-500/10'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Icon className={`w-4 h-4 flex-none ${isActive ? 'text-indigo-400' : 'opacity-70'}`} />
            <span>{item.label}</span>

            {item.badge !== null && item.badge !== undefined && (
              <span className="ml-auto font-mono font-bold text-[10px] bg-indigo-500 text-white rounded-full px-1.5 py-0.2 min-w-[18px] text-center shadow-sm">
                {item.badge}
              </span>
            )}
          </button>
        );
      })}

      <div className="font-bold text-[9.5px] uppercase tracking-wider text-slate-500 px-3 pt-4 pb-1">
        Engine Status
      </div>

      {/* Ollama Engine Status Card */}
      <div className="mt-auto bg-white/5 border border-white/10 rounded-2xl p-3 shadow-lg backdrop-blur-sm flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-xs font-bold text-white">
          <span className={`w-2 h-2 rounded-full flex-none ${status.color}`} />
          <span>{status.text}</span>
        </div>

        <div className="font-mono text-xs font-semibold text-indigo-400 truncate">
          {activeModel || ollamaStatus.availableModels[0] || 'llama3.2'}
        </div>

        <div className="font-mono text-[10px] text-slate-400">
          127.0.0.1:11434 {ollamaStatus.latencyMs ? `· ${ollamaStatus.latencyMs}ms` : ''}
        </div>

        <button
          onClick={onTestOllama}
          className="mt-1 w-full text-[10.5px] font-semibold py-1.5 px-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-indigo-500/40 text-slate-300 hover:text-white transition-all flex items-center justify-center gap-1.5"
        >
          <RefreshCw className="w-3 h-3 text-indigo-400" />
          <span>Test Connection</span>
        </button>
      </div>
    </aside>
  );
};
