import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { createBoard, reveal } from '@/lib/minesweeper/engine';
import GameBoard from './game-board';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

beforeEach(() => {
  push.mockClear();
  window.sessionStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function cell(row: number, col: number): HTMLElement {
  return screen.getByRole('button', { name: `cell ${row},${col}` });
}

/**
 * An uncovered section tile trades its coordinate name for an English one, so
 * it can no longer be addressed by row/col.
 */
function sectionTile(name: string): HTMLElement {
  return screen.getByRole('button', { name: `${name} — uncovered, open page` });
}

const MUSIC = [{ id: 'music', href: '/music', glyphs: ['音'], cells: [4] }];

/** Advance fake timers inside act() so React flushes the resulting state. */
function tick(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

describe('GameBoard', () => {
  test('clicking a cell on a mine-free board flood-reveals everything', () => {
    render(<GameBoard rows={3} cols={3} mineCount={0} showStatus={false} />);
    fireEvent.click(cell(0, 0));
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        expect(cell(r, c)).toHaveAttribute('data-state', 'revealed');
      }
    }
  });

  test('right-click flags a hidden cell', () => {
    render(<GameBoard rows={3} cols={3} mineCount={0} showStatus={false} />);
    fireEvent.contextMenu(cell(1, 1));
    expect(cell(1, 1)).toHaveAttribute('data-state', 'flagged');
    fireEvent.contextMenu(cell(1, 1));
    expect(cell(1, 1)).toHaveAttribute('data-state', 'hidden');
  });

  test('clicking an already-revealed section tile navigates to its page', () => {
    const sections = [
      { id: 'music', href: '/music', glyphs: ['音'], cells: [4] },
    ];
    render(
      <GameBoard
        rows={3}
        cols={3}
        mineCount={0}
        sections={sections}
        showStatus={false}
      />,
    );
    fireEvent.click(cell(0, 0)); // flood reveal (0 mines) — includes the section tile
    expect(sectionTile('music')).toHaveTextContent('音');
    fireEvent.click(sectionTile('music'));
    expect(push).toHaveBeenCalledWith('/music');
  });

  test('revealed sections are persisted to sessionStorage', () => {
    const sections = [
      { id: 'music', href: '/music', glyphs: ['音'], cells: [4] },
    ];
    render(
      <GameBoard
        rows={3}
        cols={3}
        mineCount={0}
        sections={sections}
        persistKey="test-found"
        showStatus={false}
      />,
    );
    fireEvent.click(cell(0, 0));
    expect(JSON.parse(window.sessionStorage.getItem('test-found')!)).toEqual([
      'music',
    ]);
  });

  test('onFoundChange reports the sections a reveal uncovered', () => {
    const onFoundChange = vi.fn();
    render(
      <GameBoard
        rows={3}
        cols={3}
        mineCount={0}
        sections={MUSIC}
        showStatus={false}
        onFoundChange={onFoundChange}
      />,
    );
    fireEvent.click(cell(0, 0)); // 0 mines: the flood opens the section tile
    expect(onFoundChange).toHaveBeenCalledWith(['music']);
  });

  test('an uncovered section tile is named in English, not by coordinates', () => {
    const sections = [{ ...MUSIC[0], label: 'Music' }];
    render(
      <GameBoard
        rows={3}
        cols={3}
        mineCount={0}
        sections={sections}
        showStatus={false}
      />,
    );
    expect(cell(1, 1)).toBeInTheDocument(); // hidden: still a coordinate
    fireEvent.click(cell(0, 0));
    expect(sectionTile('Music')).toHaveTextContent('音');
  });

  test('finding a section clears its neighbourhood, leaving flags standing', () => {
    // 5x5, mine-free. Column 2 is flagged into a wall the click's own flood
    // cannot cross (it only enqueues hidden cells), and the section straddles
    // it: cell 11 is on the flooded side, cell 13 is not. Everything opened at
    // and beyond 13 got there through settleSections' engine reveals.
    const sections = [
      { id: 'music', href: '/music', glyphs: ['音', '乐'], cells: [11, 13] },
    ];
    const { container } = render(
      <GameBoard
        rows={5}
        cols={5}
        mineCount={0}
        sections={sections}
        showStatus={false}
      />,
    );
    // Section tiles lose their coordinate names once uncovered, and both cells
    // of a section share one name — so address cells by index here.
    const at = (i: number) => container.querySelector(`[data-idx="${i}"]`)!;

    for (const i of [2, 7, 12, 17, 22]) fireEvent.contextMenu(at(i));
    fireEvent.click(at(0));

    expect(at(13)).toHaveAttribute('data-state', 'revealed');
    for (const i of [8, 9, 14, 18, 19]) {
      expect(at(i)).toHaveAttribute('data-state', 'revealed');
    }
    // The clearing opens through the engine's reveal, so zeros at its edge
    // flood onward — on this mine-free board the whole right side opens. A
    // revealed 0 bordering hidden terrain is an impossible board state, and
    // settling must never manufacture one.
    for (const i of [3, 4, 23, 24]) {
      expect(at(i)).toHaveAttribute('data-state', 'revealed');
    }
    // Every flag survives the settle — reveal() no-ops on flagged cells.
    for (const i of [2, 7, 12, 17, 22]) {
      expect(at(i)).toHaveAttribute('data-state', 'flagged');
    }
  });

  test('a sessionStorage write that throws does not break the reveal', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError'); // Safari private mode
    });
    render(
      <GameBoard
        rows={3}
        cols={3}
        mineCount={0}
        sections={MUSIC}
        persistKey="test-found"
        showStatus={false}
      />,
    );
    fireEvent.click(cell(0, 0));
    expect(sectionTile('music')).toHaveAttribute('data-state', 'revealed');
  });
});

describe('GameBoard touch', () => {
  test('long-press flags without revealing, and does not eat a later tap', () => {
    vi.useFakeTimers();
    render(<GameBoard rows={3} cols={3} mineCount={0} showStatus={false} />);

    fireEvent.touchStart(cell(0, 0));
    tick(450);
    expect(cell(0, 0)).toHaveAttribute('data-state', 'flagged');

    // iOS can swallow the synthesized click entirely (or send touchcancel),
    // so click-suppression must expire on its own rather than latch.
    fireEvent.touchCancel(cell(0, 0));
    tick(600);

    fireEvent.click(cell(2, 2));
    expect(cell(2, 2)).toHaveAttribute('data-state', 'revealed');
  });

  test('the contextmenu that follows a long-press does not un-flag the cell', () => {
    vi.useFakeTimers();
    render(<GameBoard rows={3} cols={3} mineCount={0} showStatus={false} />);

    fireEvent.touchStart(cell(1, 1));
    tick(450);
    expect(cell(1, 1)).toHaveAttribute('data-state', 'flagged');

    // Mobile browsers fire contextmenu ~500ms into the same long-press.
    fireEvent.contextMenu(cell(1, 1));
    expect(cell(1, 1)).toHaveAttribute('data-state', 'flagged');
  });

  test('a long hold does not let the trailing click reveal the cell', () => {
    vi.useFakeTimers();
    render(<GameBoard rows={3} cols={3} mineCount={0} showStatus={false} />);
    fireEvent.contextMenu(cell(0, 0));
    expect(cell(0, 0)).toHaveAttribute('data-state', 'flagged');

    // Un-flag by holding, then keep holding well past the suppression window.
    fireEvent.touchStart(cell(0, 0));
    tick(450);
    expect(cell(0, 0)).toHaveAttribute('data-state', 'hidden');
    tick(650);
    fireEvent.touchEnd(cell(0, 0));

    // The synthesized click arrives at release, so suppression must be
    // anchored there — otherwise this un-flag turns into a reveal.
    fireEvent.click(cell(0, 0));
    expect(cell(0, 0)).toHaveAttribute('data-state', 'hidden');
  });

  test('a contextmenu before the hold elapses cancels the pending long-press', () => {
    vi.useFakeTimers();
    render(<GameBoard rows={3} cols={3} mineCount={0} showStatus={false} />);

    fireEvent.touchStart(cell(1, 1));
    tick(400);
    fireEvent.contextMenu(cell(1, 1)); // platform hold menu, before our timer
    expect(cell(1, 1)).toHaveAttribute('data-state', 'flagged');

    tick(100); // our timer would otherwise fire and toggle the flag back off
    expect(cell(1, 1)).toHaveAttribute('data-state', 'flagged');
  });

  test('a slow tap on a revealed section tile still navigates', () => {
    vi.useFakeTimers();
    render(
      <GameBoard
        rows={3}
        cols={3}
        mineCount={0}
        sections={MUSIC}
        showStatus={false}
      />,
    );
    fireEvent.click(cell(0, 0));

    fireEvent.touchStart(sectionTile('music'));
    tick(450);
    fireEvent.touchEnd(sectionTile('music'));
    fireEvent.click(sectionTile('music'));
    expect(push).toHaveBeenCalledWith('/music');
  });
});

describe('GameBoard keyboard', () => {
  test('arrow keys clamp per axis instead of wrapping between rows', () => {
    render(<GameBoard rows={3} cols={3} mineCount={0} showStatus={false} />);

    fireEvent.keyDown(cell(0, 0), { key: 'ArrowRight' });
    fireEvent.keyDown(cell(0, 1), { key: 'ArrowRight' });
    expect(cell(0, 2)).toHaveAttribute('tabindex', '0');

    fireEvent.keyDown(cell(0, 2), { key: 'ArrowRight' }); // end of row: stay
    expect(cell(0, 2)).toHaveAttribute('tabindex', '0');

    fireEvent.keyDown(cell(0, 2), { key: 'ArrowUp' }); // top row: stay
    expect(cell(0, 2)).toHaveAttribute('tabindex', '0');
  });

  test('Enter reveals and f flags the focused cell, but ⌘F does not', () => {
    render(<GameBoard rows={3} cols={3} mineCount={0} showStatus={false} />);

    fireEvent.keyDown(cell(0, 0), { key: 'f', metaKey: true }); // browser find
    expect(cell(0, 0)).toHaveAttribute('data-state', 'hidden');

    fireEvent.keyDown(cell(0, 0), { key: 'f' });
    expect(cell(0, 0)).toHaveAttribute('data-state', 'flagged');

    fireEvent.keyDown(cell(0, 0), { key: 'f' }); // unflag
    fireEvent.keyDown(cell(0, 0), { key: 'Enter' });
    expect(cell(0, 0)).toHaveAttribute('data-state', 'revealed');
  });
});

describe('GameBoard status', () => {
  // The component reveals with the default rng (Math.random); pinning it to 0
  // makes the shuffle in placeMines deterministic, so the same call in the test
  // reproduces exactly the layout the component will build.
  function seedBoard() {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    return reveal(createBoard({ rows: 8, cols: 8, mineCount: 10 }), 0, () => 0);
  }

  test('hitting a mine announces the loss and resets the board', () => {
    vi.useFakeTimers();
    const seeded = seedBoard();
    const mineIdx = seeded.cells.findIndex(
      (c) => c.mine && c.state === 'hidden',
    );
    render(<GameBoard rows={8} cols={8} mineCount={10} showStatus={false} />);

    fireEvent.click(cell(0, 0));
    fireEvent.click(cell(Math.floor(mineIdx / 8), mineIdx % 8));

    expect(cell(Math.floor(mineIdx / 8), mineIdx % 8)).toHaveTextContent('✕');
    expect(screen.getByRole('status')).toHaveTextContent(/mine hit/);

    tick(900);
    expect(cell(0, 0)).toHaveAttribute('data-state', 'hidden');
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  test('pressing both buttons chords a satisfied number cell', () => {
    seedBoard();
    render(<GameBoard rows={8} cols={8} mineCount={10} showStatus={false} />);
    fireEvent.click(cell(0, 0));

    // cell 1 shows "1"; its only hidden neighbour with a mine is cell 10, and
    // cell 2 is the hidden safe neighbour the chord should open.
    expect(cell(0, 1)).toHaveTextContent('1');
    fireEvent.contextMenu(cell(1, 2));
    expect(cell(0, 2)).toHaveAttribute('data-state', 'hidden');

    // buttons === 3: left and right held together.
    fireEvent.mouseDown(cell(0, 1), { buttons: 3 });
    expect(cell(0, 2)).toHaveAttribute('data-state', 'revealed');
  });

  test('the right button of a chord does not also flag or reveal', () => {
    render(<GameBoard rows={3} cols={3} mineCount={0} showStatus={false} />);

    // Releasing both buttons leaves a contextmenu and a click behind; neither
    // may act on the cell the player was chording.
    fireEvent.mouseDown(cell(1, 1), { buttons: 3 });
    fireEvent.contextMenu(cell(1, 1));
    fireEvent.click(cell(1, 1));
    expect(cell(1, 1)).toHaveAttribute('data-state', 'hidden');
  });

  test('the timer keeps its padded width and the win is announced', () => {
    render(<GameBoard rows={3} cols={3} mineCount={0} />);
    const timer = screen.getByLabelText('timer');
    expect(timer.textContent).toMatch(/^\d{3}\.\d{2}$/);

    fireEvent.click(cell(0, 0)); // 0 mines: a full reveal wins immediately
    expect(timer.textContent).toMatch(/^\d{3}\.\d{2}$/);
    expect(timer.className).toContain('vermilion');
    expect(screen.getByRole('status')).toHaveTextContent(/board complete/);
  });

  test('onStatusChange reports the win', () => {
    const onStatusChange = vi.fn();
    render(
      <GameBoard
        rows={3}
        cols={3}
        mineCount={0}
        showStatus={false}
        onStatusChange={onStatusChange}
      />,
    );
    fireEvent.click(cell(0, 0)); // 0 mines: a full reveal wins immediately
    expect(onStatusChange).toHaveBeenCalledWith('won');
  });

  test('onStatusChange reports the loss and the reset back to playing', () => {
    vi.useFakeTimers();
    const seeded = seedBoard();
    const mineIdx = seeded.cells.findIndex(
      (c) => c.mine && c.state === 'hidden',
    );
    const onStatusChange = vi.fn();
    render(
      <GameBoard
        rows={8}
        cols={8}
        mineCount={10}
        showStatus={false}
        onStatusChange={onStatusChange}
      />,
    );

    fireEvent.click(cell(0, 0));
    fireEvent.click(cell(Math.floor(mineIdx / 8), mineIdx % 8));
    expect(onStatusChange).toHaveBeenLastCalledWith('lost');

    tick(900);
    expect(onStatusChange).toHaveBeenLastCalledWith('playing');
  });

  test('the flag-mode toggle exposes its pressed state', () => {
    render(<GameBoard rows={3} cols={3} mineCount={0} showStatus={false} />);
    const toggle = screen.getByRole('button', { name: /flag mode/i });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
  });

  test('onWin reports elapsed milliseconds on the winning move', () => {
    const onWin = vi.fn();
    render(<GameBoard rows={2} cols={2} mineCount={0} onWin={onWin} />);

    // 0 mines: first reveal floods the board and wins immediately.
    fireEvent.click(cell(0, 0));

    expect(onWin).toHaveBeenCalledTimes(1);
    const [elapsed] = onWin.mock.calls[0];
    expect(typeof elapsed).toBe('number');
    expect(elapsed).toBeGreaterThanOrEqual(0);
  });
});
