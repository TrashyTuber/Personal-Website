# /minesweeper Three-Stele Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild /minesweeper around a three-stele record selector (Beginner/Intermediate/Expert with the owner's minesweeper.online times, ranks, percentiles) driving an authentic-geometry playable board with a record-aware status line and win restart.

**Architecture:** A static content module (`content/sweeping.ts`) feeds a client `SweepingArena` component that owns difficulty selection and renders `RecordSteles` (stele buttons) plus a remounting `GameBoard`. `GameBoard` gains two contained changes: an `onWin(elapsedMs)` callback and container-query-proportional cell type. `PlayableBoard` is superseded and removed.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind v4, vitest + Testing Library. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-07-26-minesweeper-page-redesign-design.md` — read it first.

**House rules that bind every task:** all four gates (`npm test`, `npm run typecheck`, `npx eslint .`, `npm run build`) before any commit that ends a task; commit but NEVER push; hanzi only with `lang="zh-Hans"` on the hanzi element itself, never on an element whose accessible name is Latin; all text ≥12px; focus ring = `focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-vermilion`.

---

### Task 1: Content module `content/sweeping.ts`

**Files:**
- Create: `content/sweeping.ts`
- Test: `content/sweeping.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// content/sweeping.test.ts
import { describe, expect, test } from 'vitest';
import {
  formatRank,
  formatTime,
  SWEEP_RECORDS,
  topPercent,
} from './sweeping';

describe('sweeping content', () => {
  test('topPercent keeps one significant figure', () => {
    expect(topPercent(4221, 5392830)).toBe('top 0.08%');
    expect(topPercent(344, 4015210)).toBe('top 0.009%');
    expect(topPercent(320, 3718430)).toBe('top 0.009%');
  });

  test('formatTime always shows milliseconds', () => {
    expect(formatTime(2.082)).toBe('2.082');
    expect(formatTime(14.78)).toBe('14.780');
  });

  test('formatRank groups thousands', () => {
    expect(formatRank(4221)).toBe('#4,221');
    expect(formatRank(344)).toBe('#344');
  });

  test('records carry authentic geometries', () => {
    expect(SWEEP_RECORDS.map((r) => [r.id, r.rows, r.cols, r.mines])).toEqual([
      ['beginner', 9, 9, 10],
      ['intermediate', 16, 16, 40],
      ['expert', 16, 30, 99],
    ]);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run content/sweeping.test.ts`
Expected: FAIL — cannot resolve `./sweeping`.

- [ ] **Step 3: Write the module**

```ts
// content/sweeping.ts
/**
 * The owner's minesweeper.online records — the /minesweeper page's entire
 * data source. All numbers are a manual snapshot (see RANKS_AS_OF); there is
 * no public API to pull them from, by design and by necessity.
 */
export interface SweepRecord {
  id: 'beginner' | 'intermediate' | 'expert';
  level: 'Beginner' | 'Intermediate' | 'Expert';
  /** Difficulty name as carved on the stele. Ornament only — English carries function. */
  zh: string;
  rows: number;
  cols: number;
  mines: number;
  /** Best time in seconds, exactly as minesweeper.online reports it. */
  timeSeconds: number;
  /** World rank on the all-time best-time leaderboard. */
  rank: number;
  /** Total ranked players at snapshot time — the percentile denominator. */
  playerCount: number;
}

export type DifficultyId = SweepRecord['id'];

export const PROFILE_URL = 'https://minesweeper.online/player/7108240';
export const RANKS_AS_OF = 'july 2026';
/** The stated goal from the owner's profile bio: sub-50 expert. */
export const SUB50_TARGET = 50;

export const SWEEP_RECORDS: SweepRecord[] = [
  {
    id: 'beginner',
    level: 'Beginner',
    zh: '初级',
    rows: 9,
    cols: 9,
    mines: 10,
    timeSeconds: 2.082,
    rank: 4221,
    playerCount: 5392830,
  },
  {
    id: 'intermediate',
    level: 'Intermediate',
    zh: '中级',
    rows: 16,
    cols: 16,
    mines: 40,
    timeSeconds: 14.78,
    rank: 344,
    playerCount: 4015210,
  },
  {
    id: 'expert',
    level: 'Expert',
    zh: '高级',
    rows: 16,
    cols: 30,
    mines: 99,
    timeSeconds: 52.803,
    rank: 320,
    playerCount: 3718430,
  },
];

/** "top 0.08%" — one significant figure, computed, never hand-typed. */
export function topPercent(rank: number, playerCount: number): string {
  const pct = (rank / playerCount) * 100;
  return `top ${Number(pct.toPrecision(1))}%`;
}

/** minesweeper.online shows milliseconds; so do we. */
export function formatTime(seconds: number): string {
  return seconds.toFixed(3);
}

export function formatRank(rank: number): string {
  return `#${rank.toLocaleString('en-US')}`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run content/sweeping.test.ts`
Expected: 4 passing.

- [ ] **Step 5: Commit**

```bash
git add content/sweeping.ts content/sweeping.test.ts
git commit -m "feat: sweeping records content module"
```

---

### Task 2: `GameBoard` reports win time via `onWin`

**Files:**
- Modify: `components/game-board.tsx` (props interface ~line 52-83, component body ~line 206-347)
- Test: `components/game-board.test.tsx` (append a test)

- [ ] **Step 1: Write the failing test** (append to the existing describe block in `components/game-board.test.tsx`, matching its existing imports/mocks — it already mocks `next/navigation`)

```tsx
test('onWin reports elapsed milliseconds on the winning move', () => {
  const onWin = vi.fn();
  render(<GameBoard rows={2} cols={2} mineCount={0} onWin={onWin} />);

  // 0 mines: first reveal floods the board and wins immediately.
  fireEvent.click(screen.getByRole('button', { name: 'cell 0,0' }));

  expect(onWin).toHaveBeenCalledTimes(1);
  const [elapsed] = onWin.mock.calls[0];
  expect(typeof elapsed).toBe('number');
  expect(elapsed).toBeGreaterThanOrEqual(0);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run components/game-board.test.tsx`
Expected: FAIL — `onWin` never called (prop silently ignored).

- [ ] **Step 3: Implement**

In `GameBoardProps`, after `onStatusChange`:

```ts
  /**
   * Notified once per run, on the winning move, with elapsed play time in
   * milliseconds (first reveal → win). Kept separate from the Timer leaf —
   * which owns the *displayed* clock — so pages can compute record deltas;
   * the two may differ by a display tick.
   */
  onWin?: (elapsedMs: number) => void;
```

Destructure `onWin` in the component signature. Add a ref beside the other refs:

```ts
  /** Date.now() at the first reveal — the win delta's start line. */
  const startedAt = useRef(0);
```

In `handleReveal`, replace `if (!started) setStarted(true);` with:

```ts
    if (!started) {
      startedAt.current = Date.now();
      setStarted(true);
    }
```

In `commit`, after `onStatusChange?.(settled.status);`:

```ts
    if (settled.status === 'won') {
      onWin?.(Date.now() - startedAt.current);
    }
```

- [ ] **Step 4: Run the full board suite**

Run: `npx vitest run components/game-board.test.tsx`
Expected: all passing, including the new test.

- [ ] **Step 5: Commit**

```bash
git add components/game-board.tsx components/game-board.test.tsx
git commit -m "feat: GameBoard onWin callback with elapsed ms"
```

---

### Task 3: Proportional cell type in `GameBoard`

Cell numerals/glyphs currently use fixed sizes (`text-[13px] md:text-[15px]`, glyphs `text-[16px] md:text-[19px]`) regardless of tile size — a 12-col homepage board and a 30-col expert board get identical type. Make type scale with tile width via container queries. CSS-only; no new unit test — the existing suite guards behavior, owner verifies visually.

**Files:**
- Modify: `components/game-board.tsx` (root div ~line 423, `cellClass` base ~line 155, glyph span in `cellContent` ~line 108, grid style ~line 465)

- [ ] **Step 1: Make the board wrapper a query container**

Root div (line ~423) becomes:

```tsx
    <div className={`w-full [container-type:inline-size] ${className}`}>
```

- [ ] **Step 2: Scale the grid's font with tile width**

The grid's inline style (line ~465) gains a fontSize — 38% of one tile (one tile = `100cqw / cols`), clamped so small boards stay legible and the homepage doesn't balloon:

```tsx
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          fontSize: `clamp(13px, ${(38 / cols).toFixed(3)}cqw, 20px)`,
        }}
```

- [ ] **Step 3: Let cells inherit**

In `cellClass`, remove `text-[13px]` and `md:text-[15px]` from the `base` string (keep everything else, including `font-mono-game` and `font-bold`).

In `cellContent`, the glyph span's classes `text-[16px] ... md:text-[19px]` become `text-[1.26em]` (glyphs sit at 1.26 × numeral size ≈ 48% of a tile):

```tsx
      <span
        lang="zh-Hans"
        className="font-serif-sc text-[1.26em] font-normal motion-safe:animate-cell-pop"
      >
```

- [ ] **Step 4: Run the full test suite**

Run: `npm test`
Expected: all green (this change is styling-only; any failure means a test asserted a class string — update that assertion to match).

- [ ] **Step 5: Sanity math check** (no code — verify these in the browser during Task 7)

| Board | width/cols | computed size |
|---|---|---|
| Homepage desktop 640px/12 | 3.167cqw → 20.3px | clamps to 20px (was 15px — intended gain) |
| Intermediate 640px/16 | 15.2px | |
| Beginner 432px/9 | 18.2px | |
| Expert 1140px/30 | 14.4px | |
| Mobile beginner 360px/9 | 15.2px | |

- [ ] **Step 6: Commit**

```bash
git add components/game-board.tsx
git commit -m "feat: board cell type scales with tile size via container query"
```

---

### Task 4: `RecordSteles` selector component

**Files:**
- Create: `components/record-steles.tsx`
- Test: `components/record-steles.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// components/record-steles.test.tsx
import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import RecordSteles from './record-steles';
import { SWEEP_RECORDS } from '@/content/sweeping';

describe('RecordSteles', () => {
  test('renders one pressed button per record, English name carrying the label', () => {
    render(
      <RecordSteles
        records={SWEEP_RECORDS}
        selected="intermediate"
        onSelect={() => {}}
      />,
    );

    const beginner = screen.getByRole('button', { name: /Beginner — 2\.082 seconds, world rank 4,221/ });
    const intermediate = screen.getByRole('button', { name: /Intermediate — 14\.780 seconds, world rank 344/ });
    expect(beginner).toHaveAttribute('aria-pressed', 'false');
    expect(intermediate).toHaveAttribute('aria-pressed', 'true');
    // Percentile is visible text on every stele.
    expect(screen.getByText('#4,221 · top 0.08%')).toBeInTheDocument();
  });

  test('hanzi is marked zh-Hans on its own span, not on the button', () => {
    render(
      <RecordSteles records={SWEEP_RECORDS} selected="beginner" onSelect={() => {}} />,
    );
    const hanzi = screen.getByText('初级');
    expect(hanzi).toHaveAttribute('lang', 'zh-Hans');
    expect(hanzi.closest('button')).not.toHaveAttribute('lang');
  });

  test('clicking a stele reports its id', () => {
    const onSelect = vi.fn();
    render(
      <RecordSteles records={SWEEP_RECORDS} selected="beginner" onSelect={onSelect} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Expert/ }));
    expect(onSelect).toHaveBeenCalledWith('expert');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run components/record-steles.test.tsx`
Expected: FAIL — cannot resolve `./record-steles`.

- [ ] **Step 3: Implement**

```tsx
// components/record-steles.tsx
import type { DifficultyId, SweepRecord } from '@/content/sweeping';
import { formatRank, formatTime, topPercent } from '@/content/sweeping';

export interface RecordStelesProps {
  records: SweepRecord[];
  selected: DifficultyId;
  onSelect: (id: DifficultyId) => void;
}

/**
 * Three stele inscriptions (碑) that are also the difficulty selector:
 * vertical hanzi in the duilian's register, the English name carrying the
 * accessible label, the record time as the loudest line. The selected stele
 * is the one with the ink still wet — vermilion rule, full-strength text.
 */
export default function RecordSteles({
  records,
  selected,
  onSelect,
}: RecordStelesProps) {
  return (
    <div className="flex justify-center">
      {records.map((r) => {
        const active = r.id === selected;
        return (
          <button
            key={r.id}
            type="button"
            aria-pressed={active}
            // The hanzi is ornament; the whole stele reads out in English.
            aria-label={`${r.level} — ${formatTime(r.timeSeconds)} seconds, world rank ${r.rank.toLocaleString('en-US')}`}
            onClick={() => onSelect(r.id)}
            className="relative flex flex-col items-center gap-3 border-r border-hairline px-6 pb-5 pt-7 transition-colors last:border-r-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-vermilion sm:px-9"
          >
            {active && (
              <span
                aria-hidden="true"
                className="absolute inset-x-5 top-0 h-[2px] bg-vermilion"
              />
            )}
            <span
              lang="zh-Hans"
              className={`font-serif-sc text-3xl font-light leading-none tracking-[0.22em] [writing-mode:vertical-rl] ${
                active ? 'text-paper/85' : 'text-paper/25'
              }`}
            >
              {r.zh}
            </span>
            <span
              className={`font-mono-game text-xs uppercase tracking-[0.2em] ${
                active ? 'text-paper' : 'text-faint'
              }`}
            >
              {r.level}
            </span>
            <span
              className={`font-mono-game text-2xl ${
                active ? 'text-vermilion-text' : 'text-muted'
              }`}
            >
              {formatTime(r.timeSeconds)}
            </span>
            <span
              className={`whitespace-nowrap font-mono-game text-xs ${
                active ? 'text-muted' : 'text-faint'
              }`}
            >
              {formatRank(r.rank)} · {topPercent(r.rank, r.playerCount)}
            </span>
            <span className="whitespace-nowrap font-mono-game text-xs text-faint">
              {r.cols}×{r.rows} · {r.mines} mines
            </span>
          </button>
        );
      })}
    </div>
  );
}
```

Note: grid spec prints as `cols×rows` (9×9, 16×16, 30×16) — minesweeper convention is width×height.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run components/record-steles.test.tsx`
Expected: 3 passing.

- [ ] **Step 5: Commit**

```bash
git add components/record-steles.tsx components/record-steles.test.tsx
git commit -m "feat: three-stele record selector"
```

---

### Task 5: `SweepingArena` client component

**Files:**
- Create: `components/sweeping-arena.tsx`
- Test: `components/sweeping-arena.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// components/sweeping-arena.test.tsx
import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import SweepingArena from './sweeping-arena';
import type { SweepRecord } from '@/content/sweeping';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Tiny mine-free geometries so wins are deterministic; record times chosen so
// a sub-second test win is always AHEAD of beginner and the delta math shows.
const TEST_RECORDS: SweepRecord[] = [
  { id: 'beginner', level: 'Beginner', zh: '初级', rows: 2, cols: 2, mines: 0, timeSeconds: 5, rank: 4221, playerCount: 5392830 },
  { id: 'intermediate', level: 'Intermediate', zh: '中级', rows: 2, cols: 3, mines: 0, timeSeconds: 14.78, rank: 344, playerCount: 4015210 },
  { id: 'expert', level: 'Expert', zh: '高级', rows: 3, cols: 3, mines: 0, timeSeconds: 52.803, rank: 320, playerCount: 3718430 },
];

const cellCount = () => screen.getAllByRole('button', { name: /^cell / }).length;

describe('SweepingArena', () => {
  test('default difficulty mounts, stele click swaps geometry and selection', () => {
    render(
      <SweepingArena
        records={TEST_RECORDS}
        defaultDifficulty="intermediate"
        playable={['beginner', 'intermediate', 'expert']}
      />,
    );
    expect(cellCount()).toBe(6); // 2×3
    expect(screen.getByText(/THE RECORD IS 14\.780/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Expert/ }));
    expect(cellCount()).toBe(9); // fresh 3×3 board
    expect(screen.getByRole('button', { name: /Expert/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/THE RECORD IS 52\.803/)).toBeInTheDocument();
  });

  test('win shows the delta line and SWEEP AGAIN resets the board', () => {
    render(
      <SweepingArena
        records={TEST_RECORDS}
        defaultDifficulty="beginner"
        playable={['beginner']}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'cell 0,0' }));

    // Instant test win is far AHEAD of the 5s record.
    expect(screen.getByText(/AHEAD OF THE RECORD/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /SWEEP AGAIN/ }));
    expect(screen.getByText(/THE RECORD IS 5\.000/)).toBeInTheDocument();
    // Fresh board: cells hidden again.
    expect(
      screen.getAllByRole('button', { name: /^cell / })[0],
    ).toHaveAttribute('data-state', 'hidden');
  });

  test('non-playable difficulty shows the record but no board', () => {
    render(
      <SweepingArena
        records={TEST_RECORDS}
        defaultDifficulty="beginner"
        playable={['beginner']}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Expert/ }));
    expect(screen.queryByRole('group', { name: 'Minesweeper board' })).not.toBeInTheDocument();
    expect(screen.getByText(/WANTS A WIDER SCREEN/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run components/sweeping-arena.test.tsx`
Expected: FAIL — cannot resolve `./sweeping-arena`.

- [ ] **Step 3: Implement**

```tsx
// components/sweeping-arena.tsx
'use client';

import { useState, type ReactNode } from 'react';
import GameBoard from '@/components/game-board';
import RecordSteles from '@/components/record-steles';
import type { DifficultyId, SweepRecord } from '@/content/sweeping';
import {
  formatTime,
  PROFILE_URL,
  RANKS_AS_OF,
  SUB50_TARGET,
} from '@/content/sweeping';
import type { GameStatus } from '@/lib/minesweeper/types';

export interface SweepingArenaProps {
  records: SweepRecord[];
  defaultDifficulty: DifficultyId;
  /** Difficulties this instance lets a visitor actually play (touch targets). */
  playable: DifficultyId[];
}

/**
 * Board max-widths per difficulty. Intermediate keeps homepage parity (40px
 * tiles at 640px); Beginner goes chunkier; Expert breaks out of the text
 * column but never under the 88px spine + 24px gutters (136px total).
 */
const BOARD_WIDTH: Record<DifficultyId, string> = {
  beginner: 'max-w-[432px]',
  intermediate: 'max-w-[640px]',
  expert: 'max-w-[min(1140px,calc(100vw-136px))]',
};

/**
 * The whole /minesweeper interactive: stele selector, colophon, and the
 * arena where the selected record's board mounts. Difficulty changes and
 * SWEEP AGAIN both remount GameBoard via key — the sanctioned path, since
 * board geometry is read once at mount.
 */
export default function SweepingArena({
  records,
  defaultDifficulty,
  playable,
}: SweepingArenaProps) {
  const [selected, setSelected] = useState<DifficultyId>(defaultDifficulty);
  const [status, setStatus] = useState<GameStatus>('playing');
  const [winMs, setWinMs] = useState<number | null>(null);
  /** Bumped by SWEEP AGAIN to remount a fresh board of the same difficulty. */
  const [runId, setRunId] = useState(0);

  const record = records.find((r) => r.id === selected) ?? records[0];
  const expert = records.find((r) => r.id === 'expert') ?? records[0];
  const isPlayable = playable.includes(record.id);

  function select(id: DifficultyId) {
    setSelected(id);
    setStatus('playing');
    setWinMs(null);
  }

  function sweepAgain() {
    setRunId((n) => n + 1);
    setStatus('playing');
    setWinMs(null);
  }

  // The visible half of the board's win/loss signal (GameBoard's own cue is
  // an sr-only live region + frozen timer). Same pattern PlayableBoard used;
  // deliberately a plain <p> — a second live region would double-announce.
  let statusLine: ReactNode;
  if (!isPlayable) {
    statusLine = <>THIS BOARD WANTS A WIDER SCREEN — THE RECORD STANDS</>;
  } else if (status === 'won' && winMs !== null) {
    const yours = winMs / 1000;
    const delta = Math.abs(yours - record.timeSeconds).toFixed(2);
    const side = yours > record.timeSeconds ? 'BEHIND' : 'AHEAD OF';
    statusLine = (
      <>
        ✓ {yours.toFixed(2)} — {delta} {side} THE RECORD ·{' '}
        <button
          type="button"
          onClick={sweepAgain}
          className="underline underline-offset-4 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-vermilion"
        >
          SWEEP AGAIN
        </button>
      </>
    );
  } else if (status === 'lost') {
    statusLine = <>✕ MINE — RESETTING</>;
  } else {
    statusLine = (
      <>THE RECORD IS {formatTime(record.timeSeconds)} — THE TIMER STOPS WHEN YOU WIN</>
    );
  }

  return (
    <div className="w-full">
      <div className="mx-auto max-w-2xl px-6">
        <RecordSteles records={records} selected={selected} onSelect={select} />
        <p className="mt-6 text-center font-mono-game text-xs text-faint">
          chasing sub-50 expert · {(expert.timeSeconds - SUB50_TARGET).toFixed(3)} to go ·{' '}
          <a
            href={PROFILE_URL}
            target="_blank"
            rel="noreferrer"
            className="text-muted underline underline-offset-4 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-vermilion"
          >
            minesweeper.online ↗
          </a>
        </p>
      </div>

      <div className="mt-12 flex flex-col items-center px-6">
        {isPlayable && (
          <GameBoard
            key={`${selected}-${runId}`}
            rows={record.rows}
            cols={record.cols}
            mineCount={record.mines}
            title="扫雷"
            titleLang="zh-Hans"
            className={BOARD_WIDTH[record.id]}
            onStatusChange={setStatus}
            onWin={setWinMs}
          />
        )}
        <p
          className={`mt-5 text-center font-mono-game text-xs tracking-[0.2em] ${
            status === 'playing' || !isPlayable ? 'text-faint' : 'text-vermilion-text'
          }`}
        >
          {statusLine}
        </p>
      </div>

      <p className="mt-10 text-center font-mono-game text-xs text-faint/70">
        ranks as of {RANKS_AS_OF}
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run components/sweeping-arena.test.tsx`
Expected: 3 passing.

- [ ] **Step 5: Commit**

```bash
git add components/sweeping-arena.tsx components/sweeping-arena.test.tsx
git commit -m "feat: SweepingArena — stele-driven difficulty arena"
```

---

### Task 6: Rewrite the page, remove `PlayableBoard`

**Files:**
- Modify: `app/minesweeper/page.tsx` (full rewrite)
- Delete: `components/playable-board.tsx`, `components/playable-board.test.tsx`

- [ ] **Step 1: Rewrite the page**

```tsx
// app/minesweeper/page.tsx
import type { Metadata } from 'next';
import SweepingArena from '@/components/sweeping-arena';
import { SWEEP_RECORDS } from '@/content/sweeping';

export const metadata: Metadata = { title: 'Minesweeper — Yiming Jia' };

export default function MinesweeperPage() {
  return (
    <div className="py-16">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <p lang="zh-Hans" className="text-sm tracking-[0.6em] text-muted">
          个 人 最 佳
        </p>
        <h1 className="mt-2 text-4xl font-light">Personal Bests</h1>
        <div className="mx-auto mt-4 h-px w-16 bg-hairline-2" />
      </div>

      {/*
        Two instances, one per breakpoint (geometry props are read once at
        mount, and the sane touch floor differs): desktop defaults to the
        16×16 flagship with everything playable; mobile defaults to Beginner —
        the one authentic grid that clears ~36px touch targets on a phone —
        and shows Intermediate/Expert as records only. display:none keeps the
        hidden instance out of the a11y tree.
      */}
      <div className="mt-10 hidden md:block">
        <SweepingArena
          records={SWEEP_RECORDS}
          defaultDifficulty="intermediate"
          playable={['beginner', 'intermediate', 'expert']}
        />
      </div>
      <div className="mt-10 md:hidden">
        <SweepingArena
          records={SWEEP_RECORDS}
          defaultDifficulty="beginner"
          playable={['beginner']}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Delete the superseded component**

```bash
git rm components/playable-board.tsx components/playable-board.test.tsx
```

- [ ] **Step 3: Check nothing else imports it**

Run: `grep -rn "playable-board" app components lib content --include=*.ts*`
Expected: no matches.

- [ ] **Step 4: Run all four gates**

```bash
npm test && npm run typecheck && npx eslint . && npm run build
```

Expected: all green; build output shows every route prerendered (○/●, no ƒ).

- [ ] **Step 5: Commit**

```bash
git add app/minesweeper/page.tsx
git commit -m "feat: /minesweeper — three-stele records page with difficulty arena"
```

---

### Task 7: Live verification round

**Files:** none (verification + local docs)

- [ ] **Step 1: Check the dev server** — one usually already runs on :3000, externally owned; do NOT kill or restart it, and do NOT start a second one unless curl fails:

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/minesweeper
```

Expected: `200`. (Turbopack picks up the edits on its own.)

- [ ] **Step 2: SSR sanity** — the page's static shell should carry the records:

```bash
curl -s http://localhost:3000/minesweeper | grep -o -m1 "52.803"
curl -s http://localhost:3000/minesweeper | grep -o -m1 "top 0.009%"
curl -s http://localhost:3000/minesweeper | grep -o -m1 "chasing sub-50 expert"
```

Expected: each prints its match.

- [ ] **Step 3: Owner visual pass.** The in-app browser pane screenshots at a broken zoom in this project — ask Yiming to check at localhost:3000/minesweeper (he screenshots readily): stele row + selection, Expert breakout width at his window size, board number sizing (including the homepage board, which gains ~5px on numerals — Task 3 was a global change), mobile width via devtools, win line + SWEEP AGAIN, timer/flag behavior.

- [ ] **Step 4: Update local docs** (not committed — both gitignored): HANDOFF.md "where things stand" (+ open thread: owner says the stele treatment reads slightly Japanese to him — expect an iteration round on making it read more Chinese; candidate moves: seal-red hanzi on the selected stele, heavier serif weight, a seal-dot 印 mark, tighter tracking) and memory project file (minesweeper page redesigned; leaderboard + visitor-percentile comparison deferred).

- [ ] **Step 5: Hold.** Do NOT push — Vercel deploys on push. Yiming reviews locally and says when.
