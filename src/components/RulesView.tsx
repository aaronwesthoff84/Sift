import React, { useState } from 'react';
import { Rule, Category } from '../types';
import { Plus, Trash2, RotateCcw, FolderCheck, Sparkles, HelpCircle } from 'lucide-react';

interface RulesViewProps {
  rules: Rule[];
  onUpdateRules: (rules: Rule[]) => void;
  promptTemplate: string;
  onUpdatePromptTemplate: (tpl: string) => void;
  onResetRules: () => void;
}

export const RulesView: React.FC<RulesViewProps> = ({
  rules,
  onUpdateRules,
  promptTemplate,
  onUpdatePromptTemplate,
  onResetRules,
}) => {
  const currentRule = rules[0];
  const categories = currentRule?.categories || [];

  const handleCategoryChange = (id: string, field: keyof Category, value: any) => {
    const updatedCats = categories.map((c) => {
      if (c.id === id) {
        return { ...c, [field]: value };
      }
      return c;
    });

    const updatedRules = rules.map((r, idx) =>
      idx === 0 ? { ...r, categories: updatedCats } : r
    );
    onUpdateRules(updatedRules);
  };

  const handleAddCategory = () => {
    const palette = ['#2f6fdb', '#d6488f', '#178a54', '#d98a1f', '#7a5ad0', '#0e93a8', '#e05252', '#33719f'];
    const randomColor = palette[Math.floor(Math.random() * palette.length)];

    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: 'Custom Category',
      color: randomColor,
      desc: 'Describe what files belong here for AI classification',
      exts: 'txt,pdf',
      kw: ['keyword'],
      targetSubfolder: 'Custom',
    };

    const updatedCats = [...categories];
    // insert before misc fallback if present
    const miscIdx = updatedCats.findIndex((c) => c.id === 'misc');
    if (miscIdx >= 0) {
      updatedCats.splice(miscIdx, 0, newCat);
    } else {
      updatedCats.push(newCat);
    }

    const updatedRules = rules.map((r, idx) =>
      idx === 0 ? { ...r, categories: updatedCats } : r
    );
    onUpdateRules(updatedRules);
  };

  const handleDeleteCategory = (id: string) => {
    if (id === 'misc') return;
    const updatedCats = categories.filter((c) => c.id !== id);
    const updatedRules = rules.map((r, idx) =>
      idx === 0 ? { ...r, categories: updatedCats } : r
    );
    onUpdateRules(updatedRules);
  };

  return (
    <div className="flex flex-col gap-5 p-6 overflow-y-auto h-full font-sans text-slate-200">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-light tracking-tight text-white mb-1">
          Sorting Rules & Taxonomy
        </h2>
        <p className="text-xs text-slate-400">
          Define Source & Target folders, and train Ollama's sorting taxonomy with natural language category descriptions.
        </p>
      </div>

      {/* Rule Folder Binding Header */}
      {currentRule && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-lg backdrop-blur-sm flex items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-center gap-3">
            <FolderCheck className="w-5 h-5 text-indigo-400" />
            <div>
              <span className="font-bold text-white">{currentRule.name}</span>
              <div className="text-[10.5px] text-slate-400 mt-0.5">
                Source Watch: <b className="text-amber-400">{currentRule.sourceFolder}</b> ➔ Target Shelf: <b className="text-indigo-400">{currentRule.targetFolder}</b>
              </div>
            </div>
          </div>
          <span className="font-bold text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full uppercase">
            Active Rule
          </span>
        </div>
      )}

      {/* Main Grid: Categories List + Prompt Template Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Category List Editor */}
        <div className="lg:col-span-2 space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-widest text-slate-400">
              Taxonomy Categories ({categories.length})
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleAddCategory}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 px-3.5 rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Category</span>
              </button>
              <button
                onClick={onResetRules}
                className="bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 font-bold text-xs py-2 px-3.5 rounded-xl transition-all flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {categories.map((c) => (
              <div
                key={c.id}
                className="bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl p-3.5 shadow-lg backdrop-blur-sm grid grid-cols-12 gap-2.5 items-center"
              >
                {/* Color Picker */}
                <div className="col-span-1 flex justify-center">
                  <input
                    type="color"
                    value={c.color}
                    onChange={(e) => handleCategoryChange(c.id, 'color', e.target.value)}
                    className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
                    title="Category Color"
                  />
                </div>

                {/* Name */}
                <div className="col-span-3">
                  <input
                    type="text"
                    value={c.name}
                    onChange={(e) => handleCategoryChange(c.id, 'name', e.target.value)}
                    className="w-full font-display font-bold text-xs bg-white/5 focus:bg-white/10 border border-white/10 focus:border-indigo-500/50 focus:outline-none rounded-xl px-2.5 py-1.5 text-white"
                    placeholder="Category Name"
                  />
                </div>

                {/* Description for AI */}
                <div className="col-span-4">
                  <input
                    type="text"
                    value={c.desc}
                    onChange={(e) => handleCategoryChange(c.id, 'desc', e.target.value)}
                    className="w-full font-sans text-xs bg-white/5 focus:bg-white/10 border border-white/10 focus:border-indigo-500/50 focus:outline-none rounded-xl px-2.5 py-1.5 text-slate-200 placeholder-slate-500"
                    placeholder="AI Prompt Description..."
                  />
                </div>

                {/* Extensions */}
                <div className="col-span-3">
                  <input
                    type="text"
                    value={c.exts}
                    onChange={(e) => handleCategoryChange(c.id, 'exts', e.target.value)}
                    className="w-full font-mono text-[11px] bg-white/5 focus:bg-white/10 border border-white/10 focus:border-indigo-500/50 focus:outline-none rounded-xl px-2.5 py-1.5 text-indigo-300 placeholder-slate-500"
                    placeholder="ext1, ext2"
                  />
                </div>

                {/* Delete button */}
                <div className="col-span-1 flex justify-end">
                  {c.id !== 'misc' && (
                    <button
                      onClick={() => handleDeleteCategory(c.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/20 transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Prompt Template Box */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg backdrop-blur-sm flex flex-col gap-3.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h4 className="font-bold text-xs uppercase tracking-widest text-slate-400">
              System Prompt Template
            </h4>
          </div>

          <textarea
            value={promptTemplate}
            onChange={(e) => onUpdatePromptTemplate(e.target.value)}
            spellCheck={false}
            className="w-full h-64 font-mono text-xs bg-black/40 focus:bg-black/60 border border-white/10 focus:border-indigo-500/50 focus:outline-none rounded-2xl p-3.5 text-slate-200 leading-relaxed resize-y"
          />

          <div className="text-[11px] text-slate-400 leading-normal flex items-start gap-1.5">
            <HelpCircle className="w-4 h-4 text-indigo-400 flex-none mt-0.5" />
            <span>
              The token <code className="text-indigo-300 bg-white/5 px-1 py-0.5 rounded border border-white/10">{'{categories}'}</code> is dynamically substituted with the list of active categories and descriptions above.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
