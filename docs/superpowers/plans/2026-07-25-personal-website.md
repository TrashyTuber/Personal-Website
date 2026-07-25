# Personal Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Yiming Jia's personal site: a real playable minesweeper board as the landing page, with dark neo-Chinese-minimalist inner pages for Projects, Music, About, and Minesweeper, per `docs/superpowers/specs/2026-07-25-personal-website-design.md`.

**Architecture:** Next.js App Router with all pages statically rendered. A pure-TypeScript minesweeper engine (`lib/minesweeper/`) with zero DOM dependencies, consumed by one client component (`GameBoard`) reused on `/` (with hidden section tiles) and `/minesweeper` (plain game). Content lives in typed data files; no database.

**Tech Stack:** Next.js (App Router) · TypeScript · Tailwind CSS v4 · Vitest + React Testing Library · deployed on Vercel.

**Design tokens (single source of truth for all tasks):** ink `#0b0b0c`, surface `#101012`, tile `#19191b`, hairline `#1e1e20`, hairline-2 `#2a2a2c`, paper `#e8e4dc`, muted `#8a8a88`, faint `#7c7c7c`, vermilion `#c23b22`, seal `#f5f0e6`, board numbers n1 `#4a9eff`, n2 `#8fd694`, n3 `#d94f33`, n4 `#b07fd0`, n5 `#d4a017`, n6 `#4fb3a8`, n7 `#e8e4dc`, n8 `#8a8a88` (all ≥4.5:1 on surface; n2/n3 luminance-separated for color-vision deficiency). Fonts: Noto Serif SC (display/hanzi) + Courier New stack (game UI).

**Content the engineer cannot invent:** Anything marked `REPLACE:` in content files is Yiming's real data (project blurbs, music pieces, about text, GitHub/LinkedIn URLs, `public/cv.pdf`). Build with the markers in place; the final task collects them into a list for Yiming.

---

### Task 1: Scaffold Next.js project + test tooling

**Files:**
- Create: entire Next.js scaffold at repo root (`app/`, `package.json`, `tsconfig.json`, …)
- Create: `vitest.config.ts`, `vitest.setup.ts`
- Modify: `.gitignore` (merge scaffold's entries)

- [ ] **Step 1: Scaffold into a scratch dir and merge into the repo root** (create-next-app refuses non-empty dirs; `docs/` already exists)

```bash
cd "/Users/yimingjia/Personal Website"
SCRATCH="/private/tmp/claude-501/-Users-yimingjia-Personal-Website/13a01ef3-efe5-494b-a4ec-a6a84b755ad7/scratchpad/pw-scaffold"
npx --yes create-next-app@latest "$SCRATCH" --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --turbopack --use-npm --yes
rsync -a --exclude .git --exclude .gitignore "$SCRATCH"/ ./
cat "$SCRATCH/.gitignore" >> .gitignore
rm -rf "$SCRATCH"
```

- [ ] **Step 2: Install test dependencies and add scripts**

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm pkg set scripts.test="vitest run" scripts.test:watch="vitest"
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
});
```

- [ ] **Step 4: Create `vitest.setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 5: Verify the scaffold runs**

Run: `npm run build`
Expected: build succeeds. Then `npm test` — expected: "No test files found" exit 0 (or pass `--passWithNoTests` if vitest errors; add that flag to the test script in that case).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with Vitest tooling"
```

---

### Task 2: Design tokens, global styles, fonts, root layout

**Files:**
- Modify: `app/globals.css` (full replace)
- Modify: `app/layout.tsx` (full replace)
- Delete: scaffold cruft — `app/page.tsx` default content is replaced in Task 8; leave it for now. Delete `public/*.svg` scaffold icons.

- [ ] **Step 1: Replace `app/globals.css`**

```css
@import 'tailwindcss';

@theme {
  --color-ink: #0b0b0c;
  --color-surface: #101012;
  --color-tile: #19191b;
  --color-hairline: #1e1e20;
  --color-hairline-2: #2a2a2c;
  --color-paper: #e8e4dc;
  --color-muted: #8a8a88;
  --color-faint: #7c7c7c;
  --color-vermilion: #c23b22;
  /* vermilion lightened to clear 4.5:1 for small text; fills/glyphs keep --color-vermilion */
  --color-vermilion-text: #d9573c;
  --color-seal: #f5f0e6;
  --color-n1: #4a9eff;
  --color-n2: #8fd694;
  --color-n3: #d94f33;
  --color-n4: #b07fd0;
  --color-n5: #d4a017;
  --color-n6: #4fb3a8;
  --color-n7: #e8e4dc;
  --color-n8: #8a8a88;

  --font-serif-sc: var(--font-noto-serif-sc, Georgia), Georgia, serif;
  --font-mono-game: 'Courier New', ui-monospace, Menlo, Consolas, monospace;

  --animate-board-shake: board-shake 0.45s ease;
}

@keyframes board-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(5px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(3px); }
}

html {
  color-scheme: dark;
}

::selection {
  background: var(--color-vermilion);
  color: var(--color-seal);
}
```

- [ ] **Step 2: Replace `app/layout.tsx`** (Spine and Footer are added in Task 6; this version compiles without them)

```tsx
import type { Metadata } from 'next';
import { Noto_Serif_SC } from 'next/font/google';
import './globals.css';

const notoSerifSC = Noto_Serif_SC({
  weight: ['300', '400'],
  subsets: ['latin'],
  variable: '--font-noto-serif-sc',
  display: 'swap',
  // Auto-fallback would apply Latin-tuned size-adjust metrics to CJK glyphs
  // (layout shift on the hanzi wordmark) — disable and fall back plainly.
  adjustFontFallback: false,
  fallback: ['Georgia', 'serif'],
});

export const metadata: Metadata = {
  title: 'Yiming Jia — 贾一茗',
  description:
    'Yiming Jia — engineer and composer. CS at Northwestern, Composition at Bienen. Projects, music, and minesweeper.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={notoSerifSC.variable}>
      <body className="flex min-h-screen flex-col bg-ink font-serif-sc text-paper antialiased">
        <main className="flex-1 md:pl-[72px]">{children}</main>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Create `app/icon.svg`** (favicon: vermilion seal)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="8" fill="#c23b22"/><text x="32" y="44" font-size="34" text-anchor="middle" fill="#f5f0e6" font-family="Georgia, serif">贾</text></svg>
```

- [ ] **Step 4: Delete scaffold icons and verify build**

```bash
rm -f public/next.svg public/vercel.svg public/file.svg public/globe.svg public/window.svg app/favicon.ico
npm run build
```
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: design tokens, dark theme, fonts, root layout, seal favicon"
```

---

### Task 3: Minesweeper engine — types, board creation, mine placement (TDD)

**Files:**
- Create: `lib/minesweeper/types.ts`
- Create: `lib/minesweeper/engine.ts`
- Test: `lib/minesweeper/engine.test.ts`

- [ ] **Step 1: Create `lib/minesweeper/types.ts`**

```ts
export type CellState = 'hidden' | 'revealed' | 'flagged';

export interface Cell {
  mine: boolean;
  adjacent: number;
  state: CellState;
  /** Section id if this cell carries a section glyph (guaranteed mine-free). */
  section?: string;
  /** Hanzi character shown when the cell is revealed. */
  glyph?: string;
}

export type GameStatus = 'playing' | 'lost' | 'won';

export interface Board {
  rows: number;
  cols: number;
  mineCount: number;
  /** Mines are placed lazily on first reveal so the first click is always safe. */
  minesPlaced: boolean;
  status: GameStatus;
  /** Row-major: index = row * cols + col. */
  cells: Cell[];
}

export interface SectionSpec {
  id: string;
  href: string;
  glyphs: string[];
  /** Board indices for each glyph, same order as `glyphs`. */
  cells: number[];
}
```

- [ ] **Step 2: Write failing tests in `lib/minesweeper/engine.test.ts`**

```ts
import { describe, expect, test } from 'vitest';
import {
  createBoard,
  neighbors,
  placeMines,
  placeMinesAt,
} from './engine';
import type { SectionSpec } from './types';

/** Deterministic PRNG for tests. */
export function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SECTIONS: SectionSpec[] = [
  { id: 'music', href: '/music', glyphs: ['音', '乐'], cells: [10, 11] },
];

describe('createBoard', () => {
  test('creates a hidden board of the right shape', () => {
    const board = createBoard({ rows: 4, cols: 5, mineCount: 3 });
    expect(board.cells).toHaveLength(20);
    expect(board.minesPlaced).toBe(false);
    expect(board.status).toBe('playing');
    expect(board.cells.every((c) => c.state === 'hidden' && !c.mine)).toBe(true);
  });

  test('assigns section glyphs to their cells', () => {
    const board = createBoard({ rows: 4, cols: 5, mineCount: 3, sections: SECTIONS });
    expect(board.cells[10]).toMatchObject({ section: 'music', glyph: '音' });
    expect(board.cells[11]).toMatchObject({ section: 'music', glyph: '乐' });
  });

  test('pre-reveals sections listed in revealedSectionIds', () => {
    const board = createBoard({
      rows: 4, cols: 5, mineCount: 3,
      sections: SECTIONS,
      revealedSectionIds: ['music'],
    });
    expect(board.cells[10].state).toBe('revealed');
    expect(board.cells[11].state).toBe('revealed');
    expect(board.cells[0].state).toBe('hidden');
  });
});

describe('neighbors', () => {
  test('corner cell has 3 neighbors', () => {
    const board = createBoard({ rows: 4, cols: 5, mineCount: 0 });
    expect(neighbors(board, 0).sort((a, b) => a - b)).toEqual([1, 5, 6]);
  });

  test('interior cell has 8 neighbors', () => {
    const board = createBoard({ rows: 4, cols: 5, mineCount: 0 });
    expect(neighbors(board, 7)).toHaveLength(8);
  });
});

describe('placeMinesAt', () => {
  test('sets mines and computes adjacency counts', () => {
    // 3x3, mine in the center: every other cell touches exactly 1 mine.
    const board = placeMinesAt(createBoard({ rows: 3, cols: 3, mineCount: 1 }), [4]);
    expect(board.minesPlaced).toBe(true);
    expect(board.cells[4].mine).toBe(true);
    for (const i of [0, 1, 2, 3, 5, 6, 7, 8]) {
      expect(board.cells[i].adjacent).toBe(1);
    }
  });
});

describe('placeMines', () => {
  test('places exactly mineCount mines, never on the safe zone or section cells', () => {
    const rng = mulberry32(42);
    const base = createBoard({ rows: 8, cols: 12, mineCount: 15, sections: SECTIONS });
    const board = placeMines(base, 0, rng);
    const mineIndices = board.cells
      .map((c, i) => (c.mine ? i : -1))
      .filter((i) => i >= 0);
    expect(mineIndices).toHaveLength(15);
    const forbidden = new Set([0, ...neighbors(board, 0), 10, 11]);
    expect(mineIndices.some((i) => forbidden.has(i))).toBe(false);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run lib/minesweeper`
Expected: FAIL — `engine.ts` does not exist / exports missing.

- [ ] **Step 4: Create `lib/minesweeper/engine.ts`**

```ts
import type { Board, Cell, SectionSpec } from './types';

export interface CreateOptions {
  rows: number;
  cols: number;
  mineCount: number;
  sections?: SectionSpec[];
  revealedSectionIds?: string[];
}

export function createBoard(opts: CreateOptions): Board {
  const { rows, cols, mineCount, sections = [], revealedSectionIds = [] } = opts;
  const cells: Cell[] = Array.from({ length: rows * cols }, () => ({
    mine: false,
    adjacent: 0,
    state: 'hidden',
  }));
  for (const section of sections) {
    section.cells.forEach((index, i) => {
      cells[index].section = section.id;
      cells[index].glyph = section.glyphs[i];
      if (revealedSectionIds.includes(section.id)) {
        cells[index].state = 'revealed';
      }
    });
  }
  return { rows, cols, mineCount, minesPlaced: false, status: 'playing', cells };
}

export function neighbors(board: Board, index: number): number[] {
  const row = Math.floor(index / board.cols);
  const col = index % board.cols;
  const result: number[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < board.rows && c >= 0 && c < board.cols) {
        result.push(r * board.cols + c);
      }
    }
  }
  return result;
}

function cloneCells(board: Board): Cell[] {
  return board.cells.map((cell) => ({ ...cell }));
}

export function placeMinesAt(board: Board, mineIndices: number[]): Board {
  const cells = cloneCells(board);
  for (const index of mineIndices) cells[index].mine = true;
  const next: Board = { ...board, cells, minesPlaced: true };
  for (let i = 0; i < cells.length; i++) {
    cells[i].adjacent = neighbors(next, i).filter((n) => cells[n].mine).length;
  }
  return next;
}

export function placeMines(
  board: Board,
  safeIndex: number,
  rng: () => number = Math.random,
): Board {
  const forbidden = new Set<number>([safeIndex, ...neighbors(board, safeIndex)]);
  board.cells.forEach((cell, i) => {
    if (cell.section) forbidden.add(i);
  });
  const candidates = board.cells
    .map((_, i) => i)
    .filter((i) => !forbidden.has(i));
  // Fisher–Yates shuffle; take the first mineCount as mines.
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  return placeMinesAt(board, candidates.slice(0, board.mineCount));
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run lib/minesweeper`
Expected: PASS (7 tests).

- [ ] **Step 6: Commit**

```bash
git add lib/minesweeper
git commit -m "feat: minesweeper engine — board creation and safe mine placement"
```

---

### Task 4: Engine — reveal, flood fill, loss, win (TDD)

**Files:**
- Modify: `lib/minesweeper/engine.ts` (append)
- Test: `lib/minesweeper/engine.test.ts` (append)

- [ ] **Step 1: Append failing tests to `lib/minesweeper/engine.test.ts`** (add `reveal` to the existing import from `./engine`)

```ts
describe('reveal', () => {
  test('first reveal places mines and never loses', () => {
    const rng = mulberry32(7);
    let board = createBoard({ rows: 8, cols: 12, mineCount: 15 });
    board = reveal(board, 40, rng);
    expect(board.minesPlaced).toBe(true);
    expect(board.status).toBe('playing');
    expect(board.cells[40].state).toBe('revealed');
    expect(board.cells[40].mine).toBe(false);
  });

  test('flood fill reveals the whole board when there are no mines', () => {
    let board = createBoard({ rows: 4, cols: 4, mineCount: 0 });
    board = placeMinesAt(board, []);
    board = reveal(board, 0);
    expect(board.cells.every((c) => c.state === 'revealed')).toBe(true);
    expect(board.status).toBe('won');
  });

  test('flood fill stops at numbered cells', () => {
    // 4x4 with a mine in the far corner (15): revealing 0 floods everything
    // except the mine — the three cells around it become numbered borders.
    let board = createBoard({ rows: 4, cols: 4, mineCount: 1 });
    board = placeMinesAt(board, [15]);
    board = reveal(board, 0);
    expect(board.cells[15].state).toBe('hidden');
    expect(board.cells[10].adjacent).toBe(1);
    expect(board.cells[10].state).toBe('revealed');
    expect(board.status).toBe('won'); // all non-mine cells revealed
  });

  test('revealing a mine loses', () => {
    let board = createBoard({ rows: 3, cols: 3, mineCount: 1 });
    board = placeMinesAt(board, [4]);
    board = reveal(board, 4);
    expect(board.status).toBe('lost');
    expect(board.cells[4].state).toBe('revealed');
  });

  test('reveal is a no-op on flagged cells and after game over', () => {
    let board = createBoard({ rows: 3, cols: 3, mineCount: 1 });
    board = placeMinesAt(board, [4]);
    board = toggleFlag(board, 0);
    expect(reveal(board, 0)).toBe(board);
    const lost = reveal(board, 4);
    expect(reveal(lost, 1)).toBe(lost);
  });
});
```

(The last test also needs `toggleFlag` — declare it in this task's import and implement it in Task 5 if you're strictly ordering, or simply implement both `reveal` and `toggleFlag` here and let Task 5 cover chording. Recommended: implement `toggleFlag` here since the test needs it.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/minesweeper`
Expected: FAIL — `reveal` / `toggleFlag` not exported.

- [ ] **Step 3: Append to `lib/minesweeper/engine.ts`**

```ts
function checkWin(board: Board): Board {
  const won = board.cells.every((cell) => cell.mine || cell.state === 'revealed');
  return won ? { ...board, status: 'won' } : board;
}

export function reveal(
  board: Board,
  index: number,
  rng: () => number = Math.random,
): Board {
  if (board.status !== 'playing') return board;
  const target = board.cells[index];
  if (target.state === 'flagged' || target.state === 'revealed') return board;

  let next = board.minesPlaced ? board : placeMines(board, index, rng);
  const cells = cloneCells(next);
  next = { ...next, cells };

  if (cells[index].mine) {
    cells[index].state = 'revealed';
    return { ...next, status: 'lost' };
  }

  const queue = [index];
  while (queue.length > 0) {
    const current = queue.pop()!;
    const cell = cells[current];
    if (cell.state !== 'hidden') continue;
    cell.state = 'revealed';
    if (cell.adjacent === 0) {
      for (const n of neighbors(next, current)) {
        if (cells[n].state === 'hidden' && !cells[n].mine) queue.push(n);
      }
    }
  }
  return checkWin(next);
}

export function toggleFlag(board: Board, index: number): Board {
  if (board.status !== 'playing') return board;
  const cell = board.cells[index];
  if (cell.state === 'revealed') return board;
  const cells = cloneCells(board);
  cells[index].state = cell.state === 'flagged' ? 'hidden' : 'flagged';
  return { ...board, cells };
}
```

Note: in `reveal`, pre-revealed section cells pass through the `state !== 'hidden'` guard — the flood fill skips them naturally.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/minesweeper`
Expected: PASS (12 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/minesweeper
git commit -m "feat: minesweeper engine — reveal, flood fill, flags, win/loss"
```

---

### Task 5: Engine — chording and mine counter (TDD)

**Files:**
- Modify: `lib/minesweeper/engine.ts` (append)
- Test: `lib/minesweeper/engine.test.ts` (append)

- [ ] **Step 1: Append failing tests** (add `chord`, `minesRemaining` to the import)

```ts
describe('chord', () => {
  // 4x4 with mines in the top corners (0, 3). reveal(12) floods rows 1-3,
  // leaving row 0 hidden: cells 1 and 2 are safe "1"s, 0 and 3 are mines.
  // (A 3x3/1-mine fixture is degenerate: the setup reveal insta-wins and
  // chord never runs — do not shrink this fixture.)
  const chordBase = () => {
    let b = createBoard({ rows: 4, cols: 4, mineCount: 2 });
    b = placeMinesAt(b, [0, 3]);
    return reveal(b, 12); // status 'playing'; cells 4-15 revealed, 0-3 hidden
  };

  test('reveals unflagged neighbors when flags match the number', () => {
    let board = chordBase();
    board = toggleFlag(board, 0); // correctly flag the mine
    board = chord(board, 5); // "1" next to the flag
    expect(board.cells[1].state).toBe('revealed');
    expect(board.cells[2].state).toBe('revealed');
    expect(board.status).toBe('won');
  });

  test('does nothing when flag count does not match', () => {
    const board = chordBase();
    expect(chord(board, 5)).toBe(board); // no flags placed
  });

  test('loses if a flag was wrong', () => {
    let board = chordBase();
    board = toggleFlag(board, 1); // wrong flag on a safe cell
    board = chord(board, 5); // reveals neighbors incl. the mine at 0
    expect(board.status).toBe('lost');
  });
});

describe('minesRemaining', () => {
  test('mineCount minus flags', () => {
    let board = createBoard({ rows: 3, cols: 3, mineCount: 2 });
    board = placeMinesAt(board, [0, 1]);
    expect(minesRemaining(board)).toBe(2);
    board = toggleFlag(board, 5);
    expect(minesRemaining(board)).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/minesweeper`
Expected: FAIL — `chord` / `minesRemaining` not exported.

- [ ] **Step 3: Append to `lib/minesweeper/engine.ts`**

```ts
export function chord(
  board: Board,
  index: number,
  rng: () => number = Math.random,
): Board {
  const cell = board.cells[index];
  if (
    board.status !== 'playing' ||
    cell.state !== 'revealed' ||
    cell.adjacent === 0
  ) {
    return board;
  }
  const around = neighbors(board, index);
  const flags = around.filter((n) => board.cells[n].state === 'flagged').length;
  if (flags !== cell.adjacent) return board;
  let next = board;
  for (const n of around) {
    if (next.cells[n].state === 'hidden') next = reveal(next, n, rng);
  }
  return next;
}

export function minesRemaining(board: Board): number {
  const flags = board.cells.filter((c) => c.state === 'flagged').length;
  return board.mineCount - flags;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/minesweeper`
Expected: PASS (all tests green).

- [ ] **Step 5: Carried-forward fixes from the Task 4 review (same files)**

- `export` the `checkWin` function (Task 7's settleSections force-reveals section cells outside the engine and must re-run the win check afterward).
- Rename the test `'a pre-revealed section does not wall off the flood fill'` to `'flood fill routes around a small pre-revealed section'` (the old name claims a guarantee the engine doesn't provide), and add a sibling test pinning the real constraint: a section spanning a full column DOES wall the flood (e.g. 4x4, mine-free, section cells [1,5,9,13] pre-revealed, reveal(0) → cells 2,3,6,7,10,11,14,15 stay... [construct so the far side stays hidden and status stays 'playing']).
- Note (deliberate, do not change): a chord that would detonate two mines reveals only the first — once status is 'lost', later reveals in the loop no-op.

- [ ] **Step 6: Commit**

```bash
git add lib/minesweeper
git commit -m "feat: minesweeper engine — chording and mine counter"
```

---

### Task 6: Spine navigation + footer

**Files:**
- Create: `components/spine.tsx`
- Create: `components/site-footer.tsx`
- Modify: `app/layout.tsx`

**Accessibility note:** wrap hanzi text (the wordmark 贾一茗, nav labels, the seal 贾) in `lang="zh-Hans"` attributes so screen readers use a Chinese voice and browsers pick Simplified-Chinese glyph forms.

**Post-review deltas (shipped in `components/spine.tsx` / `site-footer.tsx`, commit ac2606e — the repo files are authoritative over the blocks below):** nav links carry `aria-label={item.en}` (bilingual affordance) and `aria-current="page"` when active; active color is `text-vermilion-text` (AA-safe); vertical spine text adds `[text-orientation:upright]` (upright "CV"); shared `FOCUS_RING` (`focus-visible:ring-vermilion`); mobile links `py-2 -my-2`, nav `gap-3`; `lang="zh-Hans"` sits on inner spans around hanzi, never on elements whose accessible name is Latin; `/cv.pdf` is a plain `<a target="_blank" rel="noopener">`, not a `next/link`; desktop aside has `bg-ink`; footer external links `target="_blank" rel="noopener"`; nav items rendered via a shared `NavItems` component to keep both breakpoint variants in sync.

- [ ] **Step 1: Create `components/spine.tsx`**

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/projects', zh: '项目', en: 'Projects' },
  { href: '/music', zh: '音乐', en: 'Music' },
  { href: '/about', zh: '关于', en: 'About' },
  { href: '/minesweeper', zh: '扫雷', en: 'Minesweeper' },
  { href: '/cv.pdf', zh: 'CV', en: 'CV' },
];

function linkClass(pathname: string, href: string): string {
  const active = href !== '/cv.pdf' && pathname.startsWith(href);
  return `text-xs tracking-[0.35em] transition-colors hover:text-paper ${
    active ? 'text-vermilion' : 'text-muted'
  }`;
}

export default function Spine() {
  const pathname = usePathname();
  return (
    <>
      {/* Desktop: fixed vertical spine */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[72px] flex-col items-center border-r border-hairline-2 py-6 md:flex">
        <Link
          href="/"
          className="text-lg tracking-[0.5em] [writing-mode:vertical-rl]"
        >
          贾一茗
        </Link>
        <nav
          aria-label="Site"
          className="mt-8 flex flex-col items-center gap-5"
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`[writing-mode:vertical-rl] ${linkClass(pathname, item.href)}`}
            >
              {item.zh}
            </Link>
          ))}
        </nav>
        <Link
          href="/"
          aria-label="Home"
          className="mt-auto flex h-8 w-8 items-center justify-center rounded-[2px] bg-vermilion text-sm text-[#f5f0e6]"
        >
          贾
        </Link>
      </aside>

      {/* Mobile: sticky top bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-hairline-2 bg-ink/90 px-4 py-3 backdrop-blur md:hidden">
        <Link href="/" className="tracking-[0.3em]">
          贾一茗
        </Link>
        <nav aria-label="Site" className="flex gap-4">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass(pathname, item.href)}>
              {item.zh}
            </Link>
          ))}
        </nav>
      </header>
    </>
  );
}
```

- [ ] **Step 2: Create `components/site-footer.tsx`**

```tsx
export default function SiteFooter() {
  return (
    <footer className="border-t border-hairline px-6 py-8 md:pl-[96px]">
      <div className="flex flex-wrap items-baseline gap-6 font-mono-game text-xs text-muted">
        <a href="mailto:jasonjiaym@gmail.com" className="hover:text-paper">
          email
        </a>
        <a
          href="https://github.com/REPLACE-github-username"
          className="hover:text-paper"
        >
          github
        </a>
        <a
          href="https://www.linkedin.com/in/REPLACE-linkedin-slug"
          className="hover:text-paper"
        >
          linkedin
        </a>
        <span className="flex-1" />
        <span className="text-faint">© 2026 Yiming Jia 贾一茗</span>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Wire both into `app/layout.tsx`** — replace the body contents:

```tsx
      <body className="flex min-h-screen flex-col bg-ink font-serif-sc text-paper antialiased">
        <Spine />
        <main className="flex-1 md:pl-[72px]">{children}</main>
        <SiteFooter />
      </body>
```

with imports `import Spine from '@/components/spine';` and `import SiteFooter from '@/components/site-footer';`.

- [ ] **Step 4: Verify**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add components app/layout.tsx
git commit -m "feat: spine navigation (desktop vertical, mobile top bar) and footer"
```

---

### Task 7: GameBoard client component (TDD for interactions)

**Files:**
- Create: `components/game-board.tsx`
- Test: `components/game-board.test.tsx`

- [ ] **Step 1: Write failing tests in `components/game-board.test.tsx`**

```tsx
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import GameBoard from './game-board';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

beforeEach(() => {
  push.mockClear();
  window.sessionStorage.clear();
});

function cell(row: number, col: number): HTMLElement {
  return screen.getByRole('button', { name: `cell ${row},${col}` });
}

describe('GameBoard', () => {
  test('clicking a cell on a mine-free board flood-reveals everything', () => {
    render(<GameBoard rows={3} cols={3} mineCount={0} showStatus={false} />);
    fireEvent.click(cell(0, 0));
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        expect(cell(r, c)).toHaveAttribute('data-state', 'revealed');
      }
    }
  });

  test('right-click flags a hidden cell', () => {
    render(<GameBoard rows={3} cols={3} mineCount={0} showStatus={false} />);
    fireEvent.contextMenu(cell(1, 1));
    expect(cell(1, 1)).toHaveAttribute('data-state', 'flagged');
    fireEvent.contextMenu(cell(1, 1));
    expect(cell(1, 1)).toHaveAttribute('data-state', 'hidden');
  });

  test('clicking an already-revealed section tile navigates to its page', () => {
    const sections = [
      { id: 'music', href: '/music', glyphs: ['音'], cells: [4] },
    ];
    render(
      <GameBoard
        rows={3}
        cols={3}
        mineCount={0}
        sections={sections}
        showStatus={false}
      />,
    );
    fireEvent.click(cell(0, 0)); // flood reveal (0 mines) — includes the section tile
    expect(cell(1, 1)).toHaveTextContent('音');
    fireEvent.click(cell(1, 1));
    expect(push).toHaveBeenCalledWith('/music');
  });

  test('revealed sections are persisted to sessionStorage', () => {
    const sections = [
      { id: 'music', href: '/music', glyphs: ['音'], cells: [4] },
    ];
    render(
      <GameBoard
        rows={3}
        cols={3}
        mineCount={0}
        sections={sections}
        persistKey="test-found"
        showStatus={false}
      />,
    );
    fireEvent.click(cell(0, 0));
    expect(JSON.parse(window.sessionStorage.getItem('test-found')!)).toEqual([
      'music',
    ]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run components`
Expected: FAIL — `game-board.tsx` does not exist.

- [ ] **Step 3: Create `components/game-board.tsx`**

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  checkWin,
  chord,
  createBoard,
  minesRemaining,
  reveal,
  toggleFlag,
} from '@/lib/minesweeper/engine';
import type { Board, Cell, SectionSpec } from '@/lib/minesweeper/types';

const NUMBER_CLASSES: Record<number, string> = {
  1: 'text-n1',
  2: 'text-n2',
  3: 'text-n3',
  4: 'text-n4',
  5: 'text-n5',
  6: 'text-n6',
  7: 'text-n7',
  8: 'text-n8',
};

export interface GameBoardProps {
  rows?: number;
  cols?: number;
  mineCount?: number;
  sections?: SectionSpec[];
  /** sessionStorage key for persisting found sections; omit to disable. */
  persistKey?: string;
  showStatus?: boolean;
  title?: string;
  className?: string;
}

function loadFound(persistKey?: string): string[] {
  if (!persistKey || typeof window === 'undefined') return [];
  try {
    const raw = window.sessionStorage.getItem(persistKey);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function cellContent(cell: Cell) {
  if (cell.state === 'flagged') {
    return <span className="text-[10px] text-vermilion">⚑</span>;
  }
  if (cell.state !== 'revealed') return null;
  if (cell.mine) return <span className="text-vermilion">✕</span>;
  if (cell.glyph) {
    return <span className="font-serif-sc text-[13px] font-normal">{cell.glyph}</span>;
  }
  if (cell.adjacent > 0) {
    return <span className={NUMBER_CLASSES[cell.adjacent]}>{cell.adjacent}</span>;
  }
  return null;
}

function cellClass(cell: Cell): string {
  const base =
    'flex aspect-square items-center justify-center rounded-[2px] border font-mono-game text-[11px] font-bold outline-none focus-visible:ring-1 focus-visible:ring-vermilion';
  if (cell.state === 'revealed' && cell.section) {
    return `${base} border-vermilion/60 bg-surface text-vermilion shadow-[0_0_8px_rgba(194,59,34,0.35)] cursor-pointer`;
  }
  if (cell.state === 'revealed') {
    return `${base} border-hairline bg-surface`;
  }
  return `${base} border-hairline-2 bg-tile transition-transform motion-safe:hover:scale-[0.96]`;
}

export default function GameBoard({
  rows = 8,
  cols = 12,
  mineCount = 15,
  sections = [],
  persistKey,
  showStatus = true,
  title = 'YIMING JIA',
  // Max width lives in this prop (not hardcoded) so callers can override it
  // without producing two conflicting Tailwind max-w-* classes.
  className = 'max-w-[420px]',
}: GameBoardProps) {
  const router = useRouter();
  const makeBoard = (found: string[]): Board =>
    createBoard({ rows, cols, mineCount, sections, revealedSectionIds: found });

  const [board, setBoard] = useState<Board>(() => makeBoard([]));
  const [started, setStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [shaking, setShaking] = useState(false);
  const [flagMode, setFlagMode] = useState(false);
  const [focusIdx, setFocusIdx] = useState(0);
  const startRef = useRef<number>(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const longPress = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressClick = useRef(false);

  // sessionStorage is client-only: restore found sections after mount.
  useEffect(() => {
    const found = loadFound(persistKey);
    if (found.length > 0) setBoard(makeBoard(found));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!started || board.status !== 'playing') return;
    const id = setInterval(() => {
      setElapsed((Date.now() - startRef.current) / 1000);
    }, 100);
    return () => clearInterval(id);
  }, [started, board.status]);

  /** Fully open any section that was touched, and persist the found list. */
  function settleSections(next: Board): Board {
    if (sections.length === 0) return next;
    const cells = next.cells.map((c) => ({ ...c }));
    const found: string[] = [];
    for (const s of sections) {
      if (s.cells.some((i) => cells[i].state === 'revealed')) {
        found.push(s.id);
        for (const i of s.cells) cells[i].state = 'revealed';
      }
    }
    if (persistKey) {
      window.sessionStorage.setItem(persistKey, JSON.stringify(found));
    }
    return { ...next, cells };
  }

  function reset() {
    setBoard(makeBoard(loadFound(persistKey)));
    setStarted(false);
    setElapsed(0);
    setShaking(false);
  }

  function commit(next: Board) {
    if (next === board) return; // no-op action: skip re-render + storage write
    // settleSections force-reveals section cells outside the engine, so the
    // win check must re-run afterward (checkWin no-ops on non-playing boards).
    const settled = checkWin(settleSections(next));
    setBoard(settled);
    if (settled.status === 'lost') {
      setShaking(true);
      setTimeout(reset, 900);
    }
  }

  function handleReveal(index: number) {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    const cell = board.cells[index];
    if (cell.state === 'revealed' && cell.section) {
      const section = sections.find((s) => s.id === cell.section);
      if (section) router.push(section.href);
      return;
    }
    if (flagMode) {
      setBoard((b) => toggleFlag(b, index));
      return;
    }
    if (!started) {
      setStarted(true);
      startRef.current = Date.now();
    }
    commit(reveal(board, index));
  }

  function handleFlag(index: number) {
    setBoard((b) => toggleFlag(b, index));
  }

  function handleChord(index: number) {
    commit(chord(board, index));
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const moves: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -cols,
      ArrowDown: cols,
    };
    if (e.key in moves) {
      e.preventDefault();
      setFocusIdx((i) =>
        Math.min(board.cells.length - 1, Math.max(0, i + moves[e.key])),
      );
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleReveal(focusIdx);
    } else if (e.key.toLowerCase() === 'f') {
      e.preventDefault();
      handleFlag(focusIdx);
    }
  }

  useEffect(() => {
    const grid = gridRef.current;
    if (grid && grid.contains(document.activeElement)) {
      grid
        .querySelector<HTMLButtonElement>(`[data-idx="${focusIdx}"]`)
        ?.focus();
    }
  }, [focusIdx]);

  const remaining = Math.max(0, minesRemaining(board));

  return (
    <div className={`w-full ${className}`}>
      {showStatus && (
        <div className="flex items-center justify-between border-b border-hairline pb-2 font-mono-game text-xs text-muted">
          <span aria-label="mines remaining">
            ⚑ {String(remaining).padStart(3, '0')}
          </span>
          <span className="font-serif-sc tracking-[0.3em] text-paper">
            {title}
          </span>
          <span aria-label="timer" className="text-paper">
            {board.status === 'won' ? elapsed.toFixed(2) : elapsed.toFixed(2).padStart(6, '0')}
          </span>
        </div>
      )}
      <div
        ref={gridRef}
        role="grid"
        aria-label="Minesweeper board"
        onKeyDown={onKeyDown}
        className={`mt-3 grid gap-[2px] ${shaking ? 'motion-safe:animate-board-shake' : ''}`}
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {board.cells.map((cell, i) => {
          const row = Math.floor(i / cols);
          const col = i % cols;
          return (
            <button
              key={i}
              type="button"
              data-idx={i}
              data-state={cell.state}
              tabIndex={i === focusIdx ? 0 : -1}
              aria-label={`cell ${row},${col}`}
              className={cellClass(cell)}
              onClick={() => handleReveal(i)}
              onContextMenu={(e) => {
                e.preventDefault();
                handleFlag(i);
              }}
              onDoubleClick={() => handleChord(i)}
              onTouchStart={() => {
                longPress.current = setTimeout(() => {
                  suppressClick.current = true;
                  handleFlag(i);
                }, 450);
              }}
              onTouchEnd={() => {
                if (longPress.current) clearTimeout(longPress.current);
              }}
              onTouchMove={() => {
                if (longPress.current) clearTimeout(longPress.current);
              }}
            >
              {cellContent(cell)}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex justify-end md:hidden">
        <button
          type="button"
          onClick={() => setFlagMode((m) => !m)}
          className={`font-mono-game text-[10px] ${
            flagMode ? 'text-vermilion' : 'text-faint'
          }`}
        >
          ⚑ flag mode {flagMode ? 'on' : 'off'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run components`
Expected: PASS (4 tests). Also run `npx vitest run` — all engine tests still pass.

- [ ] **Step 5: Commit**

```bash
git add components/game-board.tsx components/game-board.test.tsx
git commit -m "feat: GameBoard client component with sections, persistence, touch and keyboard support"
```

---

### Task 8: Homepage assembly

**Files:**
- Modify: `app/page.tsx` (full replace)

- [ ] **Step 1: Replace `app/page.tsx`**

```tsx
import GameBoard from '@/components/game-board';
import type { SectionSpec } from '@/lib/minesweeper/types';

const COLS = 12;
const at = (row: number, col: number) => row * COLS + col;

// LAYOUT CONSTRAINT: section cells must never span a full row or column —
// revealed section cells (whether restored from sessionStorage or found this
// session) act as flood-fill walls, and a spanning wall would strand the
// region behind it (see engine reveal semantics).
const HOME_SECTIONS: SectionSpec[] = [
  { id: 'projects', href: '/projects', glyphs: ['项', '目'], cells: [at(1, 7), at(1, 8)] },
  { id: 'music', href: '/music', glyphs: ['音', '乐'], cells: [at(3, 4), at(3, 5)] },
  { id: 'minesweeper', href: '/minesweeper', glyphs: ['扫', '雷'], cells: [at(5, 9), at(5, 10)] },
  { id: 'about', href: '/about', glyphs: ['关', '于'], cells: [at(6, 2), at(6, 3)] },
];

export default function Home() {
  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-center px-4 py-10">
      <GameBoard sections={HOME_SECTIONS} persistKey="yj-found-sections" />
      <div className="mt-3 flex w-full max-w-[420px] justify-between font-mono-game text-[10px] text-faint">
        <span>click reveal · right-click flag · double-click chord</span>
        <span className="hidden text-muted md:inline">not a sweeper? use the spine ←</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify in the browser**

Run: `npm run dev`, open `http://localhost:3000`.
Expected: dark page, spine left, playable 12×8 board. Reveal tiles; find a section pair (they open together and glow vermilion); click it → navigates (404 for now — pages come next). Hit a mine → shake, soft reset, found sections still open. Reload → found sections still open.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: homepage — minesweeper board with hidden section tiles"
```

---

### Task 9: Content data files

**Files:**
- Create: `content/projects.ts`
- Create: `content/music.ts`

- [ ] **Step 1: Create `content/projects.ts`** (`REPLACE:` markers are Yiming's real data — leave the markers; final task collects them)

```ts
export interface Project {
  slug: string;
  title: string;
  zh: string;
  year: string;
  blurb: string;
  tech: string[];
  featured?: boolean;
  links?: { label: string; href: string }[];
  /** Case-study paragraphs; a project without a body still gets a detail page showing metadata. */
  body?: string[];
}

export const projects: Project[] = [
  {
    slug: 'trajecta',
    title: 'Trajecta',
    zh: '轨迹',
    year: '2026',
    blurb: 'REPLACE: one-line description of Trajecta.',
    tech: ['REPLACE: tech list'],
    featured: true,
    links: [{ label: 'github', href: 'https://github.com/REPLACE' }],
    body: [
      'REPLACE: what Trajecta is and why you built it.',
      'REPLACE: the interesting technical problems.',
      'REPLACE: current status and what is next.',
    ],
  },
  {
    slug: 'REPLACE-project-2',
    title: 'REPLACE: second project',
    zh: '二',
    year: 'REPLACE',
    blurb: 'REPLACE: one-line description.',
    tech: ['REPLACE'],
  },
];
```

- [ ] **Step 2: Create `content/music.ts`**

```ts
export interface MusicPiece {
  slug: string;
  title: string;
  instrumentation: string;
  year: number;
  audioSrc?: string;
  scoreUrl?: string;
  programNotes?: string[];
}

/** A piece gets its own page only when there is something substantial to show. */
export function hasDetail(piece: MusicPiece): boolean {
  return Boolean(
    piece.audioSrc || piece.scoreUrl || (piece.programNotes && piece.programNotes.length > 0),
  );
}

export const pieces: MusicPiece[] = [
  {
    slug: 'REPLACE-piece-1',
    title: 'REPLACE: piece with a recording',
    instrumentation: 'REPLACE: e.g. string quartet',
    year: 2025,
    audioSrc: '/audio/REPLACE.mp3',
    programNotes: ['REPLACE: program note paragraph.'],
  },
  {
    slug: 'REPLACE-piece-2',
    title: 'REPLACE: metadata-only piece',
    instrumentation: 'REPLACE: e.g. solo piano',
    year: 2024,
  },
];
```

- [ ] **Step 3: Verify** — `npx tsc --noEmit` passes.

- [ ] **Step 4: Commit**

```bash
git add content
git commit -m "feat: typed content data files for projects and music"
```

---

### Task 10: Projects page — lattice grid with hover-resize

**Files:**
- Create: `app/projects/page.tsx`
- Create: `components/lattice-frame.tsx`

- [ ] **Step 1: Create `components/lattice-frame.tsx`** (pure CSS hover-resize via flex-grow transition — no client JS)

```tsx
import Link from 'next/link';
import type { Project } from '@/content/projects';

const ORDINAL_CLASSES = ['text-n1', 'text-n2', 'text-n3', 'text-muted'];

export default function LatticeFrame({
  project,
  index,
  wide = false,
}: {
  project: Project;
  index: number;
  wide?: boolean;
}) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className={`group relative block border border-hairline-2 p-6 transition-all duration-300 hover:bg-surface motion-reduce:transition-none md:hover:flex-[2] ${
        wide ? 'md:flex-[1.6]' : 'md:flex-1'
      }`}
    >
      <span className="absolute -left-px -top-px h-2 w-2 border-l-2 border-t-2 border-vermilion" />
      <div className="flex flex-wrap items-baseline gap-3">
        <span
          className={`font-mono-game text-xs font-bold ${ORDINAL_CLASSES[Math.min(index, 3)]}`}
        >
          {index + 1}
        </span>
        <h2 className="text-2xl font-light">{project.title}</h2>
        <span className="text-sm text-muted">{project.zh}</span>
      </div>
      <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
        {project.blurb}
      </p>
      <p className="mt-4 font-mono-game text-[10px] text-faint">
        {project.tech.join(' · ')} — {project.year}
      </p>
    </Link>
  );
}
```

- [ ] **Step 2: Create `app/projects/page.tsx`**

```tsx
import type { Metadata } from 'next';
import LatticeFrame from '@/components/lattice-frame';
import { projects } from '@/content/projects';

export const metadata: Metadata = { title: '项目 Projects — Yiming Jia' };

export default function ProjectsPage() {
  const ordered = [
    ...projects.filter((p) => p.featured),
    ...projects.filter((p) => !p.featured),
  ];
  const rows: (typeof ordered)[] = [];
  for (let i = 0; i < ordered.length; i += 2) rows.push(ordered.slice(i, i + 2));

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-sm tracking-[0.5em] text-paper">
        项目{' '}
        <span className="font-mono-game text-[10px] tracking-normal text-faint">
          / PROJECTS
        </span>
      </h1>
      <div className="mt-10 flex flex-col gap-3">
        {rows.map((row, r) => (
          <div key={r} className="flex flex-col gap-3 md:flex-row">
            {row.map((project, i) => (
              <LatticeFrame
                key={project.slug}
                project={project}
                index={r * 2 + i}
                wide={r === 0 && i === 0}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify** — `npm run dev`, open `/projects`. Frames sit in rows; hovering one grows it while its row-mate shrinks (smooth 300ms); with reduced motion enabled there is no animation. Single column on mobile width.

- [ ] **Step 4: Commit**

```bash
git add app/projects components/lattice-frame.tsx
git commit -m "feat: projects page — lattice grid with hover-resize frames"
```

---

### Task 11: Project detail pages

**Files:**
- Create: `app/projects/[slug]/page.tsx`

- [ ] **Step 1: Create `app/projects/[slug]/page.tsx`**

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { projects } from '@/content/projects';

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  return { title: project ? `${project.title} — Yiming Jia` : 'Project' };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) notFound();

  return (
    <article className="mx-auto max-w-2xl px-6 py-16">
      <p className="font-mono-game text-[10px] tracking-[0.3em] text-faint">
        PROJECT — {project.year}
      </p>
      <div className="mt-4 flex items-baseline gap-4">
        <h1 className="text-4xl font-light">{project.title}</h1>
        <span className="text-lg text-muted">{project.zh}</span>
      </div>
      <div className="mt-2 h-px w-24 bg-hairline-2" />
      <p className="mt-6 text-lg leading-relaxed text-paper">{project.blurb}</p>
      {project.body?.map((paragraph, i) => (
        <p key={i} className="mt-5 leading-loose text-muted">
          {paragraph}
        </p>
      ))}
      <p className="mt-8 font-mono-game text-xs text-faint">
        {project.tech.join(' · ')}
      </p>
      {project.links && (
        <div className="mt-6 flex gap-5">
          {project.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="font-mono-game text-xs text-vermilion hover:text-paper"
            >
              {link.label} ↗
            </a>
          ))}
        </div>
      )}
    </article>
  );
}
```

- [ ] **Step 2: Verify** — `npm run build` succeeds and pre-renders `/projects/trajecta`; visiting an unknown slug 404s.

- [ ] **Step 3: Commit**

```bash
git add app/projects
git commit -m "feat: project detail pages"
```

---

### Task 12: Music catalog page (TDD for row logic)

**Files:**
- Create: `components/music-row.tsx`
- Create: `app/music/page.tsx`
- Test: `components/music-row.test.tsx`

- [ ] **Step 1: Write failing test `components/music-row.test.tsx`**

```tsx
import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import MusicRow from './music-row';
import type { MusicPiece } from '@/content/music';

const withAudio: MusicPiece = {
  slug: 'quartet',
  title: 'String Quartet',
  instrumentation: 'string quartet',
  year: 2025,
  audioSrc: '/audio/quartet.mp3',
};

const metadataOnly: MusicPiece = {
  slug: 'etude',
  title: 'Etude',
  instrumentation: 'solo piano',
  year: 2024,
};

describe('MusicRow', () => {
  test('pieces with detail render as links to their page', () => {
    render(<MusicRow piece={withAudio} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/music/quartet');
  });

  test('metadata-only pieces render as plain rows, not links', () => {
    render(<MusicRow piece={metadataOnly} />);
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('Etude')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/music-row.test.tsx`
Expected: FAIL — `music-row.tsx` does not exist.

- [ ] **Step 3: Create `components/music-row.tsx`**

```tsx
import Link from 'next/link';
import { hasDetail, type MusicPiece } from '@/content/music';

export default function MusicRow({ piece }: { piece: MusicPiece }) {
  const row = (
    <div className="flex items-baseline gap-4 border-b border-hairline py-4">
      <span className="text-lg font-light">{piece.title}</span>
      {hasDetail(piece) && (
        <span aria-hidden className="text-xs text-vermilion">
          ◉
        </span>
      )}
      <span className="flex-1" />
      <span className="font-mono-game text-xs text-muted">
        {piece.instrumentation} · {piece.year}
      </span>
    </div>
  );

  return hasDetail(piece) ? (
    <Link
      href={`/music/${piece.slug}`}
      className="block transition-colors hover:bg-surface"
    >
      {row}
    </Link>
  ) : (
    <div>{row}</div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/music-row.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Create `app/music/page.tsx`**

```tsx
import type { Metadata } from 'next';
import MusicRow from '@/components/music-row';
import { pieces } from '@/content/music';

export const metadata: Metadata = { title: '音乐 Music — Yiming Jia' };

export default function MusicPage() {
  const ordered = [...pieces].sort((a, b) => b.year - a.year);
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="text-center">
        <p className="text-[11px] tracking-[0.6em] text-muted">音 乐 目 录</p>
        <h1 className="mt-2 text-2xl font-light">Music Catalog</h1>
        <div className="mx-auto mt-4 h-px w-16 bg-hairline-2" />
      </div>
      <div className="mt-12">
        {ordered.map((piece) => (
          <MusicRow key={piece.slug} piece={piece} />
        ))}
      </div>
      <p className="mt-8 text-center font-mono-game text-[10px] text-faint">
        ◉ = recording, score, or notes available
      </p>
    </div>
  );
}
```

- [ ] **Step 6: Verify** — `npm run dev`, `/music` shows concert-program rows; the piece with audio is a hoverable link, the metadata-only piece is inert.

- [ ] **Step 7: Commit**

```bash
git add app/music components/music-row.tsx components/music-row.test.tsx
git commit -m "feat: music catalog page with detail-aware rows"
```

---

### Task 13: Music detail pages

**Files:**
- Create: `app/music/[slug]/page.tsx`

- [ ] **Step 1: Create `app/music/[slug]/page.tsx`** (only pieces with detail get pages)

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasDetail, pieces } from '@/content/music';

export function generateStaticParams() {
  return pieces.filter(hasDetail).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const piece = pieces.find((p) => p.slug === slug);
  return { title: piece ? `${piece.title} — Yiming Jia` : 'Music' };
}

export default async function PiecePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const piece = pieces.find((p) => p.slug === slug);
  if (!piece || !hasDetail(piece)) notFound();

  return (
    <article className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-center text-[11px] tracking-[0.6em] text-muted">
        {piece.instrumentation}
      </p>
      <h1 className="mt-3 text-center text-3xl font-light">{piece.title}</h1>
      <p className="mt-2 text-center font-mono-game text-xs text-faint">
        {piece.year}
      </p>
      <div className="mx-auto mt-6 h-px w-16 bg-hairline-2" />
      {piece.audioSrc && (
        <audio
          controls
          src={piece.audioSrc}
          className="mx-auto mt-10 w-full [color-scheme:dark]"
        />
      )}
      {piece.programNotes?.map((paragraph, i) => (
        <p key={i} className="mt-6 leading-loose text-muted">
          {paragraph}
        </p>
      ))}
      {piece.scoreUrl && (
        <p className="mt-8 text-center">
          <a
            href={piece.scoreUrl}
            className="font-mono-game text-xs text-vermilion hover:text-paper"
          >
            view score ↗
          </a>
        </p>
      )}
    </article>
  );
}
```

- [ ] **Step 2: Verify** — `npm run build` pre-renders only the piece with detail; the metadata-only slug 404s.

- [ ] **Step 3: Commit**

```bash
git add app/music
git commit -m "feat: music detail pages for pieces with recordings or notes"
```

---

### Task 14: About page

**Files:**
- Create: `app/about/page.tsx`

- [ ] **Step 1: Create `app/about/page.tsx`** (ink-scroll: sparse sections, hairline rules; `REPLACE:` text is Yiming's)

```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = { title: '关于 About — Yiming Jia' };

const SECTIONS: { zh: string; en: string; body: string[] }[] = [
  {
    zh: '出身',
    en: 'Origins',
    body: [
      'REPLACE: Born in Shanghai; moved to the US. A paragraph about that arc and what stuck — including the pull of the minimalism and neo-Chinese architecture rediscovered on a recent visit back.',
    ],
  },
  {
    zh: '现在',
    en: 'Now',
    body: [
      'REPLACE: Studying CS (BA) and Music Composition (BM, Bienen) at Northwestern. What each side feeds; why both.',
    ],
  },
  {
    zh: '扫雷',
    en: 'Sweeping',
    body: [
      'REPLACE: A short word on minesweeper — 52s expert, 14s intermediate — and why a decades-old grid game earns a whole page on this site.',
    ],
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-sm tracking-[0.5em]">
        关于{' '}
        <span className="font-mono-game text-[10px] tracking-normal text-faint">
          / ABOUT
        </span>
      </h1>
      {SECTIONS.map((section) => (
        <section key={section.en} className="mt-16">
          <div className="flex items-baseline gap-3">
            <h2 className="text-xl font-light">{section.zh}</h2>
            <span className="font-mono-game text-[10px] tracking-[0.3em] text-faint">
              {section.en.toUpperCase()}
            </span>
          </div>
          <div className="mt-3 h-px w-12 bg-hairline-2" />
          {section.body.map((paragraph, i) => (
            <p key={i} className="mt-5 leading-loose text-muted">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify** — `/about` renders with generous spacing.

- [ ] **Step 3: Commit**

```bash
git add app/about
git commit -m "feat: about page in ink-scroll layout"
```

---

### Task 15: Minesweeper page

**Carried from the Task 7 board review:**
- Add win feedback on this page (the board itself only freezes the timer on win) — e.g. a status line under the board driven by the same aria-live text, or a vermilion glow on the grid.
- Mobile tap targets: 16 cols in `max-w-[560px]` ≈ 20px cells at 375px width — too small for touch. Render a smaller grid below `md` (e.g. 10×10, 12 mines) using a separate `<GameBoard key="mobile" .../>` in a `md:hidden` wrapper (geometry props are mount-only; the key/remount pattern is required), with the 16×16 in a `hidden md:flex` wrapper.

**Files:**
- Create: `app/minesweeper/page.tsx`

- [ ] **Step 1: Create `app/minesweeper/page.tsx`** (stats as a concert program, then a real 16×16/40 board; no sections, no persistence)

```tsx
import type { Metadata } from 'next';
import GameBoard from '@/components/game-board';

export const metadata: Metadata = { title: '扫雷 Minesweeper — Yiming Jia' };

const TIMES = [
  { level: 'Expert', zh: '高级', grid: '30×16 · 99 mines', time: '52s' },
  { level: 'Intermediate', zh: '中级', grid: '16×16 · 40 mines', time: '14s' },
];

export default function MinesweeperPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="text-center">
        <p className="text-[11px] tracking-[0.6em] text-muted">个 人 最 佳</p>
        <h1 className="mt-2 text-2xl font-light">Personal Bests</h1>
        <div className="mx-auto mt-4 h-px w-16 bg-hairline-2" />
      </div>
      <div className="mt-10">
        {TIMES.map((row) => (
          <div
            key={row.level}
            className="flex items-baseline gap-4 border-b border-hairline py-4"
          >
            <span className="text-lg font-light">{row.level}</span>
            <span className="text-sm text-muted">{row.zh}</span>
            <span className="flex-1" />
            <span className="font-mono-game text-xs text-faint">{row.grid}</span>
            <span className="font-mono-game text-lg text-vermilion">{row.time}</span>
          </div>
        ))}
      </div>
      <div className="mt-16 flex flex-col items-center">
        <p className="mb-6 font-mono-game text-[10px] tracking-[0.2em] text-faint">
          YOUR TURN — 16×16 · 40 MINES
        </p>
        <GameBoard
          rows={16}
          cols={16}
          mineCount={40}
          title="扫雷"
          className="max-w-[560px]"
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify** — `/minesweeper` shows the times and a playable intermediate board with its own timer; losing here just resets the board.

- [ ] **Step 3: Commit**

```bash
git add app/minesweeper
git commit -m "feat: minesweeper page — personal bests and playable board"
```

---

### Task 16: Final verification, content checklist, deploy

**Files:**
- None new (fixes only, if verification finds issues)

- [ ] **Step 0: Deferred polish from earlier reviews**

- `npm i -D @testing-library/dom` (undeclared RTL peer dep); bump `@types/node` to `^22`; add `"typecheck": "tsc --noEmit"` script and `"engines": { "node": ">=20" }`.
- Add `.claude/settings.local.json` to `.gitignore`; rewrite `README.md` (it still describes the CNA scaffold/Geist).
- Add `metadataBase` (Vercel URL) and basic `openGraph` metadata to `app/layout.tsx`; add `app/apple-icon.png` (rasterized seal).
- Review `npm audit` output (12 highs inherited from create-next-app tree); fix only what doesn't break.
- `app/icon.svg`: outline the 贾 glyph to a `<path>` (text in SVG favicons renders as tofu in CJK-less rasterizers like link unfurlers).
- Follow-up (post-launch acceptable): full board screen-reader story — per-cell state in aria-labels (flagged/revealed/count) beyond the aria-live win/loss announcements added in Task 7.
- Optional post-launch perf: hand-subset the site's fixed ~40-60 hanzi into a self-hosted woff2 via `next/font/local` with preload (replaces the runtime Google CJK slices, ~748 KB unpreloaded today).

- [ ] **Step 1: Full test suite and build**

Run: `npm test && npm run build`
Expected: all tests pass; build pre-renders `/`, `/projects`, `/projects/trajecta`, `/music`, one music detail page, `/about`, `/minesweeper`.

- [ ] **Step 2: Manual pass on `npm run dev`**

- Board: reveal, flag, chord, lose (shake + reset with sections kept), win.
- Every spine link works from every page; active link is vermilion.
- Mobile width (devtools): top bar replaces spine, flag-mode toggle appears, board fits.
- Keyboard: tab to board, arrows move focus, Enter reveals, F flags.
- OS reduced-motion enabled: no shake, no hover-grow.

- [ ] **Step 3: Report the content checklist to Yiming** (everything marked `REPLACE:`)

- Trajecta blurb, tech list, case-study paragraphs, GitHub link; second project (or remove it).
- Music pieces: real titles, instrumentation, years; audio files into `public/audio/`; program notes.
- About: the three section paragraphs.
- Footer: GitHub username, LinkedIn slug. `public/cv.pdf`.
- Confirm 轨迹 as Trajecta's hanzi, and the seal character 贾.

- [ ] **Step 4: Commit any fixes, then deploy preview to Vercel** (requires Yiming's logged-in Vercel CLI; skip if not authenticated and note it)

```bash
git add -A && git diff --cached --quiet || git commit -m "fix: verification pass fixes"
npx vercel
```

Expected: preview URL served; production promote (`npx vercel --prod`) only when Yiming says go.
