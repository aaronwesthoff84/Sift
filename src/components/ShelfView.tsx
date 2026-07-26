import React, { useState } from 'react';
import { Category } from '../types';
import { fmtSize } from '../utils/helpers';
import { Folder, FileText, Undo2, ExternalLink, Eye, Search, ChevronRight, ChevronDown, ListTree, Grid } from 'lucide-react';

interface ShelfItem {
  name: string;
  size: number;
  at?: number;
  conf?: number;
  engine?: string;
  ms?: number;
  path?: string;
}

interface ShelfViewProps {
  categories: Category[];
  shelfData: Record<string, ShelfItem[]>;
  selectedCatId: string;
  onSelectCategory: (catId: string) => void;
  onUndoSortFile: (fileName: string, catId: string) => void;
  shelfDirPath: string;
}

interface TreeNode {
  name: string;
  fullPath: string;
  isDir: boolean;
  children: Record<string, TreeNode>;
  files: ShelfItem[];
  catId?: string;
}

export const ShelfView: React.FC<ShelfViewProps> = ({
  categories,
  shelfData,
  selectedCatId,
  onSelectCategory,
  onUndoSortFile,
  shelfDirPath,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [previewFile, setPreviewFile] = useState<ShelfItem | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'tree'>('grid');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const toggleExpand = (nodePath: string) => {
    setExpandedNodes((prev) => ({ ...prev, [nodePath]: !prev[nodePath] }));
  };

  // Build tree from all categories and shelf files
  const buildTree = (): TreeNode => {
    const root: TreeNode = {
      name: 'Shelf Root',
      fullPath: shelfDirPath,
      isDir: true,
      children: {},
      files: [],
    };

    categories.forEach((cat) => {
      const catSubfolder = cat.targetSubfolder || cat.name;
      const catNode: TreeNode = {
        name: catSubfolder,
        fullPath: `${shelfDirPath}/${catSubfolder}`,
        isDir: true,
        children: {},
        files: [],
        catId: cat.id,
      };

      const items = shelfData[cat.id] || [];
      items.forEach((item) => {
        const parts = item.name.split('/');
        if (parts.length === 1) {
          catNode.files.push(item);
        } else {
          // Nested path: e.g. ProjectA/Requirements/Images/file.jpg
          let current = catNode;
          for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!current.children[part]) {
              current.children[part] = {
                name: part,
                fullPath: `${current.fullPath}/${part}`,
                isDir: true,
                children: {},
                files: [],
                catId: cat.id,
              };
            }
            current = current.children[part];
          }
          current.files.push({ ...item, name: parts[parts.length - 1] });
        }
      });

      root.children[catSubfolder] = catNode;
    });

    return root;
  };

  const renderTreeNode = (node: TreeNode, depth = 0) => {
    const isExpanded = expandedNodes[node.fullPath] ?? depth < 1;
    const childKeys = Object.keys(node.children);
    const totalFiles = node.files.length + childKeys.reduce((acc, k) => acc + countTreeFiles(node.children[k]), 0);

    return (
      <div key={node.fullPath} className="ml-3 my-1 font-mono text-xs select-none">
        <div
          onClick={() => toggleExpand(node.fullPath)}
          className="flex items-center gap-2 p-2 hover:bg-white/5 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-white/10"
        >
          {childKeys.length > 0 || node.files.length > 0 ? (
            isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-indigo-400" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            )
          ) : (
            <span className="w-3.5 h-3.5" />
          )}

          <Folder className="w-4 h-4 text-amber-400 fill-amber-400/20" />
          <span className="font-bold text-white">{node.name}</span>
          <span className="font-mono text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10 ml-auto">
            {totalFiles} item{totalFiles === 1 ? '' : 's'}
          </span>
        </div>

        {isExpanded && (
          <div className="pl-4 border-l border-white/10 ml-3 mt-1 space-y-1">
            {childKeys.map((key) => renderTreeNode(node.children[key], depth + 1))}
            {node.files.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 px-3 hover:bg-white/10 rounded-lg text-slate-300 text-xs transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-3.5 h-3.5 text-slate-400 flex-none" />
                  <span className="truncate">{file.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-400">{fmtSize(file.size)}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (node.catId) onUndoSortFile(file.name, node.catId);
                    }}
                    className="text-rose-400 hover:text-rose-300 p-1"
                    title="Undo Move"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const countTreeFiles = (node: TreeNode): number => {
    return node.files.length + Object.keys(node.children).reduce((acc, k) => acc + countTreeFiles(node.children[k]), 0);
  };

  const selectedCat =
    categories.find((c) => c.id === selectedCatId) || categories[0];

  const items = shelfData[selectedCat.id] || [];

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-5 p-6 overflow-y-auto h-full font-sans text-slate-200">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="text-3xl font-light tracking-tight text-white mb-1">
            The Target Shelf
          </h2>
          <p className="text-xs text-slate-400">
            Target folders and subfolders. Click a folder to inspect sorted files or reverse any move.
          </p>
        </div>

        {/* Search & View Mode Controls */}
        <div className="flex items-center gap-3">
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
              title="Category Grid View"
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Grid</span>
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'tree' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
              title="Nested Tree Hierarchy View"
            >
              <ListTree className="w-3.5 h-3.5" />
              <span>Tree View</span>
            </button>
          </div>

          <div className="relative w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search files in shelf…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full font-mono text-xs bg-white/5 border border-white/10 focus:border-indigo-500/50 focus:bg-white/10 focus:outline-none rounded-xl pl-8 pr-3 py-2 text-white placeholder-slate-500"
            />
          </div>
        </div>
      </div>

      {viewMode === 'tree' ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-white/10 mb-3">
            <ListTree className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-xs uppercase tracking-widest text-slate-300">
              Interactive Nested Folder Tree
            </h3>
          </div>
          {renderTreeNode(buildTree())}
        </div>
      ) : (
        <>
          {/* Target Folders Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3.5">
            {categories.map((c) => {
              const fileList = shelfData[c.id] || [];
              const count = fileList.length;
              const isSelected = selectedCatId === c.id;

              return (
                <button
                  key={c.id}
                  onClick={() => onSelectCategory(c.id)}
                  className={`border bg-white/5 rounded-2xl p-3.5 flex flex-col justify-between items-start text-left relative overflow-hidden transition-all group backdrop-blur-sm ${
                    isSelected
                      ? 'border-2 shadow-xl scale-[1.02] bg-white/10'
                      : 'border-white/10 hover:border-white/20 hover:bg-white/10 shadow-sm'
                  }`}
                  style={{
                    borderColor: isSelected ? c.color : undefined,
                    boxShadow: isSelected ? `0 0 20px -5px ${c.color}40` : undefined,
                  }}
                >
                  <div
                    className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{ backgroundColor: c.color }}
                  />

                  <div className="flex items-center justify-between w-full">
                    <Folder
                      className="w-7 h-7"
                      style={{ color: c.color, fill: `${c.color}40` }}
                    />
                    <span
                      className="font-mono font-bold text-xs px-2 py-0.5 rounded-md border"
                      style={{
                        backgroundColor: `${c.color}20`,
                        borderColor: `${c.color}40`,
                        color: c.color,
                      }}
                    >
                      {count}
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="font-display font-semibold text-xs truncate text-white">
                      {c.name}
                    </div>
                    <div className="font-mono text-[9.5px] text-slate-400 truncate mt-0.5">
                      /{c.targetSubfolder || c.name}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

      {/* Selected Subfolder Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-lg backdrop-blur-sm">
        <div className="flex items-center justify-between p-4 px-5 border-b border-white/10 bg-black/20">
          <div className="flex items-center gap-2.5">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: selectedCat.color }}
            />
            <h3 className="font-display font-bold text-base text-white">
              {selectedCat.name} Subfolder
            </h3>
            <span className="font-mono text-xs text-slate-400">
              ({filteredItems.length} file{filteredItems.length === 1 ? '' : 's'})
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
            <span>Path: <code className="text-slate-300">{shelfDirPath}/{selectedCat.targetSubfolder || selectedCat.name}</code></span>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No files in this category yet. The watcher will file matching items here automatically.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredItems.map((f, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 items-center gap-2 p-3 px-5 text-xs font-mono hover:bg-white/5 transition-colors"
              >
                <div className="col-span-5 flex items-center gap-2.5 min-w-0">
                  <FileText className="w-4 h-4 text-slate-400 flex-none" />
                  <span className="font-semibold truncate text-slate-200" title={f.name}>
                    {f.name}
                  </span>
                </div>

                <div className="col-span-2 text-slate-400">{fmtSize(f.size)}</div>

                <div className="col-span-2">
                  <span
                    className={`font-bold text-[10px] px-2.5 py-0.5 rounded-full border ${
                      f.engine === 'ollama'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {f.engine || 'ollama'}
                  </span>
                </div>

                <div className="col-span-2 text-slate-400">
                  {f.conf ? `${Math.round(f.conf * 100)}% conf` : '100%'}
                </div>

                <div className="col-span-1 flex items-center justify-end gap-1">
                  <button
                    onClick={() => setPreviewFile(f)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    title="Preview File"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onUndoSortFile(f.name, selectedCat.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors"
                    title="Undo Move (Restore to Watch folder)"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )}

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0c0d0e]/95 border border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl flex flex-col gap-4 text-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 font-mono font-bold text-sm text-white">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span className="truncate max-w-[320px]">{previewFile.name}</span>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="text-xs font-bold text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono text-slate-300 bg-white/5 p-4 rounded-xl border border-white/10">
              <div>Size: <b className="text-white">{fmtSize(previewFile.size)}</b></div>
              <div>Subfolder: <b className="text-indigo-400">{selectedCat.targetSubfolder || selectedCat.name}</b></div>
              <div>Sorting Engine: <b className="text-emerald-400">{previewFile.engine || 'ollama'}</b></div>
              <div>Confidence: <b className="text-white">{previewFile.conf ? `${Math.round(previewFile.conf * 100)}%` : '95%'}</b></div>
            </div>

            <div className="flex justify-end gap-2.5 mt-2">
              <button
                onClick={() => {
                  onUndoSortFile(previewFile.name, selectedCat.id);
                  setPreviewFile(null);
                }}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-2 px-4 rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-rose-600/20"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Undo & Restore File</span>
              </button>
              <button
                onClick={() => setPreviewFile(null)}
                className="bg-white/10 hover:bg-white/15 text-white font-bold text-xs py-2 px-4 rounded-xl border border-white/10 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
