'use client';

import { useState } from 'react';
import Link from 'next/link';
import GameBoard, { type GameBoardProps } from '@/components/game-board';

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-vermilion';

/**
 * GameBoard plus its rules line and an English cue for whatever has been
 * uncovered. A found
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
      {/* The rules sit directly under the board; the uncovered cue goes below
          them. Each HomeBoard instance lives inside a breakpoint-hidden
          wrapper, so both phrasings render and CSS picks one. */}
      <p className={`mt-3 w-full font-mono-game text-xs text-faint ${props.className ?? ''}`}>
        <span className="hidden md:inline">click reveal · right-click flag · left+right chord</span>
        <span className="md:hidden">tap reveal · long-press flag</span>
      </p>
      {/* Width comes from the caller's board className so the cue can never
          drift out of alignment with the grid it belongs to. Always rendered,
          with its height reserved (two lines on phones, where all four links
          wrap), so the first find doesn't shift the vertically centred board. */}
      <p
        aria-hidden={uncovered.length === 0 || undefined}
        className={`mt-3 flex min-h-9 w-full flex-wrap content-start items-baseline gap-x-4 gap-y-1 font-mono-game text-xs md:min-h-4 ${props.className ?? ''}`}
      >
        {uncovered.length > 0 && (
          <>
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
          </>
        )}
      </p>
    </>
  );
}
