import React from 'react';
import { Platform, SortingMode } from '../types';
import { Play, Pause, Plus, Upload, ShieldCheck, Monitor, Cpu } from 'lucide-react';

interface TopBarProps {
  platform: Platform;
  watching: boolean;
  onToggleWatch: () => void;
  watchPath: string;
  onEditPath: () => void;
  models: string[];
  selectedModel: string;
  onSelectModel: (m: string) => void;
  mode: SortingMode;
  onSetMode: (m: SortingMode) => void;
  onUploadClick: () => void;
  engineOnline: boolean | null;
  engineName: string;
  appName?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  platform,
  watching,
  onToggleWatch,
  watchPath,
  onEditPath,
  models,
  selectedModel,
  onSelectModel,
  mode,
  onSetMode,
  onUploadClick,
  engineOnline,
  engineName,
  appName = 'Sift',
}) => {
  return (
    <header className="flex-none flex flex-col bg-black/40 backdrop-blur-md border-b border-white/10 select-none text-slate-200">
      {/* Titlebar with native platform window controls */}
      <div className="h-10 flex items-center justify-between px-4 bg-black/50 border-b border-white/5 relative">
        {/* Left window controls based on active OS platform */}
        <div className="flex items-center gap-3">
          {platform === 'macos' && (
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 hover:bg-rose-500 transition-colors cursor-pointer" title="Close" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 hover:bg-amber-500 transition-colors cursor-pointer" title="Minimize" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 hover:bg-emerald-500 transition-colors cursor-pointer" title="Maximize" />
            </div>
          )}

          {platform === 'windows' && (
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
              <Monitor className="w-3 h-3 text-emerald-400" />
              <span>Windows AppData</span>
            </div>
          )}

          {platform === 'linux' && (
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
              <ShieldCheck className="w-3 h-3 text-indigo-400" />
              <span>Linux XDG Config</span>
            </div>
          )}
        </div>

        {/* Center Title */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 font-display font-bold text-sm tracking-tight text-white">
          <span className="w-4 h-4 rounded-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-[10px] shadow-sm">
            ◆
          </span>
          <span className="tracking-tight uppercase">{appName}</span>
          <span className="font-mono text-[10px] font-medium text-slate-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
            v1.2.0
          </span>
        </div>

        {/* Right Status */}
        <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
          <span>folder autopilot · ollama</span>
        </div>
      </div>

      {/* Main Control Toolbar */}
      <div className="flex items-center justify-between gap-3 p-2.5 px-4 bg-black/20">
        {/* Watch Control Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleWatch}
            className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all shadow-sm ${
              watching
                ? 'bg-indigo-600 border-indigo-500/50 text-white shadow-indigo-500/20'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${watching ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            {watching ? 'Watching (Active)' : 'Start Watching'}
          </button>

          {/* Watched Path Pill */}
          <button
            onClick={onEditPath}
            className="flex items-center gap-2 bg-white/5 border border-white/10 hover:border-indigo-500/50 rounded-xl px-3 py-1.5 text-xs transition-all max-w-[280px] group"
            title="Click to edit watch folder"
          >
            <span className="text-amber-400">📁</span>
            <span className="font-mono text-[11px] truncate text-slate-200 font-medium">{watchPath}</span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-indigo-400">edit</span>
          </button>
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center gap-2.5">
          {/* Model Selector Dropdown */}
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={selectedModel}
              onChange={(e) => onSelectModel(e.target.value)}
              className="font-mono text-xs font-semibold bg-transparent text-white focus:outline-none cursor-pointer"
            >
              {models.map((m) => (
                <option key={m} value={m} className="bg-[#0c0d0e] text-white">
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Mode Toggle (Auto-sort / Review) */}
          <div className="flex bg-white/5 p-0.5 rounded-xl border border-white/10 text-xs font-semibold">
            <button
              onClick={() => onSetMode('auto')}
              className={`px-3 py-1 rounded-lg transition-all ${
                mode === 'auto'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Auto-sort
            </button>
            <button
              onClick={() => onSetMode('review')}
              className={`px-3 py-1 rounded-lg transition-all ${
                mode === 'review'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Review
            </button>
          </div>

          {/* Action Button: Add / Drop File */}
          <button
            onClick={onUploadClick}
            className="flex items-center gap-1.5 font-semibold text-xs bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/30 rounded-xl px-3.5 py-1.5 transition-all shadow-lg shadow-indigo-600/20"
            title="Upload actual files or folders to the watch directory"
          >
            <Upload className="w-3.5 h-3.5 text-white" />
            <span>Drop Files / Folders</span>
          </button>
        </div>
      </div>
    </header>
  );
};
