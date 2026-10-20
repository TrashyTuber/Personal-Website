import type { Metadata } from 'next';
import SweepingArena from '@/components/sweeping-arena';
import { SWEEP_RECORDS } from '@/content/sweeping';

export const metadata: Metadata = { title: 'Minesweeper — Yiming Jia' };

export default function MinesweeperPage() {
  return (
    <div className="py-6">
      {/* The nav already says SWEEP; the heading is for assistive tech and
          crawlers only, so the board gets the whole viewport. */}
      <h1 className="sr-only">Minesweeper personal bests</h1>

      {/*
        Two instances, one per breakpoint (geometry props are read once at
        mount, and the sane touch floor differs): desktop defaults to the
        16×16 flagship with everything playable; mobile defaults to Beginner —
        the one authentic grid that clears ~36px touch targets on a phone —
        and shows Intermediate/Expert as records only. display:none keeps the
        hidden instance out of the a11y tree.
      */}
      <div className="hidden md:block">
        <SweepingArena
          records={SWEEP_RECORDS}
          defaultDifficulty="intermediate"
          playable={['beginner', 'intermediate', 'expert']}
        />
      </div>
      <div className="md:hidden">
        <SweepingArena
          records={SWEEP_RECORDS}
          defaultDifficulty="beginner"
          playable={['beginner']}
        />
      </div>
    </div>
  );
}
