'use client';

import { useState } from 'react';
import GameBoard, { type GameBoardProps } from '@/components/game-board';
import type { GameStatus } from '@/lib/minesweeper/types';

const LINES: Record<GameStatus, string> = {
  playing: 'CLEAR THE BOARD — THE TIMER STOPS WHEN YOU WIN',
  won: '✓ BOARD COMPLETE — TIMER FROZEN ON YOUR TIME',
  lost: '✕ MINE — RESETTING',
};

/**
 * GameBoard plus a visible status line. The board itself only reports a win
 * through an sr-only aria-live region and a frozen timer, which is invisible
 * feedback for a sighted player; this adds the visible half.
 *
 * Deliberately a plain <p>, not a live region: the board already owns the
 * aria-live announcement, and duplicating it here would make assistive tech
 * read every win and loss twice.
 */
export default function PlayableBoard(
  props: Omit<GameBoardProps, 'onStatusChange'>,
) {
  const [status, setStatus] = useState<GameStatus>('playing');

  return (
    <>
      <GameBoard {...props} onStatusChange={setStatus} />
      <p
        className={`mt-5 text-center font-mono-game text-xs tracking-[0.2em] ${
          status === 'playing' ? 'text-faint' : 'text-vermilion-text'
        }`}
      >
        {LINES[status]}
      </p>
    </>
  );
}
