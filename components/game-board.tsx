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

  // sessionStorage is client-only: restore found sections after mount. Reading
  // it in the state initializer instead would desync the server HTML from the
  // first client render, so the setState-in-effect is deliberate here.
  useEffect(() => {
    const found = loadFound(persistKey);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (found.length > 0) setBoard(makeBoard(found));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Date.now() is impure, so the clock start is recorded here rather than in
  // the click handler that flips `started`.
  useEffect(() => {
    if (started) startRef.current = Date.now();
  }, [started]);

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
    if (!started) setStarted(true);
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
