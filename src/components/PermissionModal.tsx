import React from 'react';
import { Platform } from '../types';
import { ShieldCheck, Folder, Lock } from 'lucide-react';

interface PermissionModalProps {
  isOpen: boolean;
  path: string;
  platform: Platform;
  onGrant: () => void;
  onCancel: () => void;
}

export const PermissionModal: React.FC<PermissionModalProps> = ({
  isOpen,
  path,
  platform,
  onGrant,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0c0d0e]/95 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4 font-sans text-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center flex-none">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-extrabold text-base text-white">
              {platform === 'macos'
                ? 'Security-Scoped Access Request'
                : platform === 'windows'
                ? 'Windows Folder Permission'
                : 'Linux Filesystem Access'}
            </h3>
            <p className="text-xs text-slate-400">
              Sift requires OS authorization to monitor and sort files in this directory.
            </p>
          </div>
        </div>

        <div className="p-3 bg-white/5 border border-white/10 rounded-xl font-mono text-xs flex items-center gap-2">
          <Folder className="w-4 h-4 text-amber-400 flex-none" />
          <span className="truncate text-white font-semibold">{path}</span>
        </div>

        <div className="text-xs text-slate-300 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/10">
          {platform === 'macos' && (
            <p>
              macOS sandbox security requires a persistent security-scoped bookmark to read events and move items safely without requesting password authorization again.
            </p>
          )}
          {platform === 'windows' && (
            <p>
              Windows File API grants Read/Write permissions inside AppData and User Directories for background file auto-sorting.
            </p>
          )}
          {platform === 'linux' && (
            <p>
              Linux Inotify monitoring requires read and write access to the target path.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2.5 pt-2">
          <button
            onClick={onCancel}
            className="bg-white/10 hover:bg-white/15 text-white font-bold text-xs py-2 px-4 rounded-xl border border-white/10 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onGrant}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 px-5 rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Grant Access</span>
          </button>
        </div>
      </div>
    </div>
  );
};
