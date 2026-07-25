import React, { useState } from 'react';
import { ActivityLogEntry } from '../types';
import { Download, Trash2, Undo2, Filter } from 'lucide-react';

interface ActivityViewProps {
  logs: ActivityLogEntry[];
  onClearLogs: () => void;
  onUndoMove: (file: string) => void;
  onBulkUndo: () => void;
}

export const ActivityView: React.FC<ActivityViewProps> = ({
  logs,
  onClearLogs,
  onUndoMove,
  onBulkUndo,
}) => {
  const [filter, setFilter] = useState<string>('all');

  const filteredLogs = logs.filter((l) => {
    if (filter === 'all') return true;
    return l.kind === filter;
  });

  const handleExportCsv = () => {
    const head = 'Time,Event,File,Category,Engine,Confidence,DurationMs,Note\n';
    const body = logs
      .map((l) =>
        [
          new Date(l.t).toISOString(),
          l.kind,
          `"${(l.file || '').replace(/"/g, '""')}"`,
          l.cat || '',
          l.engine || '',
          l.conf ? `${Math.round(l.conf * 100)}%` : '',
          l.ms || '',
          `"${(l.note || '').replace(/"/g, '""')}"`,
        ].join(',')
      )
      .join('\n');

    const blob = new Blob([head + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sift-activity-log-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filterOptions = [
    { id: 'all', label: 'All Events' },
    { id: 'sorted', label: 'Sorted Files' },
    { id: 'spawn', label: 'Arrivals' },
    { id: 'skipped', label: 'Skipped' },
    { id: 'undo', label: 'Undone' },
    { id: 'system', label: 'System' },
    { id: 'error', label: 'Errors' },
  ];

  const getKindBadge = (kind: string) => {
    switch (kind) {
      case 'sorted':
        return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      case 'spawn':
        return 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30';
      case 'skipped':
        return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
      case 'undo':
        return 'bg-purple-500/20 text-purple-300 border border-purple-500/30';
      case 'error':
        return 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
      default:
        return 'bg-white/10 text-slate-300 border border-white/10';
    }
  };

  return (
    <div className="flex flex-col gap-5 p-6 overflow-y-auto h-full font-sans text-slate-200">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="text-3xl font-light tracking-tight text-white mb-1">
            Activity Log & Undo Journal
          </h2>
          <p className="text-xs text-slate-400">
            Real-time chronological log of file arrivals, AI classifications, moves, and undo operations.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onBulkUndo}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs py-2 px-3.5 rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-amber-600/20"
            title="Bulk Undo moves and restore files"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Bulk Undo Moves</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 font-bold text-xs py-2 px-3.5 rounded-xl transition-all flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onClearLogs}
            className="bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-white/10 hover:border-rose-500/30 font-bold text-xs py-2 px-3.5 rounded-xl transition-all flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 flex-wrap">
        {filterOptions.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`font-semibold text-xs px-3.5 py-1.5 rounded-full border transition-all ${
              filter === f.id
                ? 'bg-indigo-600 text-white border-indigo-500/50 shadow-md shadow-indigo-600/20 font-bold'
                : 'bg-white/5 text-slate-400 border-white/10 hover:border-white/20 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Activity Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-lg backdrop-blur-sm">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead>
            <tr className="bg-black/30 border-b border-white/10 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              <th className="p-3 pl-5">Time</th>
              <th className="p-3">Event</th>
              <th className="p-3">File</th>
              <th className="p-3">Category / Note</th>
              <th className="p-3">Engine</th>
              <th className="p-3">Conf</th>
              <th className="p-3">Duration</th>
              <th className="p-3 text-right pr-5">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-10 text-center text-slate-400 font-sans">
                  No activity matching current filter.
                </td>
              </tr>
            ) : (
              filteredLogs.map((l) => {
                const timeStr = new Date(l.t).toTimeString().slice(0, 8);

                return (
                  <tr key={l.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3 pl-5 text-slate-400">{timeStr}</td>

                    <td className="p-3">
                      <span className={`font-bold text-[9.5px] uppercase px-2.5 py-0.5 rounded-full ${getKindBadge(l.kind)}`}>
                        {l.kind}
                      </span>
                    </td>

                    <td className="p-3 font-semibold text-white max-w-[200px] truncate" title={l.file}>
                      {l.file}
                    </td>

                    <td className="p-3">
                      {l.cat ? (
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color || '#6366f1' }} />
                          <span className="font-semibold text-slate-200">{l.cat}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">{l.note || '—'}</span>
                      )}
                    </td>

                    <td className="p-3">
                      {l.engine ? (
                        <span className="bg-white/10 text-slate-300 border border-white/10 px-2 py-0.5 rounded-md text-[10px] font-bold">
                          {l.engine}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td className="p-3 text-slate-400">
                      {l.conf ? `${Math.round(l.conf * 100)}%` : '—'}
                    </td>

                    <td className="p-3 text-slate-400">
                      {l.ms ? `${l.ms}ms` : '—'}
                    </td>

                    <td className="p-3 pr-5 text-right">
                      {l.kind === 'sorted' && (
                        <button
                          onClick={() => onUndoMove(l.file)}
                          className="font-bold text-[10px] bg-white/10 border border-white/10 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/30 text-slate-300 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ml-auto"
                          title="Undo move and restore file"
                        >
                          <Undo2 className="w-3 h-3" />
                          <span>Undo</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
