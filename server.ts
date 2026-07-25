import express from "express";
import path from "path";
import fs from "fs";
import cors from "cors";
import multer from "multer";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Store paths
const DATA_DIR = path.join(process.cwd(), "sift-workspace");
const DB_FILE = path.join(DATA_DIR, "sift-db.json");
const WATCH_DIR = path.join(DATA_DIR, "watch");
const SHELF_DIR = path.join(DATA_DIR, "shelf");

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(WATCH_DIR)) fs.mkdirSync(WATCH_DIR, { recursive: true });
if (!fs.existsSync(SHELF_DIR)) fs.mkdirSync(SHELF_DIR, { recursive: true });

// Configure Multer for uploaded files to Watch directory
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, WATCH_DIR);
  },
  filename: (req, file, cb) => {
    // preserve original name
    cb(null, file.originalname);
  }
});
const upload = multer({ storage });

// Semantic Folder Normalizer Map & Helper
const SEMANTIC_CATEGORY_MAP: Record<string, string> = {
  docs: "Documents",
  documentation: "Documents",
  document: "Documents",
  notes: "Documents",
  prose: "Documents",
  pics: "Images",
  photos: "Images",
  pictures: "Images",
  gfx: "Images",
  src: "Code",
  source: "Code",
  dev: "Code",
  scripts: "Code",
  vids: "Media",
  video: "Media",
  videos: "Media",
  audio: "Media",
  music: "Media",
  zips: "Archives",
  compressed: "Archives",
  bundles: "Archives",
  datasets: "Data",
  tables: "Data",
  spreadsheets: "Data",
  graphics: "Design",
  mockups: "Design",
  artwork: "Design",
};

export function resolveCanonicalSubfolder(suggestedName: string, existingFolders: string[]): string {
  if (!suggestedName) return "Misc";
  const trimmed = suggestedName.trim();
  const lower = trimmed.toLowerCase();

  const exactMatch = existingFolders.find(f => f.toLowerCase() === lower);
  if (exactMatch) return exactMatch;

  if (SEMANTIC_CATEGORY_MAP[lower]) {
    const aliasTarget = SEMANTIC_CATEGORY_MAP[lower];
    const aliasExisting = existingFolders.find(f => f.toLowerCase() === aliasTarget.toLowerCase());
    if (aliasExisting) return aliasExisting;
    return aliasTarget;
  }

  return trimmed;
}

// Cohesive Directory Inspector
export function isCohesiveFolder(dirPath: string): boolean {
  try {
    const items = fs.readdirSync(dirPath);
    const cohesiveSignatures = [
      ".git",
      "package.json",
      "Cargo.toml",
      "pyproject.toml",
      "go.mod",
      "Makefile",
      "CMakeLists.txt",
      "pom.xml",
      "build.gradle",
      "requirements.txt",
      "Gemfile",
      ".xcodeproj",
      ".xcworkspace",
    ];

    if (items.some(item => cohesiveSignatures.includes(item) || item.endsWith(".app"))) {
      return true;
    }

    const exts = items
      .filter(i => !i.startsWith("."))
      .map(i => path.extname(i).toLowerCase())
      .filter(Boolean);

    if (exts.length >= 3 && new Set(exts).size === 1) {
      return true;
    }
  } catch (e) {}
  return false;
}

// Database Interface
interface AppDatabase {
  settings: {
    endpoint: string;
    model: string;
    temperature: number;
    timeoutMs: number;
    useOllama: boolean;
    autoDelay: number;
    promptTemplate: string;
    customInstructions: string;
    defaultMode: "auto" | "review";
    watchMethod: "fsevents" | "polling";
    pollIntervalMs: number;
    watchFolders: Array<{ id: string; path: string; active: boolean; label?: string }>;
    appName: string;
  };
  rules: Array<{
    id: string;
    name: string;
    sourceFolder: string;
    targetFolder: string;
    active: boolean;
    categories: Array<{
      id: string;
      name: string;
      color: string;
      desc: string;
      exts: string;
      kw: string[];
      targetSubfolder: string;
    }>;
  }>;
  activityLog: Array<{
    id: string;
    t: number;
    kind: "sorted" | "spawn" | "skipped" | "system" | "error" | "undo";
    file: string;
    sourcePath?: string;
    destPath?: string;
    cat?: string;
    color?: string;
    engine?: string;
    conf?: number;
    ms?: number;
    note?: string;
  }>;
  undoJournal: Array<{
    id: string;
    timestamp: number;
    filename: string;
    originalPath: string;
    movedPath: string;
    category: string;
    ruleId?: string;
    undone: boolean;
  }>;
  permissions: Array<{
    path: string;
    platform: "macos" | "windows" | "linux";
    granted: boolean;
    scope: string;
  }>;
  sortedCounts: Record<string, number>;
}

const DEFAULT_CATEGORIES = [
  { id: 'documents', name: 'Documents', color: '#2f6fdb', desc: 'Reports, invoices, PDFs, contracts, notes, prose', exts: 'pdf,doc,docx,txt,md,rtf,pages,tex,epub', kw: ['invoice', 'report', 'contract', 'notes', 'resume', 'letter', 'receipt'], targetSubfolder: 'Documents' },
  { id: 'images', name: 'Images', color: '#d6488f', desc: 'Photos, screenshots, illustrations, graphic assets', exts: 'jpg,jpeg,png,heic,gif,webp,svg,tiff,bmp,avif', kw: ['screenshot', 'photo', 'img', 'picture', 'wallpaper', 'scan'], targetSubfolder: 'Images' },
  { id: 'code', name: 'Code', color: '#178a54', desc: 'Source files, scripts, configurations, notebooks', exts: 'js,ts,jsx,tsx,py,swift,rs,go,c,cpp,h,rb,sh,html,css,sql,json,ipynb', kw: ['script', 'main', 'index', 'server', 'utils', 'app'], targetSubfolder: 'Code' },
  { id: 'media', name: 'Audio & Video', color: '#d98a1f', desc: 'Video clips, audio recordings, music, podcasts', exts: 'mp4,mov,mkv,avi,mp3,wav,flac,aac,m4a,ogg,webm,aiff', kw: ['podcast', 'recording', 'clip', 'track', 'mix', 'video'], targetSubfolder: 'Media' },
  { id: 'archives', name: 'Archives', color: '#7a5ad0', desc: 'Compressed bundles, disk images, installers', exts: 'zip,rar,7z,tar,gz,dmg,iso,pkg,bz2', kw: ['backup', 'bundle', 'release', 'installer'], targetSubfolder: 'Archives' },
  { id: 'data', name: 'Data', color: '#0e93a8', desc: 'Datasets, spreadsheets, analytics exports, database dumps', exts: 'csv,xlsx,xls,parquet,tsv,db,sqlite,yaml,yml,xml', kw: ['dataset', 'export', 'metrics', 'analytics', 'budget'], targetSubfolder: 'Data' },
  { id: 'design', name: 'Design', color: '#e05252', desc: 'Design mockups, vector artwork, 3D models', exts: 'fig,sketch,psd,ai,xd,blend,obj,stl', kw: ['mockup', 'wireframe', 'logo', 'brand', 'prototype'], targetSubfolder: 'Design' },
  { id: 'misc', name: 'Everything else', color: '#6b7280', desc: 'Fallback category for uncategorized files', exts: '', kw: [], targetSubfolder: 'Misc' },
];

const DEFAULT_PROMPT = `You are Sift, an AI file-sorting engine. Classify the incoming file into exactly one category based on its filename, extension, size, and content.
Respond with valid JSON only in this exact format:
{"category": "<exact category name>", "subpath": "<Optional Project/Topic/Phase/Category nested path>", "confidence": <float between 0.0 and 1.0>, "reason": "<short summary max 12 words>"}

Available Categories:
{categories}`;

function loadDb(): AppDatabase {
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
      if (!data.settings.watchFolders || data.settings.watchFolders.length === 0) {
        data.settings.watchFolders = [{ id: 'wf-default', path: WATCH_DIR, active: true, label: 'Main Watch Folder' }];
      }
      if (!data.settings.appName) {
        data.settings.appName = 'Sift';
      }
      return data;
    } catch (e) {
      console.error("Failed to parse DB, resetting", e);
    }
  }
  const initDb: AppDatabase = {
    settings: {
      endpoint: "http://localhost:11434",
      model: "llama3.2",
      temperature: 0.2,
      timeoutMs: 8000,
      useOllama: true,
      autoDelay: 900,
      promptTemplate: DEFAULT_PROMPT,
      customInstructions: "",
      defaultMode: "auto",
      watchMethod: "fsevents",
      pollIntervalMs: 2000,
      watchFolders: [{ id: 'wf-default', path: WATCH_DIR, active: true, label: 'Main Watch Folder' }],
      appName: 'Sift',
    },
    rules: [
      {
        id: "rule-default",
        name: "Main Downloads Sifter",
        sourceFolder: WATCH_DIR,
        targetFolder: SHELF_DIR,
        active: true,
        categories: JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)),
      },
    ],
    activityLog: [],
    undoJournal: [],
    permissions: [
      { path: WATCH_DIR, platform: "macos", granted: true, scope: "security-scoped" },
      { path: SHELF_DIR, platform: "macos", granted: true, scope: "security-scoped" },
      { path: WATCH_DIR, platform: "windows", granted: true, scope: "appdata" },
      { path: SHELF_DIR, platform: "windows", granted: true, scope: "appdata" },
      { path: WATCH_DIR, platform: "linux", granted: true, scope: "xdg" },
      { path: SHELF_DIR, platform: "linux", granted: true, scope: "xdg" },
    ],
    sortedCounts: {},
  };
  saveDb(initDb);
  return initDb;
}

function saveDb(db: AppDatabase) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to save DB", e);
  }
}

// Ensure default categories subfolders exist in SHELF_DIR
function prepareShelfSubfolders(categories: AppDatabase['rules'][0]['categories']) {
  categories.forEach(c => {
    const sub = path.join(SHELF_DIR, c.targetSubfolder || c.name);
    if (!fs.existsSync(sub)) {
      fs.mkdirSync(sub, { recursive: true });
    }
  });
}

const db = loadDb();
if (db.rules && db.rules[0]) {
  prepareShelfSubfolders(db.rules[0].categories);
}

// API Routes

// 1. Health check & DB get/update
app.get("/api/state", (req, res) => {
  const hostPlatform = process.platform === "win32" ? "windows" : process.platform === "darwin" ? "macos" : "linux";
  res.json({
    db,
    watchDir: WATCH_DIR,
    shelfDir: SHELF_DIR,
    platform: hostPlatform,
  });
});

app.post("/api/settings", (req, res) => {
  db.settings = { ...db.settings, ...req.body };
  saveDb(db);
  res.json({ status: "ok", settings: db.settings });
});

app.post("/api/rules", (req, res) => {
  db.rules = req.body;
  if (db.rules[0]) {
    prepareShelfSubfolders(db.rules[0].categories);
  }
  saveDb(db);
  res.json({ status: "ok", rules: db.rules });
});

// 2. Ollama Proxy endpoints
app.all("/api/ollama/proxy", async (req, res) => {
  const endpoint = db.settings.endpoint || "http://localhost:11434";
  const targetPath = req.query.path as string || "/api/tags";
  const url = `${endpoint.replace(/\/+$/, '')}${targetPath}`;
  const method = req.method;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), db.settings.timeoutMs || 8000);

    const fetchOptions: RequestInit = {
      method,
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    };

    if (method !== "GET" && method !== "HEAD" && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const resp = await fetch(url, fetchOptions);
    clearTimeout(timeout);

    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (err: any) {
    res.status(502).json({
      error: "Ollama endpoint unreachable",
      details: err.message,
      endpoint,
    });
  }
});

// 3. File operations (Upload, List Watch, List Shelf, Move File, Undo Move)

// Upload file to Watch Folder
app.post("/api/fs/upload", upload.array("files"), (req, res) => {
  const uploadedFiles = (req.files as Express.Multer.File[]) || [];
  const results = uploadedFiles.map(f => ({
    name: f.originalname,
    size: f.size,
    path: f.path,
    ext: path.extname(f.originalname).replace(".", "").toLowerCase(),
  }));

  res.json({ status: "ok", count: results.length, files: results });
});

// List files and directories across all active watch folders
app.get("/api/fs/watch-files", (req, res) => {
  try {
    const details: any[] = [];
    const activeWatchers = (db.settings.watchFolders || []).filter(w => w.active);
    const watchPaths = activeWatchers.length ? activeWatchers.map(w => w.path) : [WATCH_DIR];

    watchPaths.forEach(wPath => {
      if (!fs.existsSync(wPath)) return;
      const rawItems = fs.readdirSync(wPath).filter(f => !f.startsWith("."));

      rawItems.forEach(f => {
        const fullPath = path.join(wPath, f);
        if (!fs.existsSync(fullPath)) return;
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
          const cohesive = isCohesiveFolder(fullPath);

          if (cohesive) {
            details.push({
              name: f,
              path: fullPath,
              sourceDir: wPath,
              size: 0,
              ext: "folder",
              isDir: true,
              isCohesive: true,
              sampleContent: `Atomic project/bundle directory containing project structure`,
              mtime: stats.mtimeMs,
            });
          } else {
            try {
              const subItems = fs.readdirSync(fullPath).filter(sf => !sf.startsWith("."));
              subItems.forEach(sf => {
                const subPath = path.join(fullPath, sf);
                const subSt = fs.statSync(subPath);
                if (subSt.isFile()) {
                  details.push({
                    name: `${f}/${sf}`,
                    path: subPath,
                    sourceDir: wPath,
                    size: subSt.size,
                    ext: path.extname(sf).replace(".", "").toLowerCase(),
                    isDir: false,
                    isCohesive: false,
                    sampleContent: `Item inside mixed folder ${f}`,
                    mtime: subSt.mtimeMs,
                  });
                } else if (subSt.isDirectory()) {
                  const subCohesive = isCohesiveFolder(subPath);
                  details.push({
                    name: `${f}/${sf}`,
                    path: subPath,
                    sourceDir: wPath,
                    size: 0,
                    ext: "folder",
                    isDir: true,
                    isCohesive: subCohesive,
                    sampleContent: subCohesive ? `Cohesive subfolder in ${f}` : `Subfolder in ${f}`,
                    mtime: subSt.mtimeMs,
                  });
                }
              });
            } catch (e) {}
          }
        } else {
          let sampleContent = "";
          if (stats.size < 2000000) {
            const ext = path.extname(f).toLowerCase();
            if ([".txt", ".md", ".json", ".csv", ".py", ".js", ".ts", ".html", ".css", ".sql", ".yml", ".xml"].includes(ext)) {
              try {
                sampleContent = fs.readFileSync(fullPath, "utf-8").slice(0, 1000);
              } catch (e) {}
            }
          }
          details.push({
            name: f,
            path: fullPath,
            sourceDir: wPath,
            size: stats.size,
            ext: path.extname(f).replace(".", "").toLowerCase(),
            isDir: false,
            isCohesive: false,
            sampleContent,
            mtime: stats.mtimeMs,
          });
        }
      });
    });

    res.json({ files: details });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// List Shelf subfolders and files
app.get("/api/fs/shelf", (req, res) => {
  try {
    const categories = db.rules[0]?.categories || DEFAULT_CATEGORIES;
    const shelfData: Record<string, any[]> = {};

    categories.forEach(c => {
      const subName = c.targetSubfolder || c.name;
      const subPath = path.join(SHELF_DIR, subName);
      if (!fs.existsSync(subPath)) {
        fs.mkdirSync(subPath, { recursive: true });
      }

      const files = fs.readdirSync(subPath)
        .filter(f => !f.startsWith("."))
        .map(f => {
          const fp = path.join(subPath, f);
          const st = fs.statSync(fp);
          return {
            name: f,
            path: fp,
            size: st.size,
            ext: path.extname(f).replace(".", "").toLowerCase(),
            mtime: st.mtimeMs,
          };
        });
      shelfData[c.id] = files;
    });

    res.json({ shelf: shelfData });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Move file/folder from Watch to Shelf Subfolder with Layered Subpaths & Canonical Normalization
app.post("/api/fs/move", (req, res) => {
  const { fileName, itemPath, categoryId, subpath, engine, confidence, ms, reason } = req.body;

  let sourcePath = itemPath || path.join(WATCH_DIR, fileName);
  if (!fs.existsSync(sourcePath)) {
    sourcePath = path.join(WATCH_DIR, fileName);
  }

  if (!fs.existsSync(sourcePath)) {
    return res.status(404).json({ error: "Source file or directory does not exist", fileName });
  }

  if (fileName.endsWith(".lock")) {
    return res.status(423).json({
      error: "File is locked by another process",
      fileName,
      code: "LOCKED",
    });
  }

  const category = (db.rules[0]?.categories || DEFAULT_CATEGORIES).find(c => c.id === categoryId) || DEFAULT_CATEGORIES[7];
  
  // Layered Semantic Subpath Resolution
  const existingShelfFolders = fs.readdirSync(SHELF_DIR);
  let targetDir = SHELF_DIR;

  if (subpath && typeof subpath === 'string' && subpath.trim()) {
    const segments = subpath.split('/').filter(Boolean).map(seg => resolveCanonicalSubfolder(seg, existingShelfFolders));
    targetDir = path.join(SHELF_DIR, ...segments);
  } else {
    const rawTargetName = category.targetSubfolder || category.name;
    const canonicalSubfolder = resolveCanonicalSubfolder(rawTargetName, existingShelfFolders);
    targetDir = path.join(SHELF_DIR, canonicalSubfolder);
  }

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Duplicate filename resolution
  let targetFileName = path.basename(fileName);
  let targetPath = path.join(targetDir, targetFileName);

  if (fs.existsSync(targetPath)) {
    const ext = path.extname(targetFileName);
    const base = path.basename(targetFileName, ext);
    let counter = 1;
    while (fs.existsSync(path.join(targetDir, `${base} (${counter})${ext}`))) {
      counter++;
    }
    targetFileName = `${base} (${counter})${ext}`;
    targetPath = path.join(targetDir, targetFileName);
  }

  try {
    fs.renameSync(sourcePath, targetPath);

    // Record in Undo Journal & Activity Log
    const journalEntry = {
      id: `undo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      filename: targetFileName,
      originalPath: sourcePath,
      movedPath: targetPath,
      category: category.name,
      undone: false,
    };

    db.undoJournal.unshift(journalEntry);

    const activityEntry = {
      id: `act-${Date.now()}`,
      t: Date.now(),
      kind: "sorted" as const,
      file: targetFileName,
      sourcePath,
      destPath: targetPath,
      cat: category.name,
      color: category.color,
      engine,
      conf: confidence,
      ms,
      note: reason,
    };

    db.activityLog.unshift(activityEntry);
    db.sortedCounts[category.id] = (db.sortedCounts[category.id] || 0) + 1;

    saveDb(db);

    res.json({
      status: "ok",
      fileName: targetFileName,
      movedPath: targetPath,
      journalId: journalEntry.id,
    });
  } catch (err: any) {
    res.status(500).json({ error: `Failed to move file: ${err.message}` });
  }
});

// Undo single or bulk file move
app.post("/api/fs/undo", (req, res) => {
  const { journalId, bulk } = req.body;

  let entriesToUndo = db.undoJournal.filter(e => !e.undone);

  if (journalId) {
    entriesToUndo = entriesToUndo.filter(e => e.id === journalId);
  }

  if (entriesToUndo.length === 0) {
    return res.status(400).json({ error: "No pending undo entries found" });
  }

  const undoneResults: string[] = [];

  entriesToUndo.forEach(entry => {
    if (fs.existsSync(entry.movedPath)) {
      try {
        let dest = entry.originalPath;
        if (fs.existsSync(dest)) {
          const ext = path.extname(entry.filename);
          const base = path.basename(entry.filename, ext);
          dest = path.join(WATCH_DIR, `${base}-restored${ext}`);
        }
        fs.renameSync(entry.movedPath, dest);
        entry.undone = true;
        undoneResults.push(entry.filename);

        db.activityLog.unshift({
          id: `act-undo-${Date.now()}`,
          t: Date.now(),
          kind: "undo",
          file: entry.filename,
          note: `Restored to ${WATCH_DIR}`,
        });
      } catch (e) {
        console.error("Undo move failed:", e);
      }
    } else {
      entry.undone = true;
      undoneResults.push(`${entry.filename} (virtual)`);
    }
  });

  saveDb(db);

  res.json({
    status: "ok",
    undoneCount: undoneResults.length,
    undoneFiles: undoneResults,
  });
});

// Reset / Clear Activity Log
app.post("/api/activity/clear", (req, res) => {
  db.activityLog = [];
  saveDb(db);
  res.json({ status: "ok" });
});

// Request Permission simulation
app.post("/api/permissions/request", (req, res) => {
  const { path: reqPath, platform } = req.body;
  const existing = db.permissions.find(p => p.path === reqPath && p.platform === platform);
  if (existing) {
    existing.granted = true;
  } else {
    db.permissions.push({
      path: reqPath,
      platform: platform || "macos",
      granted: true,
      scope: platform === "macos" ? "security-scoped" : platform === "windows" ? "appdata" : "xdg",
    });
  }
  saveDb(db);
  res.json({ status: "ok", granted: true, path: reqPath });
});

// Vite middleware & Production static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
