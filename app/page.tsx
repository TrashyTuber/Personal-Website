import HomeBoard from '@/components/home-board';
import type { SectionSpec } from '@/lib/minesweeper/types';

const COLS = 12;
const at = (row: number, col: number) => row * COLS + col;

// LAYOUT CONSTRAINT: section cells must never span a full row or column —
// revealed section cells (whether restored from sessionStorage or found this
// session) act as flood-fill walls, and a spanning wall would strand the
// region behind it (see engine reveal semantics).
const HOME_SECTIONS: SectionSpec[] = [
  { id: 'projects', href: '/projects', label: 'Projects', glyphs: ['项', '目'], cells: [at(1, 7), at(1, 8)] },
  { id: 'music', href: '/music', label: 'Music', glyphs: ['音', '乐'], cells: [at(3, 4), at(3, 5)] },
  { id: 'minesweeper', href: '/minesweeper', label: 'Minesweeper', glyphs: ['扫', '雷'], cells: [at(5, 9), at(5, 10)] },
  { id: 'about', href: '/about', label: 'About', glyphs: ['关', '于'], cells: [at(6, 2), at(6, 3)] },
];

const MOBILE_COLS = 8;
const atM = (row: number, col: number) => row * MOBILE_COLS + col;

// The same four sections turned portrait — 8 wide by 12 tall, so a phone gets
// cells worth tapping instead of a squashed landscape grid.
//
// Same LAYOUT CONSTRAINT as above: no pair may span a full row or column. A
// horizontal 2-cell pair cannot span an 8-wide row, and none of these share a
// column, so both directions hold — but keep the rule in mind when moving them.
const MOBILE_HOME_SECTIONS: SectionSpec[] = [
  { id: 'projects', href: '/projects', label: 'Projects', glyphs: ['项', '目'], cells: [atM(1, 5), atM(1, 6)] },
  { id: 'music', href: '/music', label: 'Music', glyphs: ['音', '乐'], cells: [atM(4, 2), atM(4, 3)] },
  { id: 'minesweeper', href: '/minesweeper', label: 'Minesweeper', glyphs: ['扫', '雷'], cells: [atM(7, 5), atM(7, 6)] },
  { id: 'about', href: '/about', label: 'About', glyphs: ['关', '于'], cells: [atM(10, 1), atM(10, 2)] },
];

export default function Home() {
  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-center px-4 py-10">
      {/* The visible wordmark is a span inside the board's status strip, so the
          page's document outline needs its own heading. */}
      <h1 className="sr-only">Yiming Jia — 贾一茗</h1>
      {/*
        One geometry per breakpoint. Board geometry is read once at mount, so
        these have to be separate instances — the hidden one is display:none,
        which also keeps it out of the a11y tree and out of reach of clicks.
        They share a persistKey on purpose: sections found on one orientation
        stay found after a rotate or resize.
      */}
      <div className="hidden w-full flex-col items-center md:flex">
        <HomeBoard
          key="desktop"
          sections={HOME_SECTIONS}
          persistKey="yj-found-sections"
          className="max-w-[640px]"
        />
      </div>
      <div className="flex w-full flex-col items-center md:hidden">
        <HomeBoard
          key="mobile"
          rows={12}
          cols={MOBILE_COLS}
          sections={MOBILE_HOME_SECTIONS}
          persistKey="yj-found-sections"
          className="max-w-[420px]"
        />
      </div>
      <div className="mt-3 flex w-full max-w-[640px] justify-between font-mono-game text-xs text-faint">
        <span>click reveal · right-click flag · left+right chord</span>
        <span className="hidden text-muted md:inline">not a sweeper? use the spine ←</span>
      </div>
    </div>
  );
}
