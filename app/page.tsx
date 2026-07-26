import Duilian from '@/components/duilian';
import HomeBoard from '@/components/home-board';
import type { SectionSpec } from '@/lib/minesweeper/types';

const COLS = 12;
const at = (row: number, col: number) => row * COLS + col;

// LAYOUT CONSTRAINT: a section's *neighbourhood* — its cells plus every cell
// orthogonally or diagonally adjacent to them, i.e. one ring wider than the
// pair below — must never span a full row or column. A found section opens as
// that whole patch (whether restored from sessionStorage or uncovered this
// session), revealed terrain acts as a flood-fill wall, and a spanning wall
// would strand the region behind it (see engine reveal semantics).
//
// These pairs are horizontal, so each clearing is 4 cols x 3 rows: never 12
// wide, never 8 tall.
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
// Same LAYOUT CONSTRAINT as above, and tighter here: a horizontal pair opens a
// clearing 4 columns wide, which is half of this 8-wide board — cols 4-7 for
// the pairs at cols 5-6, cols 1-4 for music, cols 0-3 for about. Half is not a
// wall, and 3 rows of 12 never is either; but widening a pair to three cells
// would put a clearing 5 of 8 columns across, so don't.
const MOBILE_HOME_SECTIONS: SectionSpec[] = [
  { id: 'projects', href: '/projects', label: 'Projects', glyphs: ['项', '目'], cells: [atM(1, 5), atM(1, 6)] },
  { id: 'music', href: '/music', label: 'Music', glyphs: ['音', '乐'], cells: [atM(4, 2), atM(4, 3)] },
  { id: 'minesweeper', href: '/minesweeper', label: 'Minesweeper', glyphs: ['扫', '雷'], cells: [atM(7, 5), atM(7, 6)] },
  { id: 'about', href: '/about', label: 'About', glyphs: ['关', '于'], cells: [atM(10, 1), atM(10, 2)] },
];

export default function Home() {
  return (
    // flex-1: grow to main's exact height (main is a flex column), so the
    // inset-y-0 couplet bands run from the top of the screen to the footer
    // with no dead strip.
    <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-10">
      {/* The visible wordmark is a span inside the board's status strip, so the
          page's document outline needs its own heading. */}
      <h1 className="sr-only">Yiming Jia — 贾一茗</h1>
      {/*
        The couplet bands, hung the traditional way: 上联 on the right of the
        board, 下联 on the left. Anchored to the page wrapper, not the board
        block, so they run the full height of the screen and cut off at the
        footer. Only from xl up — below that they would crowd the board or
        reach the spine. Offsets are measured from the centred board's 640px
        edge, so the gap holds however wide the viewport gets.
      */}
      <Duilian
        side="left"
        hanzi="谈笑破局"
        className="absolute inset-y-0 right-[calc(50%+360px)] hidden xl:block"
      />
      <Duilian
        side="right"
        hanzi="方寸藏雷"
        className="absolute inset-y-0 left-[calc(50%+360px)] hidden xl:block"
      />
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
