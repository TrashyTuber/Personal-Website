'use client';

import { useState } from 'react';
import Link from 'next/link';
import GameBoard, { type GameBoardProps } from '@/components/game-board';

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-vermilion';

/**
 * GameBoard plus an English cue for whatever has been uncovered. A found
 * section announces itself only as hanzi on the tiles (音乐, 关于…), which tells
 * a non-Chinese reader nothing about where the tile leads; this names each one
 * in English and repeats it as a plain link.
 *
 * Deliberately not a live region: GameBoard already owns the aria-live line,
 * and the tiles themselves now carry English accessible names.
 */
export default function HomeBoard(
  props: Omit<GameBoardProps, 'onFoundChange'>,
) {
  const [found, setFound] = useState<string[]>([]);
  // Filtered out of `sections` rather than mapped over `found`, so the cue is
  // always in board order instead of the order the player happened to dig.
  const uncovered = (props.sections ?? []).filter((s) => found.includes(s.id));

  return (
    <>
      <GameBoard {...props} onFoundChange={setFound} />
      {/* Width comes from the caller's board className so the cue can never
          drift out of alignment with the grid it belongs to. */}
      {uncovered.length > 0 && (
        <p
          className={`mt-3 flex w-full flex-wrap items-baseline gap-x-4 gap-y-1 font-mono-game text-xs ${props.className ?? ''}`}
        >
          <span className="text-faint">uncovered:</span>
          {uncovered.map((section) => (
            <Link
              key={section.id}
              href={section.href}
              className={`text-vermilion-text transition-colors hover:text-paper ${FOCUS_RING}`}
            >
              {section.label ?? section.id} →
            </Link>
          ))}
        </p>
      )}
    </>
  );
}
