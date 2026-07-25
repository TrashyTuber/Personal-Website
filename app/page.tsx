import GameBoard from '@/components/game-board';
import type { SectionSpec } from '@/lib/minesweeper/types';

const COLS = 12;
const at = (row: number, col: number) => row * COLS + col;

// LAYOUT CONSTRAINT: section cells must never span a full row or column —
// revealed section cells (whether restored from sessionStorage or found this
// session) act as flood-fill walls, and a spanning wall would strand the
// region behind it (see engine reveal semantics).
const HOME_SECTIONS: SectionSpec[] = [
  { id: 'projects', href: '/projects', glyphs: ['项', '目'], cells: [at(1, 7), at(1, 8)] },
  { id: 'music', href: '/music', glyphs: ['音', '乐'], cells: [at(3, 4), at(3, 5)] },
  { id: 'minesweeper', href: '/minesweeper', glyphs: ['扫', '雷'], cells: [at(5, 9), at(5, 10)] },
  { id: 'about', href: '/about', glyphs: ['关', '于'], cells: [at(6, 2), at(6, 3)] },
];

export default function Home() {
  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-center px-4 py-10">
      <GameBoard sections={HOME_SECTIONS} persistKey="yj-found-sections" />
      <div className="mt-3 flex w-full max-w-[420px] justify-between font-mono-game text-[10px] text-faint">
        <span>click reveal · right-click flag · double-click chord</span>
        <span className="hidden text-muted md:inline">not a sweeper? use the spine ←</span>
      </div>
    </div>
  );
}
