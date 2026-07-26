'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  checkWin,
  chord,
  createBoard,
  minesRemaining,
  neighbors,
  reveal,
  toggleFlag,
} from '@/lib/minesweeper/engine';
import type {
  Board,
  Cell,
  GameStatus,
  SectionSpec,
} from '@/lib/minesweeper/types';

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

/** Touch hold that counts as a flag gesture. */
const LONG_PRESS_MS = 450;
/**
 * How long after a long-press we ignore pointer events on any cell. Mobile
 * browsers follow a hold with a synthesized click *and* a contextmenu, and may
 * also drop the click entirely — so this is a self-expiring window rather than
 * a latch that a missing click could strand.
 */
const SUPPRESS_MS = 500;
/**
 * How long after a simultaneous-click chord we ignore clicks and contextmenus.
 * Releasing both buttons leaves behind up to one click and one contextmenu, and
 * the order varies by platform — so this is a window, not an event count.
 */
const CHORD_SUPPRESS_MS = 300;
/** How long the shake and ✕ stay up before the board resets after a loss. */
const RESET_DELAY_MS = 900;
/** Corner radius where the unrevealed mass ends. */
const TILE_RADIUS = '6px';

export interface GameBoardProps {
  // Board geometry is read once, when the initial board is built. Changing
  // rows/cols/mineCount/sections later requires remounting via a `key`.
  rows?: number;
  cols?: number;
  mineCount?: number;
  sections?: SectionSpec[];
  /** sessionStorage key for persisting found sections; omit to disable. */
  persistKey?: string;
  showStatus?: boolean;
  title?: string;
  /**
   * BCP-47 tag for `title`. The default title is Latin, so this cannot be
   * hardcoded — callers passing hanzi (e.g. 扫雷) set `titleLang="zh-Hans"`.
   */
  titleLang?: string;
  className?: string;
  /**
   * Notified whenever the run's status settles — 'won'/'lost' from a move, and
   * 'playing' again after the post-loss reset. The board's own win/loss signal
   * is an sr-only aria-live line and a frozen timer; this lets a page add
   * *visible* feedback without owning the game state.
   */
  onStatusChange?: (status: GameStatus) => void;
  /**
   * Notified with the ids of every section uncovered so far — after a move that
   * opens one, and once on mount if any were restored from sessionStorage. The
   * board itself can only say "found" in hanzi (the glyphs on the tiles), so
   * this lets a page render an English cue without owning the game state.
   */
  onFoundChange?: (ids: string[]) => void;
  /**
   * Notified once per run, on the winning move, with elapsed play time in
   * milliseconds (first reveal → win). Kept separate from the Timer leaf —
   * which owns the *displayed* clock — so pages can compute record deltas;
   * the two may differ by a display tick.
   */
  onWin?: (elapsedMs: number) => void;
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
    // A quiet seal-cream dot marks a flagged cell — a mark, not a symbol.
    return (
      <span className="block h-1.5 w-1.5 rounded-full bg-seal motion-safe:animate-cell-pop md:h-2 md:w-2" />
    );
  }
  if (cell.state !== 'revealed') return null;
  if (cell.mine) return <span className="text-vermilion motion-safe:animate-cell-pop">✕</span>;
  if (cell.glyph) {
    return (
      <span
        lang="zh-Hans"
        // 1.26em of the grid's tile-scaled size ≈ 48% of a tile.
        className="font-serif-sc text-[1.26em] font-normal motion-safe:animate-cell-pop"
      >
        {cell.glyph}
      </span>
    );
  }
  if (cell.adjacent > 0) {
    return <span className={`motion-safe:animate-cell-pop ${NUMBER_CLASSES[cell.adjacent]}`}>{cell.adjacent}</span>;
  }
  return null;
}

/**
 * Whether the cell at (row, col) is part of the unrevealed mass — flagged cells
 * included, since they keep the same tile face. Off-board reads as "not part of
 * it", which is what makes the board edge round the mass off.
 */
function merges(board: Board, row: number, col: number): boolean {
  if (row < 0 || row >= board.rows || col < 0 || col >= board.cols) return false;
  const state = board.cells[row * board.cols + col].state;
  return state === 'hidden' || state === 'flagged';
}

/**
 * Per-corner radius for one tile of the unrevealed mass, so a contiguous run of
 * tiles reads as a single rounded region rather than a row of boxes: a corner
 * is rounded only where *both* of the sides meeting there are region edges.
 *
 * Diagonal neighbours are deliberately ignored — honouring them would call for
 * inverted (concave) corners, which no border-radius can draw.
 */
function tileRadius(board: Board, index: number): string {
  const row = Math.floor(index / board.cols);
  const col = index % board.cols;
  const up = merges(board, row - 1, col);
  const down = merges(board, row + 1, col);
  const left = merges(board, row, col - 1);
  const right = merges(board, row, col + 1);
  const corner = (a: boolean, b: boolean) => (a || b ? '0' : TILE_RADIUS);
  // border-radius order: top-left, top-right, bottom-right, bottom-left.
  return `${corner(up, left)} ${corner(up, right)} ${corner(down, right)} ${corner(down, left)}`;
}

function cellClass(cell: Cell): string {
  // `relative` + `focus-visible:z-10` so the focus ring is not clipped by the
  // neighbouring cells it now touches (the grid has no gap).
  const base =
    'relative flex aspect-square select-none touch-manipulation items-center justify-center font-mono-game font-bold outline-none [-webkit-touch-callout:none] focus-visible:z-10 focus-visible:ring-1 focus-visible:ring-vermilion';
  // Revealed terrain has no face of its own: the numbers float on the page ink.
  // The hairline-thin inset is a spatial reference only, and is meant to sit
  // just at the edge of visibility.
  const revealed = `${base} shadow-[inset_0_0_0_0.5px_rgba(232,228,220,0.05)]`;
  if (cell.state === 'revealed' && cell.section) {
    // Glow on the glyph, not on a box — the boxed tile is what we're shedding.
    return `${revealed} cursor-pointer text-vermilion [text-shadow:0_0_10px_rgba(194,59,34,0.6)]`;
  }
  if (cell.state === 'revealed') return revealed;
  // No scale transform on hover: it would tear the merged region apart. A face
  // lighten reads as the same mass responding instead — as a filter rather than
  // a second background colour, so the plain and flagged faces lighten by the
  // same amount without a hand-tuned hover colour for each.
  const unrevealed = `${base} transition-[filter] hover:brightness-125 active:brightness-[0.8] active:shadow-[inset_0_2px_8px_rgba(0,0,0,0.45)] motion-reduce:transition-none`;
  // Flagged tiles sit a shade lighter so a flag reads at a glance on the mass.
  return cell.state === 'flagged'
    ? `${unrevealed} bg-[#a03119]`
    : `${unrevealed} bg-vermilion`;
}

/**
 * Leaf clock. It owns its own tick so the 100ms update re-renders one span
 * instead of every cell on the board. Mount it with a fresh `key` to restart
 * from zero.
 */
function Timer({ running, won }: { running: boolean; won: boolean }) {
  const [ms, setMs] = useState(0);

  useEffect(() => {
    if (!running) return;
    const start = Date.now();
    const id = setInterval(() => setMs(Date.now() - start), 100);
    return () => {
      clearInterval(id);
      // Sample once more when the clock stops, so a win freezes on the real
      // time instead of on whatever the last tick happened to catch.
      setMs(Date.now() - start);
    };
  }, [running]);

  return (
    <span
      aria-label="timer"
      className={won ? 'text-vermilion-text' : 'text-paper'}
    >
      {(ms / 1000).toFixed(2).padStart(6, '0')}
    </span>
  );
}

export default function GameBoard({
  rows = 8,
  cols = 12,
  mineCount = 15,
  sections = [],
  persistKey,
  showStatus = true,
  title = 'YIMING JIA',
  titleLang,
  // Max width lives in this prop (not hardcoded) so callers can override it
  // without producing two conflicting Tailwind max-w-* classes.
  className = 'max-w-[420px]',
  onStatusChange,
  onFoundChange,
  onWin,
}: GameBoardProps) {
  const router = useRouter();
  const makeBoard = (found: string[]): Board =>
    createBoard({ rows, cols, mineCount, sections, revealedSectionIds: found });

  const [board, setBoard] = useState<Board>(() => makeBoard([]));
  const [started, setStarted] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [flagMode, setFlagMode] = useState(false);
  const [focusIdx, setFocusIdx] = useState(0);
  /** Bumped on reset to remount the Timer back at zero. */
  const [runId, setRunId] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const longPress = useRef<{
    id: ReturnType<typeof setTimeout>;
    index: number;
  } | null>(null);
  /** Timestamp until which pointer events are treated as long-press fallout. */
  const suppressUntil = useRef(0);
  /** Timestamp until which pointer events are treated as chord fallout. */
  const chordSuppressUntil = useRef(0);
  /** Set when a hold has flagged, cleared when the finger lifts. */
  const longPressFired = useRef(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Date.now() at the first reveal — the win delta's start line. */
  const startedAt = useRef(0);

  // sessionStorage is client-only: restore found sections after mount. Reading
  // it in the state initializer instead would desync the server HTML from the
  // first client render, so the setState-in-effect is deliberate here.
  useEffect(() => {
    const found = loadFound(persistKey);
    if (found.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBoard(makeBoard(found));
      onFoundChange?.(found);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
      if (longPress.current) clearTimeout(longPress.current.id);
    },
    [],
  );

  /**
   * Fully open any section that was touched — its own cells *and* their whole
   * neighbourhood — and persist the found list. Opening the neighbourhood is
   * safe: placeMines forbids mines on a section cell or anything adjacent to
   * one, so every cell touched here is guaranteed mine-free. It is also what
   * makes a found section read as a cleared patch rather than a pair of glyphs
   * marooned in the unrevealed mass (createBoard restores it the same way).
   */
  function settleSections(next: Board): Board {
    if (sections.length === 0) return next;
    let settled = next;
    const found: string[] = [];
    for (const s of sections) {
      if (s.cells.some((i) => settled.cells[i].state === 'revealed')) {
        found.push(s.id);
        for (const i of s.cells) {
          // Opened through the engine, not by flipping state: reveal() flood-
          // expands any zero it opens, so the clearing can never end on a
          // revealed 0 that borders hidden terrain (an impossible board state
          // in minesweeper, and it reads as a rendering bug). Every cell here
          // is mine-free by construction, so no reveal can lose; reveal also
          // no-ops on flagged cells, which keeps the player's marks standing.
          settled = reveal(settled, i);
          for (const n of neighbors(settled, i)) {
            settled = reveal(settled, n);
          }
        }
      }
    }
    if (persistKey) {
      try {
        window.sessionStorage.setItem(persistKey, JSON.stringify(found));
      } catch {
        // Safari private mode throws on write; the board plays on regardless.
      }
    }
    // Fired unconditionally, like onStatusChange: a listener mirroring this
    // into state is idempotent, and `found` is rebuilt from scratch each time
    // so it is always the complete list, never a delta.
    onFoundChange?.(found);
    return settled;
  }

  function reset() {
    resetTimer.current = null;
    setBoard(makeBoard(loadFound(persistKey)));
    setStarted(false);
    setShaking(false);
    setRunId((n) => n + 1);
    onStatusChange?.('playing');
  }

  function commit(next: Board) {
    if (next === board) return; // no-op action: skip re-render + storage write
    // settleSections force-reveals section cells outside the engine, so the
    // win check must re-run afterward (checkWin no-ops on non-playing boards).
    const settled = checkWin(settleSections(next));
    setBoard(settled);
    // Fired unconditionally rather than only on a transition: a listener that
    // mirrors this into state is idempotent, and 'won' has to get through here
    // because nothing else runs after the winning move.
    onStatusChange?.(settled.status);
    if (settled.status === 'won') {
      onWin?.(Date.now() - startedAt.current);
    }
    if (settled.status === 'lost') {
      setShaking(true);
      resetTimer.current = setTimeout(reset, RESET_DELAY_MS);
    }
  }

  function handleReveal(index: number) {
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
      startedAt.current = Date.now();
      setStarted(true);
    }
    commit(reveal(board, index));
  }

  function handleFlag(index: number) {
    setBoard((b) => toggleFlag(b, index));
  }

  function handleChord(index: number) {
    commit(chord(board, index));
  }

  function cancelLongPress(index: number) {
    if (longPress.current?.index === index) {
      clearTimeout(longPress.current.id);
      longPress.current = null;
    }
  }

  /**
   * Shared by touchend and touchcancel. The click a hold synthesizes lands at
   * release, so the suppression window has to restart there — anchoring it to
   * when the hold fired lets any hold longer than SUPPRESS_MS through, and the
   * trailing click would then reveal the cell the user was un-flagging.
   */
  function endTouch(index: number, at: number) {
    cancelLongPress(index);
    if (longPressFired.current) {
      longPressFired.current = false;
      suppressUntil.current = at + SUPPRESS_MS;
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const dr = e.key === 'ArrowUp' ? -1 : e.key === 'ArrowDown' ? 1 : 0;
    const dc = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0;
    if (dr !== 0 || dc !== 0) {
      e.preventDefault();
      // Clamp each axis on its own: a flat index clamp would wrap rows
      // horizontally and jump to a corner vertically.
      setFocusIdx((i) => {
        const r = Math.min(rows - 1, Math.max(0, Math.floor(i / cols) + dr));
        const c = Math.min(cols - 1, Math.max(0, (i % cols) + dc));
        return r * cols + c;
      });
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleReveal(focusIdx);
    } else if (
      e.key.toLowerCase() === 'f' &&
      !e.metaKey &&
      !e.ctrlKey &&
      !e.altKey
    ) {
      // Bare "f" flags; ⌘F / Ctrl+F stay with the browser's find.
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
  const announcement =
    board.status === 'lost'
      ? 'mine hit — board reset'
      : board.status === 'won'
        ? 'board complete'
        : '';

  return (
    <div className={`w-full [container-type:inline-size] ${className}`}>
      {showStatus && (
        <div className="flex items-center justify-between border-b border-hairline pb-2 font-mono-game text-sm text-muted">
          <span aria-label="mines remaining">
            {/* bg-current: the dot borrows the surrounding text colour. */}
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-current" />
            {String(remaining).padStart(3, '0')}
          </span>
          <span
            lang={titleLang}
            className="font-serif-sc tracking-[0.3em] text-paper"
          >
            {title}
          </span>
          <Timer
            key={runId}
            running={started && board.status === 'playing'}
            won={board.status === 'won'}
          />
        </div>
      )}
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <div
        ref={gridRef}
        // Not role="grid": that needs row/gridcell wrappers, which would have
        // to use display:contents to keep the CSS grid intact — and those are
        // unreliably exposed to assistive tech. A labelled group of buttons
        // that each announce their coordinates is valid and much cheaper.
        role="group"
        aria-label="Minesweeper board"
        onKeyDown={onKeyDown}
        // gap-0: adjacent unrevealed cells must share an edge with no seam, so
        // a run of them reads as one region (see tileRadius).
        // Loss cue must contrast with the vermilion board face, so the flash
        // border is seal-cream rather than vermilion-on-vermilion.
        className={`mt-3 grid gap-0 border ${
          shaking
            ? 'border-seal motion-safe:animate-board-shake'
            : 'border-transparent'
        }`}
        // Cell type scales with tile width — 38% of one tile (100cqw/cols),
        // clamped so tiny boards stay legible and big tiles don't balloon.
        // The cqw resolves against the wrapper div's container-type above.
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          fontSize: `clamp(13px, ${(38 / cols).toFixed(3)}cqw, 20px)`,
        }}
      >
        {board.cells.map((cell, i) => {
          const row = Math.floor(i / cols);
          const col = i % cols;
          // An uncovered section tile is a link in all but name: its glyphs are
          // hanzi, so the coordinate label would leave a screen-reader user with
          // no idea what it opens. Hidden cells stay coordinates.
          const opens =
            cell.state === 'revealed' && cell.section
              ? (sections.find((s) => s.id === cell.section)?.label ??
                cell.section)
              : null;
          return (
            <button
              key={i}
              type="button"
              data-idx={i}
              data-state={cell.state}
              tabIndex={i === focusIdx ? 0 : -1}
              aria-label={
                opens ? `${opens} — uncovered, open page` : `cell ${row},${col}`
              }
              className={cellClass(cell)}
              style={
                cell.state === 'revealed'
                  ? undefined
                  : { borderRadius: tileRadius(board, i) }
              }
              onMouseDown={(e) => {
                // Classic simultaneous chording: both buttons down at once.
                // `buttons` is the full mask, so this catches either press
                // order. Middle-click is the one-handed equivalent.
                if (e.buttons === 3 || e.button === 1) {
                  e.preventDefault(); // middle-click autoscroll
                  chordSuppressUntil.current = Date.now() + CHORD_SUPPRESS_MS;
                  handleChord(i);
                }
                // Right-then-left needs no extra care: the contextmenu that
                // fired on the right press landed on this cell, and a chord
                // target is revealed — toggleFlag no-ops on revealed cells.
              }}
              onClick={() => {
                // Swallow the click a long-press synthesizes. The window
                // expires on its own, so a dropped click cannot strand it.
                if (Date.now() < suppressUntil.current) return;
                if (Date.now() < chordSuppressUntil.current) return;
                handleReveal(i);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                // Mobile fires contextmenu partway through the same hold we
                // already flagged on; a second toggle would undo that flag.
                if (Date.now() < suppressUntil.current) return;
                // Likewise for the right button we just chorded with.
                if (Date.now() < chordSuppressUntil.current) return;
                // If the platform menu beat our timer, this contextmenu *is*
                // the flag gesture — drop the pending hold so it cannot toggle
                // the flag straight back off. No suppression window here: on
                // desktop a right-click then left-click is legitimate.
                cancelLongPress(i);
                handleFlag(i);
              }}
              onTouchStart={() => {
                if (longPress.current) clearTimeout(longPress.current.id);
                suppressUntil.current = 0;
                longPressFired.current = false;
                const id = setTimeout(() => {
                  longPress.current = null;
                  // A revealed section tile navigates on tap, so a slow tap
                  // must stay a tap: no flag, no suppression. Reading `board`
                  // from this closure is safe because within one board
                  // generation a revealed cell never goes back to hidden
                  // (reset() builds a new board rather than mutating this one).
                  if (board.cells[i].state === 'revealed') return;
                  longPressFired.current = true;
                  // Covers a contextmenu fired mid-hold; endTouch re-anchors
                  // this window to the release that follows.
                  suppressUntil.current = Date.now() + SUPPRESS_MS;
                  handleFlag(i);
                }, LONG_PRESS_MS);
                longPress.current = { id, index: i };
              }}
              onTouchEnd={() => endTouch(i, Date.now())}
              onTouchCancel={() => endTouch(i, Date.now())}
              onTouchMove={() => cancelLongPress(i)}
            >
              {cellContent(cell)}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex justify-end md:hidden">
        <button
          type="button"
          aria-pressed={flagMode}
          onClick={() => setFlagMode((m) => !m)}
          className={`font-mono-game text-xs ${
            flagMode ? 'text-vermilion' : 'text-faint'
          }`}
        >
          <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-current" />
          flag mode {flagMode ? 'on' : 'off'}
        </button>
      </div>
    </div>
  );
}
