import React, { useRef, useEffect } from 'react';
import { Category, SortingFile, SortingMode } from '../types';
import { fmtSize, nowT } from '../utils/helpers';
import { Check, X, Terminal, Clock, FileText, Zap, HelpCircle } from 'lucide-react';

interface WatchViewProps {
  files: SortingFile[];
  categories: Category[];
  mode: SortingMode;
  onApproveFile: (file: SortingFile) => void;
  onSkipFile: (file: SortingFile) => void;
  totals: { sorted: number; tokens: number };
  histMs: number[];
  consoleLogs: Array<{ id: string; t: string; text: string; cls: string }>;
  onClearConsole: () => void;
  recentDecisions: Array<{ id: string; name: string; catName: string; color: string; t: string }>;
  watching: boolean;
  watchPath: string;
}

export const WatchView: React.FC<WatchViewProps> = ({
  files,
  categories,
  mode,
  onApproveFile,
  onSkipFile,
  totals,
  histMs,
  consoleLogs,
  onClearConsole,
  recentDecisions,
  watching,
  watchPath,
}) => {
  const consoleContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (consoleContainerRef.current) {
      consoleContainerRef.current.scrollTop = consoleContainerRef.current.scrollHeight;
    }
  }, [consoleLogs]);

  const avgMs = histMs.length
    ? Math.round(histMs.reduce((a, b) => a + b, 0) / histMs.length)
    : '—';

  const getCat = (id?: string) =>
    categories.find((c) => c.id === id) || categories[categories.length - 1];

  return (
    <div className="flex flex-col gap-5 p-6 overflow-y-auto h-full font-sans text-slate-200">
      {/* Watch Dashboard Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-white mb-1">Watch Dashboard</h1>
          <p className="text-slate-400 text-sm">
            Monitoring <span className="text-indigo-400 font-mono">{watchPath}</span> for new items.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Watcher Status</span>
          <div className="flex items-center gap-2 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 text-xs">
            <span className={`w-2 h-2 rounded-full ${watching ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span>{watching ? 'Active (fsevents)' : 'Paused'}</span>
          </div>
        </div>
      </div>

      {/* Stats Summary Cards Row */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm shadow-lg">
          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            <span>Files sorted</span>
            <span className="text-emerald-400 font-mono">▲ live</span>
          </div>
          <div className="text-3xl font-light text-white tracking-tighter mb-2">
            {totals.sorted}
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 transition-all" style={{ width: `${Math.min(100, totals.sorted * 10)}%` }} />
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm shadow-lg">
          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            <span>In queue</span>
            <span className="text-amber-400 font-mono">{watching ? 'listening' : 'paused'}</span>
          </div>
          <div className="text-3xl font-light text-white tracking-tighter mb-2">
            {files.length}
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 transition-all" style={{ width: `${Math.min(100, files.length * 20)}%` }} />
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm shadow-lg">
          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            <span>Avg decision</span>
            <span className="text-indigo-400 font-mono">ms / file</span>
          </div>
          <div className="text-3xl font-light text-white tracking-tighter mb-2">
            {avgMs}
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-400 transition-all" style={{ width: '65%' }} />
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm shadow-lg">
          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            <span>Tokens used</span>
            <span className="text-rose-400 font-mono">ollama</span>
          </div>
          <div className="text-3xl font-light text-white tracking-tighter mb-2">
            {totals.tokens.toLocaleString()}
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-rose-500 transition-all" style={{ width: '40%' }} />
          </div>
        </div>
      </div>

      {/* Main Grid: Left Inbox + Right Decision Engine Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Inbox Panel */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col min-h-[420px] backdrop-blur-sm shadow-lg">
          <div className="flex items-center justify-between p-4 px-5 border-b border-white/10 bg-black/20">
            <div className="flex items-center gap-2.5">
              <h3 className="font-bold text-xs uppercase tracking-widest text-slate-400">Inbox Queue</h3>
              <span className="font-mono text-xs font-bold bg-white/10 text-white rounded-lg px-2.5 py-0.5 border border-white/10">
                {files.length}
              </span>
            </div>
            <span className="font-mono text-[10.5px] text-slate-400">
              {mode === 'auto' ? 'mode: auto-sort active' : 'mode: awaiting review'}
            </span>
          </div>

          <div className="p-4 flex-1 overflow-y-auto">
            {files.length === 0 ? (
              <div className="m-6 border border-dashed border-white/10 bg-white/5 rounded-2xl p-10 text-center text-slate-400 text-xs leading-relaxed">
                <FileText className="w-8 h-8 mx-auto mb-3 text-slate-500" />
                <p>Nothing in the inbox queue right now.</p>
                <p className="mt-1 font-medium text-slate-300">
                  Drop files anywhere on this window, or click <b className="text-indigo-400">Simulate File</b> in the top bar.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {files.map((f) => {
                  const decision = f.decision;
                  const cat = decision ? getCat(decision.catId) : null;
                  const confPct = decision ? Math.round(decision.confidence * 100) : 0;

                  return (
                    <div
                      key={f.id}
                      className={`border border-white/10 rounded-2xl p-4 bg-black/30 backdrop-blur-sm shadow-lg flex flex-col justify-between transition-all hover:bg-black/40 ${
                        f.status === 'analyzing'
                          ? 'border-indigo-500/50 bg-indigo-500/5 animate-pulse'
                          : ''
                      }`}
                      style={{ borderColor: cat ? `${cat.color}80` : undefined }}
                    >
                      <div>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex-none flex items-center justify-center font-mono font-bold text-xs uppercase text-white shadow-inner"
                            style={{ backgroundColor: cat ? cat.color : '#475569' }}
                          >
                            {f.ext || '??'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-mono text-xs font-semibold truncate text-white" title={f.name}>
                              {f.name}
                            </div>
                            <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                              {fmtSize(f.size)} · {nowT().slice(0, 5)}
                            </div>
                          </div>
                        </div>

                        {/* Status / Verdict Section */}
                        <div className="mt-3.5 pt-2.5 border-t border-white/5">
                          {f.status === 'queued' && (
                            <span className="inline-block font-mono text-[10px] font-medium bg-white/5 text-slate-400 border border-white/10 rounded-full px-2.5 py-0.5">
                              queued in buffer…
                            </span>
                          )}

                          {f.status === 'analyzing' && (
                            <div className="flex items-center gap-1.5 font-mono text-[10.5px] font-semibold text-emerald-400">
                              <Zap className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                              <span>Analyzing content & metadata…</span>
                            </div>
                          )}

                          {decision && cat && (
                            <div>
                              <div className="flex items-center justify-between text-xs">
                                <span
                                  className="font-bold text-[11px] px-2.5 py-0.5 rounded-full border"
                                  style={{
                                    color: cat.color,
                                    backgroundColor: `${cat.color}25`,
                                    borderColor: `${cat.color}50`,
                                  }}
                                >
                                  {cat.name}
                                </span>
                                <span className="font-mono text-xs font-bold text-slate-300">
                                  {confPct}% confidence
                                </span>
                              </div>

                              {/* Confidence Bar */}
                              <div className="w-full h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${confPct}%`,
                                    backgroundColor: cat.color,
                                  }}
                                />
                              </div>

                              <p className="text-[11px] text-slate-400 italic mt-2 line-clamp-2">
                                {decision.reason}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Review Mode Action Buttons */}
                      {f.status === 'review' && decision && (
                        <div className="flex gap-2 mt-3.5 pt-2.5 border-t border-white/5">
                          <button
                            onClick={() => onApproveFile(f)}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-1.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1 shadow-md shadow-indigo-600/20"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Sort ✓</span>
                          </button>
                          <button
                            onClick={() => onSkipFile(f)}
                            className="bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-white/10 hover:border-rose-500/30 font-bold text-xs py-1.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Skip</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Console & Recent Decisions Rail */}
        <div className="flex flex-col gap-5">
          {/* Real-time Decision Engine Console */}
          <div className="bg-black/60 text-slate-300 border border-white/10 rounded-2xl overflow-hidden flex flex-col h-[280px] shadow-lg font-mono text-xs backdrop-blur-md">
            <div className="flex items-center justify-between p-3 px-4 bg-black/40 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-bold uppercase tracking-wider text-[10px] text-indigo-300">
                  Decision Engine Log
                </span>
              </div>
              <button
                onClick={onClearConsole}
                className="text-[10px] font-semibold text-slate-400 hover:text-white px-2 py-0.5 rounded-lg border border-white/10 bg-white/5"
              >
                Clear
              </button>
            </div>

            <div ref={consoleContainerRef} className="p-3.5 overflow-y-auto flex-1 space-y-1.5 leading-relaxed">
              {consoleLogs.map((log) => (
                <div key={log.id} className="text-[11px] break-words">
                  <span className="text-slate-500 mr-2">{log.t}</span>
                  <span
                    dangerouslySetInnerHTML={{ __html: log.text }}
                    className={
                      log.cls === 'ok'
                        ? 'text-emerald-400 font-semibold'
                        : log.cls === 'err'
                        ? 'text-rose-400'
                        : log.cls === 'oll'
                        ? 'text-indigo-300'
                        : 'text-slate-300'
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Recent Decisions List */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-lg backdrop-blur-sm flex flex-col">
            <div className="flex items-center gap-2 pb-2.5 border-b border-white/10">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                Recent Decisions
              </h4>
            </div>

            <ul className="mt-2.5 space-y-1.5 max-h-[140px] overflow-y-auto">
              {recentDecisions.length === 0 ? (
                <li className="text-xs text-slate-500 py-2 italic text-center">
                  No decisions logged yet…
                </li>
              ) : (
                recentDecisions.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center gap-2 text-xs p-2 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-none"
                      style={{ backgroundColor: r.color }}
                    />
                    <span className="font-mono text-[11px] font-medium truncate flex-1 text-slate-200">
                      {r.name}
                    </span>
                    <span
                      className="font-bold text-[10px] px-2 py-0.5 rounded-full border"
                      style={{
                        backgroundColor: `${r.color}20`,
                        borderColor: `${r.color}40`,
                        color: r.color,
                      }}
                    >
                      {r.catName}
                    </span>
                    <span className="font-mono text-[9.5px] text-slate-500">{r.t}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
