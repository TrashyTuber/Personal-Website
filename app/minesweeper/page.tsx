import type { Metadata } from 'next';
import PlayableBoard from '@/components/playable-board';

export const metadata: Metadata = { title: '扫雷 Minesweeper — Yiming Jia' };

const TIMES = [
  { level: 'Expert', zh: '高级', grid: '30×16 · 99 mines', time: '52s' },
  { level: 'Intermediate', zh: '中级', grid: '16×16 · 40 mines', time: '14s' },
];

export default function MinesweeperPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="text-center">
        <p lang="zh-Hans" className="text-sm tracking-[0.6em] text-muted">
          个 人 最 佳
        </p>
        <h1 className="mt-2 text-4xl font-light">Personal Bests</h1>
        <div className="mx-auto mt-4 h-px w-16 bg-hairline-2" />
      </div>
      <div className="mt-10">
        {TIMES.map((row) => (
          <div
            key={row.level}
            className="flex items-baseline gap-4 border-b border-hairline py-4"
          >
            <span className="text-xl font-light">{row.level}</span>
            <span lang="zh-Hans" className="whitespace-nowrap text-sm text-muted">
              {row.zh}
            </span>
            <span className="flex-1" />
            {/* Four columns don't fit 375px: the grid spec is the one that can
                go, since the same numbers sit under the board below. */}
            <span className="hidden whitespace-nowrap font-mono-game text-sm text-faint sm:inline">
              {row.grid}
            </span>
            <span className="font-mono-game text-2xl text-vermilion-text">
              {row.time}
            </span>
          </div>
        ))}
      </div>

      {/*
        Two geometries, one per breakpoint: 16 columns inside 560px is ~20px a
        cell on a 375px phone, below any sane touch target. Board geometry is
        read once at mount, so these have to be separate instances — the hidden
        one is display:none, which also keeps it out of the a11y tree.
      */}
      <div className="mt-16 hidden flex-col items-center md:flex">
        <p className="mb-6 font-mono-game text-xs tracking-[0.2em] text-faint">
          YOUR TURN — 16×16 · 40 MINES
        </p>
        <PlayableBoard
          key="desktop"
          rows={16}
          cols={16}
          mineCount={40}
          title="扫雷"
          titleLang="zh-Hans"
          className="max-w-[640px]"
        />
      </div>
      <div className="mt-16 flex flex-col items-center md:hidden">
        <p className="mb-6 font-mono-game text-xs tracking-[0.2em] text-faint">
          YOUR TURN — 10×10 · 12 MINES
        </p>
        <PlayableBoard
          key="mobile"
          rows={10}
          cols={10}
          mineCount={12}
          title="扫雷"
          titleLang="zh-Hans"
          className="max-w-[420px]"
        />
      </div>
    </div>
  );
}
