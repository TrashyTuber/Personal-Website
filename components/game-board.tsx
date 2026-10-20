'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
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
  /** Centre of the status bar — a string title, or a control (e.g. a selector). */
  title?: ReactNode;
  /**
   * BCP-47 tag for `title`. The default title is Latin, so this cannot be
   * hardcoded — callers passing hanzi (e.g. 扫雷) set `titleLang="zh-Hans"`.
   */
  titleLang?: string;
  /** A target time shown faint after the timer ("000.00 / 14.780"). */
  par?: string;
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
        className="font-display-sc text-[1.26em] font-normal motion-safe:animate-cell-pop"
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

/**
 * Classic chord preview: while both buttons (or the middle) are held, the
 * hidden tiles around the pointer sink, so the player sees which 3×3 the chord
 * covers — and, when a chord no-ops on a wrong flag count, where it looked.
 */
//
// Darken only, no inset shadow: a shadow is drawn per tile, which seams the
// 3×3 into nine boxes. A filter on gap-0 tiles reads as one dimmed patch.
const PRESSED = 'brightness-[0.8]';

function cellClass(cell: Cell, pressed: boolean): string {
  // `relative` + `focus-visible:z-10` so the focus ring is not clipped by the
  // neighbouring cells it now touches (the grid has no gap).
  const base =
    'relative flex aspect-square select-none touch-manipulation items-center justify-center font-mono-game font-medium outline-none [-webkit-touch-callout:none] focus-visible:z-10 focus-visible:ring-1 focus-visible:ring-vermilion';
  // Revealed terrain has no face of its own: the numbers float on the page ink.
  // The hairline-thin inset is a spatial reference only, and is meant to sit
  // just at the edge of visibility.
  const revealed = `${base} shadow-[inset_0_0_0_0.5px_rgba(232,228,220,0.05)]`;
  if (cell.state === 'revealed' && cell.section) {
    // Glow on the glyph, not on a box — the boxed tile is what we're shedding.
    return `${revealed} cursor-point text-vermilion`;
  }
  // Everything else on the board is chosen, not followed: 「」 corner brackets.
  if (cell.state === 'revealed') return `${revealed} cursor-aim`;
  // No scale transform on hover: it would tear the merged region apart. A face
  // lighten reads as the same mass responding instead — as a filter rather than
  // a second background colour, so the plain and flagged faces lighten by the
  // same amount without a hand-tuned hover colour for each.
  const unrevealed = `${base} cursor-aim transition-[filter] hover:brightness-125 motion-reduce:transition-none active:brightness-[0.8] active:shadow-[inset_0_2px_8px_rgba(0,0,0,0.45)] ${
    pressed && cell.state === 'hidden' ? PRESSED : ''
  }`;
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
  par,
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
  /** Centre of the held chord's 3×3 preview; null when no chord is held. */
  const [chordAt, setChordAt] = useState<number | null>(null);
  /**
   * Whether a chord hold may still be in progress. A ref, not chordAt, gates
   * the hover handler: chordAt clears when the pointer leaves the board, and
   * the preview must pick back up if it re-enters with the buttons still down.
   */
  const chordHeld = useRef(false);
  /** Bumped on reset to remount the Timer back at zero. */
  const [runId, setRunId] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const longPress = useRef<{
    id: ReturnType<typeof setTimeout>;
    index: number;
  } | null>(null);
  /** Timestamp until which pointer events are treated as long-press fallout. */
  const suppressUntil = useRef(0);
  /**
   * Latched by a chord, cleared by the next fresh press. Releasing a chord
   * leaves behind a left release and up to one contextmenu, in an order that
   * varies by platform; all of it lands before the player's next press, so a
   * latch swallows exactly that fallout. (A time window here also ate the
   * player's own next flag when they chorded and flagged within it.)
   */
  const inChord = useRef(false);
  /**
   * Set when a right press has already flagged, so the contextmenu that
   * follows it (on press on macOS, on release on Windows) doesn't toggle the
   * flag straight back. Cleared by the next fresh press.
   */
  const flaggedOnPress = useRef(false);
  /**
   * The last pointer to press a cell. Mouse reveals happen on mouseup (see
   * the cell's onMouseUp); taps keep the click path, since a touch device's
   * compat mouse events are not reliable enough to reveal on.
   */
  const lastPointer = useRef<string>('');
  /**
   * A left press began on a cell and has not been released yet. Only then
   * does a release reveal — a drag that starts off the board (a text
   * selection, say) must not open the tile it ends on.
   */
  const leftArmed = useRef(false);
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
      // commit only runs from pointer/keyboard handlers, never during render;
      // the clock read is the point (win timestamp).
      // eslint-disable-next-line react-hooks/purity
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
      // handleReveal only runs from pointer/keyboard handlers, never during
      // render; this stamps the run's start line.
      // eslint-disable-next-line react-hooks/purity
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

  // A release anywhere disarms the left press. React's handlers run at the
  // root, before this window listener, so a cell's own onMouseUp sees the
  // press still armed.
  useEffect(() => {
    const disarm = () => {
      leftArmed.current = false;
    };
    window.addEventListener('mouseup', disarm);
    return () => window.removeEventListener('mouseup', disarm);
  }, []);

  // The preview lasts exactly as long as the hold. Listening on window catches
  // a release outside the board, which the cells never see.
  useEffect(() => {
    if (chordAt === null) return;
    const release = () => {
      chordHeld.current = false;
      setChordAt(null);
    };
    window.addEventListener('mouseup', release);
    window.addEventListener('blur', release);
    return () => {
      window.removeEventListener('mouseup', release);
      window.removeEventListener('blur', release);
    };
  }, [chordAt]);

  const pressed = new Set<number>(
    chordAt === null ? [] : [chordAt, ...neighbors(board, chordAt)],
  );

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
            // titleLang is only ever set for hanzi titles (扫雷); Latin titles
            // (YIMING JIA) take the mono — English display left serif-land in
            // the typography round.
            className={`${titleLang ? 'font-display-sc' : 'font-mono-game'} tracking-[0.3em] text-paper`}
          >
            {title}
          </span>
          <span>
            <Timer
              key={runId}
              running={started && board.status === 'playing'}
              won={board.status === 'won'}
            />
            {par && (
              <span aria-label={`record ${par}`} className="text-faint">
                {' '}/ {par}
              </span>
            )}
          </span>
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
        onMouseLeave={() => setChordAt(null)}
        // gap-0: adjacent unrevealed cells must share an edge with no seam, so
        // a run of them reads as one region (see tileRadius).
        // Loss cue must contrast with the vermilion board face, so the flash
        // is seal-cream rather than vermilion-on-vermilion — drawn as an
        // outline, not a border, so it stays out of the width math below.
        className={`mx-auto mt-3 grid gap-0 ${
          shaking
            ? 'outline outline-1 outline-seal motion-safe:animate-board-shake'
            : ''
        }`}
        // Cell type scales with tile width — 38% of one tile (100cqw/cols),
        // clamped so tiny boards stay legible and big tiles don't balloon.
        // The cqw resolves against the wrapper div's container-type above.
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          fontSize: `clamp(13px, ${(38 / cols).toFixed(3)}cqw, 18px)`,
          // Quantize to whole-pixel tiles: at fluid widths a fractional tile
          // height slips a device pixel every few rows and the page ink shows
          // through as dashed seams. Browsers without CSS round() drop this
          // declaration and merely keep those (rare, cosmetic) seams.
          width: `calc(round(down, 100cqw / ${cols}, 1px) * ${cols})`,
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
              className={cellClass(cell, pressed.has(i))}
              style={
                cell.state === 'revealed'
                  ? undefined
                  : { borderRadius: tileRadius(board, i) }
              }
              onPointerDown={(e) => {
                lastPointer.current = e.pointerType;
              }}
              onMouseDown={(e) => {
                // Classic simultaneous chording: both buttons down at once.
                // `buttons` is the full mask, so this catches either press
                // order. Middle-click is the one-handed equivalent.
                if (e.buttons === 3 || e.button === 1) {
                  e.preventDefault(); // middle-click autoscroll
                  inChord.current = true;
                  handleChord(i);
                  chordHeld.current = true;
                  setChordAt(i);
                  return;
                }
                // A fresh press: any earlier gesture's fallout has landed.
                inChord.current = false;
                flaggedOnPress.current = false;
                leftArmed.current = e.button === 0;
                if (e.button === 2) {
                  // Flag on the press, as the classic game does — not on
                  // contextmenu, which Windows only fires on release.
                  // Right-then-left needs no extra care: a chord target is
                  // revealed, and toggleFlag no-ops on revealed cells.
                  flaggedOnPress.current = true;
                  handleFlag(i);
                }
              }}
              onMouseUp={(e) => {
                // Reveal on release, on whatever cell is under the pointer.
                // A click only fires when press and release land on the same
                // cell, so a fast hand drifting over a border lost the reveal.
                if (lastPointer.current !== 'mouse') return;
                if (e.button !== 0 || e.ctrlKey) return; // ⌃-click flags on macOS
                if (inChord.current || !leftArmed.current) return;
                leftArmed.current = false;
                handleReveal(i);
              }}
              onMouseEnter={(e) => {
                // The preview follows the pointer while the chord is held, as
                // in the classic game. Re-check the mask: a release we missed
                // must not leave the preview stuck on.
                if (!chordHeld.current) return;
                const held = e.buttons === 3 || e.buttons === 4;
                chordHeld.current = held;
                setChordAt(held ? i : null);
              }}
              onClick={(e) => {
                // Mouse clicks were already handled on mouseup. detail 0 is a
                // click with no pointer behind it (screen reader activation).
                if (lastPointer.current === 'mouse' && e.detail !== 0) return;
                // Swallow the click a long-press synthesizes. The window
                // expires on its own, so a dropped click cannot strand it.
                if (Date.now() < suppressUntil.current) return;
                if (inChord.current) return;
                handleReveal(i);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                // Mobile fires contextmenu partway through the same hold we
                // already flagged on; a second toggle would undo that flag.
                if (Date.now() < suppressUntil.current) return;
                // Likewise for the right button we just chorded with, or one
                // whose press already placed the flag.
                if (inChord.current) return;
                if (flaggedOnPress.current) {
                  flaggedOnPress.current = false;
                  return;
                }
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
