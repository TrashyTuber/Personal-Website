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
        THE RECORD IS {formatTime(record.timeSeconds)} — THE TIMER STOPS WHEN
        YOU WIN
      </>
    );
  }

  return (
    <div className="w-full">
      <div className="mx-auto max-w-2xl px-6">
        <RecordSteles records={records} selected={selected} onSelect={select} />
        <p className="mt-6 text-center font-mono-game text-xs text-faint">
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
            status === 'playing' || !isPlayable
              ? 'text-faint'
              : 'text-vermilion-text'
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
