export type Platform = 'macos' | 'windows' | 'linux';

export type SortingMode = 'auto' | 'review';

export type SortingEngine = 'ollama' | 'heuristic';

export interface Category {
  id: string;
  name: string;
  color: string;
  desc: string;
  exts: string;
  kw: string[];
  targetSubfolder: string;
}

export interface Rule {
  id: string;
  name: string;
  sourceFolder: string;
  targetFolder: string;
  active: boolean;
  categories: Category[];
}

export interface Decision {
  catId: string;
  categoryName: string;
  confidence: number;
  reason: string;
  engine: SortingEngine;
  tokens: number;
  ms: number;
}

export interface SortingFile {
  id: string;
  name: string;
  path?: string;
  ext: string;
  size: number;
  sampleContent?: string;
  addedAt: number;
  status: 'queued' | 'analyzing' | 'review' | 'decided' | 'sorting' | 'sorted' | 'skipped' | 'locked' | 'error';
  decision?: Decision;
  errorReason?: string;
}

export interface ActivityLogEntry {
  id: string;
  t: number;
  kind: 'sorted' | 'spawn' | 'skipped' | 'system' | 'error' | 'undo';
  file: string;
  sourcePath?: string;
  destPath?: string;
  cat?: string;
  color?: string;
  engine?: string;
  conf?: number;
  ms?: number;
  note?: string;
}

export interface UndoJournalEntry {
  id: string;
  timestamp: number;
  filename: string;
  originalPath: string;
  movedPath: string;
  category: string;
  undone: boolean;
}

export interface Settings {
  endpoint: string;
  model: string;
  temperature: number;
  timeoutMs: number;
  useOllama: boolean;
  pace: number;
  autoDelay: number;
  promptTemplate: string;
  defaultMode: SortingMode;
  watchMethod: 'fsevents' | 'polling';
  pollIntervalMs: number;
}

export interface OllamaStatus {
  connected: boolean | null;
  latencyMs: number | null;
  availableModels: string[];
  error?: string;
}

export interface PermissionEntry {
  path: string;
  platform: Platform;
  granted: boolean;
  scope: string;
}
