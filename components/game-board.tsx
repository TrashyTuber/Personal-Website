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
/** How long the shake and ✕ stay up before the board resets after a loss. */
const RESET_DELAY_MS = 900;

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
  className?: string;
  /**
   * Notified whenever the run's status settles — 'won'/'lost' from a move, and
   * 'playing' again after the post-loss reset. The board's own win/loss signal
   * is an sr-only aria-live line and a frozen timer; this lets a page add
   * *visible* feedback without owning the game state.
   */
  onStatusChange?: (status: GameStatus) => void;
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
    'flex aspect-square select-none touch-manipulation items-center justify-center rounded-[2px] border font-mono-game text-[11px] font-bold outline-none [-webkit-touch-callout:none] focus-visible:ring-1 focus-visible:ring-vermilion';
  if (cell.state === 'revealed' && cell.section) {
    return `${base} border-vermilion/60 bg-surface text-vermilion shadow-[0_0_8px_rgba(194,59,34,0.35)] cursor-pointer`;
  }
  if (cell.state === 'revealed') {
    return `${base} border-hairline bg-surface`;
  }
  return `${base} border-hairline-2 bg-tile transition-transform motion-safe:hover:scale-[0.96]`;
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
  // Max width lives in this prop (not hardcoded) so callers can override it
  // without producing two conflicting Tailwind max-w-* classes.
  className = 'max-w-[420px]',
  onStatusChange,
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
  /** Set when a hold has flagged, cleared when the finger lifts. */
  const longPressFired = useRef(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // sessionStorage is client-only: restore found sections after mount. Reading
  // it in the state initializer instead would desync the server HTML from the
  // first client render, so the setState-in-effect is deliberate here.
  useEffect(() => {
    const found = loadFound(persistKey);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (found.length > 0) setBoard(makeBoard(found));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
      if (longPress.current) clearTimeout(longPress.current.id);
    },
    [],
  );

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
      try {
        window.sessionStorage.setItem(persistKey, JSON.stringify(found));
      } catch {
        // Safari private mode throws on write; the board plays on regardless.
      }
    }
    return { ...next, cells };
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
    if (!started) setStarted(true);
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
    <div className={`w-full ${className}`}>
      {showStatus && (
        <div className="flex items-center justify-between border-b border-hairline pb-2 font-mono-game text-xs text-muted">
          <span aria-label="mines remaining">
            ⚑ {String(remaining).padStart(3, '0')}
          </span>
          <span className="font-serif-sc tracking-[0.3em] text-paper">
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
        className={`mt-3 grid gap-[2px] border ${
          shaking
            ? 'border-vermilion motion-safe:animate-board-shake'
            : 'border-transparent'
        }`}
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
              onClick={() => {
                // Swallow the click a long-press synthesizes. The window
                // expires on its own, so a dropped click cannot strand it.
                if (Date.now() < suppressUntil.current) return;
                handleReveal(i);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                // Mobile fires contextmenu partway through the same hold we
                // already flagged on; a second toggle would undo that flag.
                if (Date.now() < suppressUntil.current) return;
                // If the platform menu beat our timer, this contextmenu *is*
                // the flag gesture — drop the pending hold so it cannot toggle
                // the flag straight back off. No suppression window here: on
                // desktop a right-click then left-click is legitimate.
                cancelLongPress(i);
                handleFlag(i);
              }}
              onDoubleClick={() => handleChord(i)}
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
