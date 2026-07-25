import { Category } from '../types';

export function fmtSize(b?: number): string {
  if (b === undefined || b === null || isNaN(b)) return '—';
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  if (b < 1073741824) return (b / 1048576).toFixed(1) + ' MB';
  return (b / 1073741824).toFixed(2) + ' GB';
}

export function extOf(n: string): string {
  const m = n.toLowerCase().match(/\.([a-z0-9]{1,6})$/);
  return m ? m[1] : '';
}

export function randSize(): number {
  return Math.round(Math.exp(Math.random() * Math.log(2.4e9 / 8e3)) * 8e3);
}

export function extList(c: Category): string[] {
  return (c.exts || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
}

export function kwList(c: Category): string[] {
  return c.kw || [];
}

export function nowT(): string {
  return new Date().toTimeString().slice(0, 8);
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

// Client-side Heuristic Classifier (Fallback)
export function heuristicClassify(fileName: string, ext: string, categories: Category[]) {
  let bestCat: Category | null = null;
  let score = 0;
  let matchedSignal = '';

  const lowerName = fileName.toLowerCase();

  for (const c of categories) {
    let currentScore = 0;
    let hit = '';

    const exts = extList(c);
    if (exts.includes(ext.toLowerCase())) {
      currentScore += 0.55;
      hit = `.${ext}`;
    }

    const keywords = kwList(c);
    const matchedKw = keywords.find(k => lowerName.includes(k.toLowerCase()));
    if (matchedKw) {
      currentScore += 0.35;
      hit = hit ? `${hit}, “${matchedKw}”` : `“${matchedKw}”`;
    }

    if (currentScore > score) {
      score = currentScore;
      bestCat = c;
      matchedSignal = hit;
    }
  }

  const fallbackCat = categories.find(c => c.id === 'misc') || categories[categories.length - 1];

  if (!bestCat || score < 0.25) {
    bestCat = fallbackCat;
    score = 0.42 + Math.random() * 0.15;
    matchedSignal = 'filename & extension metadata pattern match';
  }

  const confidence = clamp(score + 0.28 + Math.random() * 0.08, 0.3, 0.98);

  return {
    catId: bestCat.id,
    categoryName: bestCat.name,
    confidence: Number(confidence.toFixed(2)),
    reason: matchedSignal ? `Pattern hit: ${matchedSignal}` : `Filed into ${bestCat.name}`,
    engine: 'heuristic' as const,
    tokens: 0,
  };
}
