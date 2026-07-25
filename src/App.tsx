import React, { useState, useEffect, useRef } from 'react';
import {
  Platform,
  SortingMode,
  SortingFile,
  Category,
  Rule,
  Settings,
  OllamaStatus,
  ActivityLogEntry,
  Decision,
} from './types';
import { extOf, randSize, fmtSize, nowT, heuristicClassify } from './utils/helpers';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { WatchView } from './components/WatchView';
import { ShelfView } from './components/ShelfView';
import { RulesView } from './components/RulesView';
import { ActivityView } from './components/ActivityView';
import { SettingsView } from './components/SettingsView';
import { PermissionModal } from './components/PermissionModal';

import { DEFAULT_APP_NAME, APP_VERSION } from './utils/branding';

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'documents', name: 'Documents', color: '#2f6fdb', desc: 'Reports, invoices, PDFs, contracts, notes, prose', exts: 'pdf,doc,docx,txt,md,rtf,pages,tex,epub', kw: ['invoice', 'report', 'contract', 'notes', 'resume', 'letter'], targetSubfolder: 'Documents' },
  { id: 'images', name: 'Images', color: '#d6488f', desc: 'Photos, screenshots, illustrations, graphic assets', exts: 'jpg,jpeg,png,heic,gif,webp,svg,tiff,bmp,avif', kw: ['screenshot', 'photo', 'img', 'picture', 'wallpaper', 'scan'], targetSubfolder: 'Images' },
  { id: 'code', name: 'Code', color: '#178a54', desc: 'Source files, scripts, configurations, notebooks', exts: 'js,ts,jsx,tsx,py,swift,rs,go,c,cpp,h,rb,sh,html,css,sql,json,ipynb', kw: ['script', 'main', 'index', 'server', 'utils', 'app'], targetSubfolder: 'Code' },
  { id: 'media', name: 'Audio & Video', color: '#d98a1f', desc: 'Video clips, audio recordings, music, podcasts', exts: 'mp4,mov,mkv,avi,mp3,wav,flac,aac,m4a,ogg,webm,aiff', kw: ['podcast', 'recording', 'clip', 'track', 'mix', 'video'], targetSubfolder: 'Media' },
  { id: 'archives', name: 'Archives', color: '#7a5ad0', desc: 'Compressed bundles, disk images, installers', exts: 'zip,rar,7z,tar,gz,dmg,iso,pkg,bz2', kw: ['backup', 'bundle', 'release', 'installer'], targetSubfolder: 'Archives' },
  { id: 'data', name: 'Data', color: '#0e93a8', desc: 'Datasets, spreadsheets, analytics exports, database dumps', exts: 'csv,xlsx,xls,parquet,tsv,db,sqlite,yaml,yml,xml', kw: ['dataset', 'export', 'metrics', 'analytics', 'budget'], targetSubfolder: 'Data' },
  { id: 'design', name: 'Design', color: '#e05252', desc: 'Design mockups, vector artwork, 3D models', exts: 'fig,sketch,psd,ai,xd,blend,obj,stl', kw: ['mockup', 'wireframe', 'logo', 'brand', 'prototype'], targetSubfolder: 'Design' },
  { id: 'misc', name: 'Everything else', color: '#6b7280', desc: 'Fallback category for uncategorized files', exts: '', kw: [], targetSubfolder: 'Misc' },
];

const DEFAULT_MODELS = ['llama3.2', 'llama3.1', 'mistral', 'phi3.5', 'qwen2.5', 'gemma2'];

export default function App() {
  const [platform, setPlatform] = useState<Platform>('macos');
  const [activeTab, setActiveTab] = useState<string>('watch');
  const [watching, setWatching] = useState<boolean>(true);
  const [watchPath, setWatchPath] = useState<string>('~/Downloads');
  const [shelfPath, setShelfPath] = useState<string>('~/Documents/Shelf');

  const [models, setModels] = useState<string[]>(DEFAULT_MODELS);

  const [files, setFiles] = useState<SortingFile[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [rules, setRules] = useState<Rule[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [shelfData, setShelfData] = useState<Record<string, any[]>>({});

  const [settings, setSettings] = useState<Settings>({
    endpoint: 'http://localhost:11434',
    model: 'llama3.2',
    temperature: 0.2,
    timeoutMs: 8000,
    useOllama: true,
    autoDelay: 900,
    promptTemplate: `You are Sift, an AI file-sorting engine. Classify the incoming file into exactly one category.\nRespond with JSON: {"category":"<category name>","subpath":"<Project or Topic>/<Phase or Subgroup>/<Category>","confidence":<0..1>,"reason":"<max 12 words>"}\nCategories:\n{categories}`,
    customInstructions: '',
    defaultMode: 'auto',
    watchMethod: 'fsevents',
    pollIntervalMs: 2000,
    watchFolders: [],
    appName: DEFAULT_APP_NAME,
  });

  const mode = settings.defaultMode;
  const selectedModel = settings.model;

  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus>({
    connected: null,
    latencyMs: null,
    availableModels: DEFAULT_MODELS,
  });

  const [selectedCatId, setSelectedCatId] = useState<string>('documents');

  const [totals, setTotals] = useState({ sorted: 0, tokens: 0 });
  const [histMs, setHistMs] = useState<number[]>([320, 280, 410, 350]);

  const [consoleLogs, setConsoleLogs] = useState<Array<{ id: string; t: string; text: string; cls: string }>>([
    { id: '1', t: nowT(), text: '◆ Sift v1.2.0 initialized — desktop folder autopilot armed', cls: 'ok' },
  ]);

  const [recentDecisions, setRecentDecisions] = useState<Array<{ id: string; name: string; catName: string; color: string; t: string }>>([]);

  const [permissionModal, setPermissionModal] = useState<{ isOpen: boolean; path: string }>({
    isOpen: false,
    path: '',
  });

  const [isDropOver, setIsDropOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper log function
  const addConsoleLog = (text: string, cls: string = 'sys') => {
    setConsoleLogs((prev) => [
      ...prev.slice(-120),
      { id: `${Date.now()}-${Math.random()}`, t: nowT(), text, cls },
    ]);
  };

  // 1. Boot & Fetch Backend State
  useEffect(() => {
    fetch('/api/state')
      .then((res) => res.json())
      .then((data) => {
        if (data.db) {
          if (data.db.settings) setSettings((prev) => ({ ...prev, ...data.db.settings }));
          if (data.db.rules) setRules(data.db.rules);
          if (data.db.rules[0]?.categories) setCategories(data.db.rules[0].categories);
          if (data.db.activityLog) setActivityLog(data.db.activityLog);
        }
        if (data.watchDir) setWatchPath(data.watchDir);
        if (data.shelfDir) setShelfPath(data.shelfDir);
        if (data.platform) setPlatform(data.platform);

        testOllamaConnection(data.db?.settings?.endpoint || 'http://localhost:11434');
        fetchWatchFiles();
        fetchShelfData();
      })
      .catch((err) => {
        console.error('Failed to load initial state:', err);
        testOllamaConnection('http://localhost:11434');
      });
  }, []);

  // Fetch files in watch directory from backend
  const fetchWatchFiles = () => {
    fetch('/api/fs/watch-files')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.files)) {
          const loaded: SortingFile[] = data.files.map((f: any) => ({
            id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: f.name,
            path: f.path,
            ext: f.ext,
            size: f.size,
            sampleContent: f.sampleContent,
            addedAt: f.mtime || Date.now(),
            status: 'queued',
          }));
          if (loaded.length > 0) {
            setFiles((prev) => {
              const existingNames = new Set(prev.map((p) => p.name));
              const newFiles = loaded.filter((l) => !existingNames.has(l.name));
              return [...prev, ...newFiles];
            });
          }
        }
      })
      .catch((err) => console.error('Watch files error:', err));
  };

  // Fetch shelf categories files from backend
  const fetchShelfData = () => {
    fetch('/api/fs/shelf')
      .then((res) => res.json())
      .then((data) => {
        if (data.shelf) {
          setShelfData(data.shelf);
        }
      })
      .catch((err) => console.error('Shelf data error:', err));
  };

  // Test Ollama Connection
  const testOllamaConnection = async (endpointUrl?: string) => {
    const ep = endpointUrl || settings.endpoint;
    addConsoleLog(`Probing Ollama connection at ${ep}…`, 'sys');

    const t0 = performance.now();
    try {
      const resp = await fetch(`/api/ollama/proxy?path=/api/tags`);
      const latencyMs = Math.round(performance.now() - t0);

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();

      const available = (data.models || []).map((m: any) => m.name);
      const modelList = available.length ? available : DEFAULT_MODELS;

      if (!modelList.includes(selectedModel)) {
        handleUpdateSettings({ ...settings, model: modelList[0] || 'llama3.2' });
      }

      setOllamaStatus({
        connected: true,
        latencyMs,
        availableModels: modelList,
      });

      addConsoleLog(
        `✓ Ollama online · ${modelList.length} model(s) available · ${latencyMs}ms latency`,
        'ok'
      );
    } catch (e: any) {
      setOllamaStatus({
        connected: false,
        latencyMs: null,
        availableModels: DEFAULT_MODELS,
      });

      addConsoleLog(
        `⚠ Ollama unreachable — using local Heuristics engine`,
        'err'
      );
    }
  };

  // Real-time File Processing Loop
  useEffect(() => {
    const processLoop = setInterval(() => {
      if (!watching) return;

      const queuedFile = files.find((f) => f.status === 'queued');
      if (queuedFile) {
        processSingleFile(queuedFile);
      }
    }, 1500);

    return () => clearInterval(processLoop);
  }, [files, watching, mode, settings, ollamaStatus, categories]);

  // Classification Pipeline for a file
  const processSingleFile = async (file: SortingFile) => {
    // Set file status to analyzing
    setFiles((prev) =>
      prev.map((f) => (f.id === file.id ? { ...f, status: 'analyzing' } : f))
    );

    addConsoleLog(`→ ${file.name} (${fmtSize(file.size)}) · sniffing file content & metadata…`, 'sys');

    const t0 = performance.now();
    let decision: Decision | null = null;

    // 1. Try Ollama if connected
    if (settings.useOllama && ollamaStatus.connected) {
      try {
        const baseSysPrompt = settings.promptTemplate.replace(
          '{categories}',
          categories.map((c) => `- ${c.name}: ${c.desc || c.exts}`).join('\n')
        );

        const sysPrompt = `${baseSysPrompt}${
          settings.customInstructions
            ? `\n\nUSER CUSTOM INSTRUCTIONS:\n${settings.customInstructions}`
            : ''
        }`;

        const itemDesc = `Item Name: ${file.name}\nItem Type: ${
          file.isDir ? (file.isCohesive ? 'Cohesive Atomic Directory (Move folder as single unit)' : 'Directory') : 'File'
        }\nExt: ${file.ext}\nSize: ${fmtSize(file.size)}${file.sampleContent ? `\nExcerpt: ${file.sampleContent}` : ''}`;

        const resp = await fetch('/api/ollama/proxy?path=/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: selectedModel,
            stream: false,
            format: 'json',
            options: { temperature: settings.temperature },
            messages: [
              { role: 'system', content: sysPrompt },
              { role: 'user', content: itemDesc },
            ],
          }),
        });

        if (resp.ok) {
          const data = await resp.json();
          const raw = (data.message?.content || '{}').replace(/```json|```/g, '').trim();
          const parsed = JSON.parse(raw);

          const matchedCat =
            categories.find((c) => c.name.toLowerCase() === String(parsed.category || '').toLowerCase()) ||
            categories.find((c) => String(parsed.category || '').toLowerCase().includes(c.name.toLowerCase())) ||
            categories[categories.length - 1];

          decision = {
            catId: matchedCat.id,
            categoryName: matchedCat.name,
            subpath: typeof parsed.subpath === 'string' && parsed.subpath.trim() ? parsed.subpath.trim() : undefined,
            confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.88,
            reason: String(parsed.reason || 'Analyzed via Ollama model').slice(0, 120),
            engine: 'ollama',
            tokens: data.eval_count || 42,
            ms: Math.round(performance.now() - t0),
          };
        }
      } catch (err) {
        addConsoleLog(`Ollama call error, using local heuristic fallback…`, 'err');
      }
    }

    // 2. Heuristic Fallback
    if (!decision) {
      const heur = heuristicClassify(file.name, file.ext, categories);
      decision = {
        ...heur,
        ms: Math.round(performance.now() - t0),
      };
    }

    // Update File Decision & Log
    const finalDecision = decision;
    const catObj = categories.find((c) => c.id === finalDecision.catId) || categories[categories.length - 1];

    const destLabel = finalDecision.subpath ? `${finalDecision.subpath}` : catObj.name;

    addConsoleLog(
      `<span class="tag">[${finalDecision.engine.toUpperCase()}]</span> <b>${file.name}</b> ➔ <span style="color:${catObj.color};font-weight:bold">${destLabel}</span> (${Math.round(finalDecision.confidence * 100)}%) — ${finalDecision.reason}`,
      finalDecision.engine === 'ollama' ? 'oll' : 'heur'
    );

    setRecentDecisions((prev) => [
      { id: `${Date.now()}`, name: file.name, catName: destLabel, color: catObj.color, t: nowT().slice(0, 5) },
      ...prev.slice(0, 9),
    ]);

    setHistMs((prev) => [...prev.slice(-20), finalDecision.ms]);
    setTotals((prev) => ({ ...prev, tokens: prev.tokens + finalDecision.tokens }));

    setFiles((prev) =>
      prev.map((f) => {
        if (f.id === file.id) {
          return {
            ...f,
            decision: finalDecision,
            status: mode === 'auto' ? 'decided' : 'review',
          };
        }
        return f;
      })
    );

    if (mode === 'auto') {
      setTimeout(() => {
        executeSortFile(file.id, finalDecision);
      }, settings.autoDelay);
    }
  };

  // Perform move to shelf
  const executeSortFile = (fileId: string, decision: Decision) => {
    const file = files.find((f) => f.id === fileId);
    if (!file) return;

    fetch('/api/fs/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        itemPath: file.path,
        categoryId: decision.catId,
        subpath: decision.subpath,
        engine: decision.engine,
        confidence: decision.confidence,
        ms: decision.ms,
        reason: decision.reason,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
        setTotals((prev) => ({ ...prev, sorted: prev.sorted + 1 }));

        const cat = categories.find((c) => c.id === decision.catId) || categories[0];

        const logItem: ActivityLogEntry = {
          id: `act-${Date.now()}`,
          t: Date.now(),
          kind: 'sorted',
          file: data.fileName || file.name,
          cat: cat.name,
          color: cat.color,
          engine: decision.engine,
          conf: decision.confidence,
          ms: decision.ms,
          note: decision.reason,
        };

        setActivityLog((prev) => [logItem, ...prev]);
        fetchShelfData();
      })
      .catch((err) => {
        console.error('Sort move failed:', err);
      });
  };

  const handleApproveFile = (file: SortingFile) => {
    if (file.decision) {
      executeSortFile(file.id, file.decision);
    }
  };

  const handleSkipFile = (file: SortingFile) => {
    setFiles((prev) => prev.filter((f) => f.id !== file.id));
    addConsoleLog(`↷ ${file.name} skipped by user`, 'sys');

    setActivityLog((prev) => [
      {
        id: `act-${Date.now()}`,
        t: Date.now(),
        kind: 'skipped',
        file: file.name,
        note: 'Left in source folder by user review',
      },
      ...prev,
    ]);
  };

  // File Upload Handler
  const handleUploadFiles = (fileList: FileList | File[]) => {
    const formData = new FormData();
    Array.from(fileList).forEach((f) => formData.append('files', f));

    fetch('/api/fs/upload', {
      method: 'POST',
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.files)) {
          fetchWatchFiles();
          addConsoleLog(`↑ Uploaded ${data.files.length} file(s) to Watch folder`, 'ok');
        }
      })
      .catch((err) => console.error('Upload error:', err));
  };

  // Undo move
  const handleUndoMove = (fileName: string) => {
    fetch('/api/fs/undo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((res) => res.json())
      .then((data) => {
        addConsoleLog(`↶ Restored ${data.undoneCount} file(s) back to Watch folder`, 'ok');
        fetchWatchFiles();
        fetchShelfData();
      })
      .catch((err) => console.error('Undo error:', err));
  };

  // Bulk Undo
  const handleBulkUndo = () => {
    fetch('/api/fs/undo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bulk: true }),
    })
      .then((res) => res.json())
      .then((data) => {
        addConsoleLog(`↶ Bulk undone ${data.undoneCount} file move(s)`, 'ok');
        fetchWatchFiles();
        fetchShelfData();
      })
      .catch((err) => console.error('Bulk undo error:', err));
  };

  // Update Settings
  const handleUpdateSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings),
    });
  };

  // Update Rules
  const handleUpdateRules = (newRules: Rule[]) => {
    setRules(newRules);
    if (newRules[0]?.categories) {
      setCategories(newRules[0].categories);
    }
    fetch('/api/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRules),
    });
  };

  // Drag & Drop handlers on window
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDropOver(true);
  };

  const handleDragLeave = () => {
    setIsDropOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDropOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFiles(e.dataTransfer.files);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="h-screen w-screen bg-[#08090a] text-slate-200 flex items-center justify-center p-3 sm:p-5 font-sans select-none relative overflow-hidden"
    >
      {/* Background Ambient Glows for Frosted Glass Effect */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Hidden File Input for Upload */}
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={(e) => e.target.files && handleUploadFiles(e.target.files)}
        className="hidden"
      />

      {/* Main Desktop Window Container */}
      <div className="w-full max-w-[1280px] h-full max-h-[calc(100vh-2.5rem)] bg-[#0c0d0e]/90 border border-white/10 shadow-2xl backdrop-blur-2xl rounded-2xl overflow-hidden flex flex-col relative z-10">
        {/* Top Desktop Chrome Toolbar */}
        <TopBar
          platform={platform}
          watching={watching}
          onToggleWatch={() => setWatching(!watching)}
          watchPath={watchPath}
          onEditPath={() => setPermissionModal({ isOpen: true, path: watchPath })}
          models={models}
          selectedModel={selectedModel}
          onSelectModel={(m) => handleUpdateSettings({ ...settings, model: m })}
          mode={mode}
          onSetMode={(m) => handleUpdateSettings({ ...settings, defaultMode: m })}
          onUploadClick={() => fileInputRef.current?.click()}
          engineOnline={ollamaStatus.connected}
          engineName={selectedModel}
          appName={settings.appName}
        />

        {/* Main Body */}
        <div className="flex-1 flex min-h-0 bg-[#0c0d0e]/40">
          {/* Sidebar Navigation */}
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            queueLength={files.length}
            ollamaStatus={ollamaStatus}
            activeModel={selectedModel}
            onTestOllama={() => testOllamaConnection()}
          />

          {/* Tab Views Content */}
          <main className="flex-1 min-w-0 bg-transparent overflow-hidden relative">
            {activeTab === 'watch' && (
              <WatchView
                files={files}
                categories={categories}
                mode={mode}
                onApproveFile={handleApproveFile}
                onSkipFile={handleSkipFile}
                totals={totals}
                histMs={histMs}
                consoleLogs={consoleLogs}
                onClearConsole={() => setConsoleLogs([])}
                recentDecisions={recentDecisions}
                watching={watching}
                watchPath={watchPath}
              />
            )}

            {activeTab === 'shelf' && (
              <ShelfView
                categories={categories}
                shelfData={shelfData}
                selectedCatId={selectedCatId}
                onSelectCategory={setSelectedCatId}
                onUndoSortFile={handleUndoMove}
                shelfDirPath={shelfPath}
              />
            )}

            {activeTab === 'rules' && (
              <RulesView
                rules={rules}
                onUpdateRules={handleUpdateRules}
                promptTemplate={settings.promptTemplate}
                onUpdatePromptTemplate={(tpl) =>
                  handleUpdateSettings({ ...settings, promptTemplate: tpl })
                }
                customInstructions={settings.customInstructions}
                onUpdateCustomInstructions={(inst) =>
                  handleUpdateSettings({ ...settings, customInstructions: inst })
                }
                onResetRules={() => {
                  setCategories(DEFAULT_CATEGORIES);
                  if (rules[0]) {
                    handleUpdateRules([{ ...rules[0], categories: DEFAULT_CATEGORIES }]);
                  }
                }}
              />
            )}

            {activeTab === 'activity' && (
              <ActivityView
                logs={activityLog}
                onClearLogs={() => {
                  setActivityLog([]);
                  fetch('/api/activity/clear', { method: 'POST' });
                }}
                onUndoMove={handleUndoMove}
                onBulkUndo={handleBulkUndo}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onTestOllama={() => testOllamaConnection()}
                platform={platform}
                permissions={[
                  { path: watchPath, platform, granted: true, scope: 'watch-folder' },
                  { path: shelfPath, platform, granted: true, scope: 'shelf-folder' },
                ]}
                onRequestPermission={(p) => setPermissionModal({ isOpen: true, path: p })}
                onResetAll={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
              />
            )}
          </main>
        </div>

        {/* Footer Statusbar */}
        <footer className="h-8 bg-black/40 border-t border-white/10 px-4 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                watching ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
              }`}
            />
            <span>{watching ? `Watching ${watchPath}` : 'Paused'}</span>
          </div>

          <div className="hidden sm:block text-slate-500">
            drop files or folders anywhere into the watch window to sort them
          </div>

          <div>
            engine: <b className="text-slate-200">{ollamaStatus.connected ? `ollama (${selectedModel})` : 'heuristic'}</b>
          </div>
        </footer>
      </div>

      {/* Drag & Drop Visual Overlay */}
      {isDropOver && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center pointer-events-none">
          <div className="border-2 border-dashed border-indigo-400/80 bg-black/60 rounded-3xl p-12 text-center text-white font-sans max-w-lg shadow-2xl">
            <div className="text-4xl mb-3">📥</div>
            <h2 className="font-display font-extrabold text-2xl tracking-tight text-white">
              Release to Drop into Watch Folder
            </h2>
            <p className="text-xs font-mono text-indigo-300 mt-2">
              Sift will read filenames & metadata and sort them via AI
            </p>
          </div>
        </div>
      )}

      {/* Permission Request Modal */}
      <PermissionModal
        isOpen={permissionModal.isOpen}
        path={permissionModal.path}
        platform={platform}
        onGrant={() => setPermissionModal({ isOpen: false, path: '' })}
        onCancel={() => setPermissionModal({ isOpen: false, path: '' })}
      />
    </div>
  );
}
