import type { Metadata } from 'next';
import SweepingArena from '@/components/sweeping-arena';
import { SWEEP_RECORDS } from '@/content/sweeping';

export const metadata: Metadata = { title: 'Minesweeper — Yiming Jia' };

export default function MinesweeperPage() {
  return (
    <div className="py-16">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <p lang="zh-Hans" className="text-sm tracking-[0.6em] text-muted">
          个 人 最 佳
        </p>
        <h1 className="mt-2 text-4xl font-light">Personal Bests</h1>
        <div className="mx-auto mt-4 h-px w-16 bg-hairline-2" />
      </div>

      {/*
        Two instances, one per breakpoint (geometry props are read once at
        mount, and the sane touch floor differs): desktop defaults to the
        16×16 flagship with everything playable; mobile defaults to Beginner —
        the one authentic grid that clears ~36px touch targets on a phone —
        and shows Intermediate/Expert as records only. display:none keeps the
        hidden instance out of the a11y tree.
      */}
      <div className="mt-10 hidden md:block">
        <SweepingArena
          records={SWEEP_RECORDS}
          defaultDifficulty="intermediate"
          playable={['beginner', 'intermediate', 'expert']}
        />
      </div>
      <div className="mt-10 md:hidden">
        <SweepingArena
          records={SWEEP_RECORDS}
          defaultDifficulty="beginner"
          playable={['beginner']}
        />
      </div>
    </div>
  );
}
