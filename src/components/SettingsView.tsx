import React from 'react';
import { Settings, Platform, PermissionEntry } from '../types';
import { Cpu, Eye, ShieldCheck, Database, RefreshCw, Sparkles, AlertTriangle } from 'lucide-react';

interface SettingsViewProps {
  settings: Settings;
  onUpdateSettings: (s: Settings) => void;
  onTestOllama: () => void;
  platform: Platform;
  permissions: PermissionEntry[];
  onRequestPermission: (path: string) => void;
  onResetAll: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onTestOllama,
  platform,
  permissions,
  onRequestPermission,
  onResetAll,
}) => {
  const handleChange = (field: keyof Settings, value: any) => {
    onUpdateSettings({ ...settings, [field]: value });
  };

  return (
    <div className="flex flex-col gap-5 p-6 overflow-y-auto h-full font-sans max-w-5xl text-slate-200">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-light tracking-tight text-white mb-1">
          System Settings & Connections
        </h2>
        <p className="text-xs text-slate-400">
          Configure local Ollama connection, watch behavior, OS file permissions, and storage persistence.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. Ollama Connection Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg backdrop-blur-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-xs uppercase tracking-widest text-slate-300">
              Ollama Local Connection
            </h3>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Endpoint URL
              </label>
              <input
                type="text"
                value={settings.endpoint}
                onChange={(e) => handleChange('endpoint', e.target.value)}
                className="w-full bg-white/5 focus:bg-white/10 border border-white/10 focus:border-indigo-500/50 focus:outline-none rounded-xl p-2.5 text-white"
              />
            </div>

            <div>
              <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400 mb-1">
                <span>Temperature</span>
                <span className="text-indigo-400 font-bold">{settings.temperature}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.temperature}
                onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Request Timeout (ms)
              </label>
              <input
                type="number"
                value={settings.timeoutMs}
                onChange={(e) => handleChange('timeoutMs', parseInt(e.target.value) || 8000)}
                className="w-full bg-white/5 focus:bg-white/10 border border-white/10 focus:border-indigo-500/50 focus:outline-none rounded-xl p-2.5 text-white"
              />
            </div>

            <div className="pt-3 border-t border-white/10 space-y-2.5">
              <label className="flex items-center gap-2.5 cursor-pointer font-sans text-xs font-semibold text-slate-200">
                <input
                  type="checkbox"
                  checked={settings.useOllama}
                  onChange={(e) => handleChange('useOllama', e.target.checked)}
                  className="accent-indigo-500 w-4 h-4 rounded"
                />
                <span>Enable Ollama AI file sorting</span>
              </label>
            </div>

            <button
              onClick={onTestOllama}
              className="mt-3 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-200" />
              <span>Test Ollama & Refresh Models</span>
            </button>
          </div>
        </div>

        {/* 3. Watcher Behavior Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg backdrop-blur-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Eye className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-xs uppercase tracking-widest text-slate-300">
              Watcher & Monitor Parameters
            </h3>
          </div>

          <div className="space-y-3.5 text-xs font-mono">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Default Sorting Mode
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleChange('defaultMode', 'auto')}
                  className={`flex-1 py-2 rounded-xl border font-bold text-xs transition-all ${
                    settings.defaultMode === 'auto'
                      ? 'bg-indigo-600 text-white border-indigo-500/50 shadow-md shadow-indigo-600/20'
                      : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                  }`}
                >
                  Auto-Sort
                </button>
                <button
                  onClick={() => handleChange('defaultMode', 'review')}
                  className={`flex-1 py-2 rounded-xl border font-bold text-xs transition-all ${
                    settings.defaultMode === 'review'
                      ? 'bg-indigo-600 text-white border-indigo-500/50 shadow-md shadow-indigo-600/20'
                      : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                  }`}
                >
                  Review First
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Auto-Sort Delay (ms)
              </label>
              <input
                type="number"
                value={settings.autoDelay}
                onChange={(e) => handleChange('autoDelay', parseInt(e.target.value) || 0)}
                className="w-full bg-white/5 focus:bg-white/10 border border-white/10 focus:border-indigo-500/50 focus:outline-none rounded-xl p-2.5 text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                FS Monitoring API
              </label>
              <select
                value={settings.watchMethod}
                onChange={(e) => handleChange('watchMethod', e.target.value as any)}
                className="w-full bg-[#0c0d0e] border border-white/10 focus:border-indigo-500/50 focus:outline-none rounded-xl p-2.5 text-white font-bold cursor-pointer"
              >
                <option value="fsevents" className="bg-[#0c0d0e]">OS Native (FSEvents / ReadDirectoryChangesW / inotify)</option>
                <option value="polling" className="bg-[#0c0d0e]">Polling Fallback Interval</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. Custom AI Sorting Instructions Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg backdrop-blur-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-xs uppercase tracking-widest text-slate-300">
              Custom AI Sorting Instructions
            </h3>
          </div>

          <div className="space-y-2 font-mono text-xs">
            <label className="block text-[10px] uppercase font-bold text-slate-400">
              Fine-Tuned Processing Guidelines
            </label>
            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              These instructions will be appended to every Ollama AI request along with the base classification schema.
            </p>
            <textarea
              rows={4}
              value={settings.customInstructions || ''}
              onChange={(e) => handleChange('customInstructions', e.target.value)}
              placeholder="e.g. Put all invoices under Documents/Invoices. Treat Python files as Code/Backend..."
              className="w-full bg-white/5 focus:bg-white/10 border border-white/10 focus:border-indigo-500/50 focus:outline-none rounded-xl p-3 text-white text-xs font-mono leading-relaxed resize-none"
            />
          </div>
        </div>

        {/* 4. OS Permissions & Storage Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-xs uppercase tracking-widest text-slate-300">
                OS Permissions & Storage
              </h3>
            </div>
            <span className="font-mono text-[10px] font-bold bg-white/10 text-slate-300 border border-white/10 px-2.5 py-0.5 rounded-md">
              {platform.toUpperCase()}
            </span>
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            {permissions.map((p, idx) => (
              <div key={idx} className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
                <div className="min-w-0 flex-1 mr-2">
                  <div className="font-bold truncate text-white">{p.path}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Scope: <b className="text-indigo-300">{p.scope}</b> ({p.platform})
                  </div>
                </div>
                <button
                  onClick={() => onRequestPermission(p.path)}
                  className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold text-[10px] px-3 py-1 rounded-lg transition-all"
                >
                  Granted ✓
                </button>
              </div>
            ))}

            <div className="pt-4 border-t border-white/10 mt-4">
              <div className="flex items-center gap-1.5 text-rose-400 font-bold text-xs mb-1">
                <AlertTriangle className="w-4 h-4" />
                <span>Reset Application Storage</span>
              </div>
              <p className="font-sans text-[11px] text-slate-400 mb-3 leading-relaxed">
                Clears saved rules, activity logs, and shelf data, then reinitializes Sift.
              </p>
              <button
                onClick={onResetAll}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-2 px-4 rounded-xl transition-all shadow-lg shadow-rose-600/20"
              >
                Reset Sift Database…
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
