'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import DifficultyTabs from '@/components/difficulty-tabs';
import GameBoard from '@/components/game-board';
import type { DifficultyId, SweepRecord } from '@/content/sweeping';
import {
  formatRank,
  formatTime,
  PROFILE_URL,
  RANKS_AS_OF,
  SUB50_TARGET,
  topPercent,
} from '@/content/sweeping';
import type { GameStatus } from '@/lib/minesweeper/types';
import {
  estimateStanding,
  fitLogNormal,
  formatStanding,
} from '@/lib/rank-model';

export interface SweepingArenaProps {
  records: SweepRecord[];
  defaultDifficulty: DifficultyId;
  /** Difficulties this instance lets a visitor actually play (touch targets). */
  playable: DifficultyId[];
}

/**
 * Board max-widths per difficulty: a width cap, the page's 24px gutters, and
 * a height bound so the whole board fits under the fold. 236px is everything
 * else on the page stacked vertically (site header + footer, padding, status
 * bar, the two lines under the board); the height bound is that remainder
 * times cols/rows. The 240px floor keeps tiny viewports playable (they scroll).
 */
const BOARD_WIDTH: Record<DifficultyId, string> = {
  beginner: 'max-w-[max(240px,min(432px,calc(100dvh-236px)))]',
  intermediate: 'max-w-[max(240px,min(640px,calc(100dvh-236px)))]',
  expert:
    'max-w-[max(240px,min(1140px,calc(100vw-48px),calc((100dvh-236px)*1.875)))]',
};

/**
 * The whole /minesweeper interactive. Everything lives in one strip: the
 * board's status bar carries the difficulty tabs and the record as par, and
 * one line under the board carries rank or the run's outcome. Difficulty
 * changes and SWEEP AGAIN both remount GameBoard via key — the sanctioned
 * path, since board geometry is read once at mount.
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
  const rootRef = useRef<HTMLDivElement>(null);
  /**
   * The tabs and the reset live inside the board's status bar, so pressing
   * either remounts the very button that has focus. Holds a selector for that
   * button's replacement, consumed after the remount.
   */
  const refocus = useRef<string | null>(null);

  const record = records.find((r) => r.id === selected) ?? records[0];
  const expert = records.find((r) => r.id === 'expert') ?? records[0];
  const isPlayable = playable.includes(record.id);

  useEffect(() => {
    if (!refocus.current) return;
    rootRef.current
      ?.querySelector<HTMLButtonElement>(refocus.current)
      ?.focus();
    refocus.current = null;
  }, [selected, runId]);

  // F2: the original Windows new-game key, still muscle memory for sweepers.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'F2') return;
      e.preventDefault();
      sweepAgain();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Modeled minesweeper.online standing for the visitor's win. Fitted per
  // render from the record's sampled anchors — five points through a linear
  // regression, far too cheap to memoize.
  const standingLine =
    status === 'won' && winMs !== null
      ? formatStanding(
          estimateStanding(
            winMs / 1000,
            fitLogNormal(record.rankAnchors, record.playerCount),
            record.playerCount,
          ),
          record.playerCount,
        )
      : null;

  function select(id: DifficultyId) {
    refocus.current = `[data-difficulty="${id}"]`;
    setSelected(id);
    setStatus('playing');
    setWinMs(null);
  }

  function sweepAgain() {
    setRunId((n) => n + 1);
    setStatus('playing');
    setWinMs(null);
  }

  const tabs = (
    <DifficultyTabs records={records} selected={selected} onSelect={select} />
  );
  // The smiley's successor: the centre of the bar, split from the tabs by a
  // hairline so it reads as an action, not a fourth difficulty.
  const controls = (
    <span className="flex items-center gap-1 sm:gap-5">
      {tabs}
      <span aria-hidden="true" className="hidden h-3 w-px bg-hairline-2 sm:block" />
      <button
        type="button"
        data-reset
        aria-label="New board"
        title="New board (F2)"
        onClick={() => {
          refocus.current = '[data-reset]';
          sweepAgain();
        }}
        className="-my-1 px-1 py-1 font-mono-game text-sm text-faint sm:px-1.5 transition-colors hover:text-paper focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-vermilion motion-reduce:transition-none"
      >
        ↻
      </button>
    </span>
  );
  const par = formatTime(record.timeSeconds);

  // The visible half of the board's win/loss signal (GameBoard's own cue is
  // an sr-only live region + frozen timer). Deliberately a plain <p> — the
  // board already owns the aria-live announcement, and a second live region
  // would make assistive tech read every win and loss twice.
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
      <>
        WORLD {formatRank(record.rank)} ·{' '}
        {topPercent(record.rank, record.playerCount).toUpperCase()}
      </>
    );
  }

  return (
    <div ref={rootRef} className="flex w-full flex-col items-center px-6">
      {isPlayable ? (
        <GameBoard
          key={`${selected}-${runId}`}
          rows={record.rows}
          cols={record.cols}
          mineCount={record.mines}
          title={controls}
          par={par}
          className={BOARD_WIDTH[record.id]}
          onStatusChange={setStatus}
          onWin={setWinMs}
        />
      ) : (
        // No board to host the bar, so draw the same bar bare: the tabs stay
        // put and the record still reads as par.
        <div className="flex w-full max-w-[432px] items-center justify-between border-b border-hairline pb-2 font-mono-game text-sm text-muted">
          <span aria-hidden="true">
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-current" />
            ———
          </span>
          {tabs}
          <span className="text-faint">{par}</span>
        </div>
      )}
      <p
        className={`mt-4 text-center font-mono-game text-xs tracking-[0.2em] ${
          status === 'playing' || !isPlayable
            ? 'text-faint'
            : 'text-vermilion-text'
        }`}
      >
        {statusLine}
      </p>
      <p
        title={`ranks & standing model as of ${RANKS_AS_OF}`}
        className="mt-3 text-center font-mono-game text-xs text-faint"
      >
        {standingLine ?? (
          <>
            chasing sub-50 expert ·{' '}
            {(expert.timeSeconds - SUB50_TARGET).toFixed(3)} to go ·{' '}
            <a
              href={PROFILE_URL}
              target="_blank"
              rel="noreferrer"
              className="text-muted underline underline-offset-4 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-vermilion"
            >
              minesweeper.online ↗
            </a>
          </>
        )}
      </p>
    </div>
  );
}
