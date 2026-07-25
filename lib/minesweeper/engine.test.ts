import { describe, expect, test } from 'vitest';
import {
  createBoard,
  neighbors,
  placeMines,
  placeMinesAt,
  reveal,
  toggleFlag,
} from './engine';
import { mulberry32 } from './test-utils';
import type { SectionSpec } from './types';

const SECTIONS: SectionSpec[] = [
  { id: 'music', href: '/music', glyphs: ['音', '乐'], cells: [10, 11] },
];

describe('createBoard', () => {
  test('creates a hidden board of the right shape', () => {
    const board = createBoard({ rows: 4, cols: 5, mineCount: 3 });
    expect(board.cells).toHaveLength(20);
    expect(board.minesPlaced).toBe(false);
    expect(board.status).toBe('playing');
    expect(board.cells.every((c) => c.state === 'hidden' && !c.mine)).toBe(true);
  });

  test('assigns section glyphs to their cells', () => {
    const board = createBoard({ rows: 4, cols: 5, mineCount: 3, sections: SECTIONS });
    expect(board.cells[10]).toMatchObject({ section: 'music', glyph: '音' });
    expect(board.cells[11]).toMatchObject({ section: 'music', glyph: '乐' });
  });

  test('pre-reveals sections listed in revealedSectionIds', () => {
    const board = createBoard({
      rows: 4, cols: 5, mineCount: 3,
      sections: SECTIONS,
      revealedSectionIds: ['music'],
    });
    expect(board.cells[10].state).toBe('revealed');
    expect(board.cells[11].state).toBe('revealed');
    expect(board.cells[0].state).toBe('hidden');
  });

  test('throws when a section cell index is out of range', () => {
    const bad: SectionSpec[] = [
      { id: 'music', href: '/music', glyphs: ['音'], cells: [20] },
    ];
    expect(() =>
      createBoard({ rows: 4, cols: 5, mineCount: 3, sections: bad }),
    ).toThrow(/out of range/);
  });
});

describe('neighbors', () => {
  test('corner cell has 3 neighbors', () => {
    const board = createBoard({ rows: 4, cols: 5, mineCount: 0 });
    expect(neighbors(board, 0).sort((a, b) => a - b)).toEqual([1, 5, 6]);
  });

  test('interior cell has 8 neighbors', () => {
    const board = createBoard({ rows: 4, cols: 5, mineCount: 0 });
    expect(neighbors(board, 7)).toHaveLength(8);
  });

  test('right-edge cell does not wrap around to the next row', () => {
    const board = createBoard({ rows: 4, cols: 5, mineCount: 0 });
    expect(neighbors(board, 9).sort((a, b) => a - b)).toEqual([3, 4, 8, 13, 14]);
  });
});

describe('placeMinesAt', () => {
  test('sets mines and computes adjacency counts', () => {
    // 3x3, mine in the center: every other cell touches exactly 1 mine.
    const board = placeMinesAt(createBoard({ rows: 3, cols: 3, mineCount: 1 }), [4]);
    expect(board.minesPlaced).toBe(true);
    expect(board.cells[4].mine).toBe(true);
    for (const i of [0, 1, 2, 3, 5, 6, 7, 8]) {
      expect(board.cells[i].adjacent).toBe(1);
    }
  });

  test('dedupes mine indices and reports an honest mineCount', () => {
    const board = placeMinesAt(createBoard({ rows: 3, cols: 3, mineCount: 2 }), [4, 4]);
    expect(board.cells.filter((c) => c.mine)).toHaveLength(1);
    expect(board.mineCount).toBe(1);
  });
});

describe('placeMines', () => {
  test('places exactly mineCount mines, never on the safe zone or section cells', () => {
    const rng = mulberry32(42);
    const base = createBoard({ rows: 8, cols: 12, mineCount: 15, sections: SECTIONS });
    const board = placeMines(base, 0, rng);
    const mineIndices = board.cells
      .map((c, i) => (c.mine ? i : -1))
      .filter((i) => i >= 0);
    expect(mineIndices).toHaveLength(15);
    const forbidden = new Set([0, ...neighbors(board, 0), 10, 11]);
    expect(mineIndices.some((i) => forbidden.has(i))).toBe(false);
  });

  test('does not mutate the input board', () => {
    const rng = mulberry32(42);
    const base = createBoard({ rows: 8, cols: 12, mineCount: 15, sections: SECTIONS });
    const out = placeMines(base, 0, rng);
    expect(base.cells.every((c) => !c.mine)).toBe(true);
    expect(base.minesPlaced).toBe(false);
    expect(base.cells[0]).not.toBe(out.cells[0]);
  });
});

describe('reveal', () => {
  test('first reveal places mines and never loses', () => {
    const rng = mulberry32(7);
    let board = createBoard({ rows: 8, cols: 12, mineCount: 15 });
    board = reveal(board, 40, rng);
    expect(board.minesPlaced).toBe(true);
    expect(board.status).toBe('playing');
    expect(board.cells[40].state).toBe('revealed');
    expect(board.cells[40].mine).toBe(false);
  });

  test('flood fill reveals the whole board when there are no mines', () => {
    let board = createBoard({ rows: 4, cols: 4, mineCount: 0 });
    board = placeMinesAt(board, []);
    board = reveal(board, 0);
    expect(board.cells.every((c) => c.state === 'revealed')).toBe(true);
    expect(board.status).toBe('won');
  });

  test('flood fill stops at numbered cells', () => {
    // 4x4 with a mine in the far corner (15): revealing 0 floods everything
    // except the mine — the three cells around it become numbered borders.
    let board = createBoard({ rows: 4, cols: 4, mineCount: 1 });
    board = placeMinesAt(board, [15]);
    board = reveal(board, 0);
    expect(board.cells[15].state).toBe('hidden');
    expect(board.cells[10].adjacent).toBe(1);
    expect(board.cells[10].state).toBe('revealed');
    expect(board.status).toBe('won'); // all non-mine cells revealed
  });

  test('revealing a mine loses', () => {
    let board = createBoard({ rows: 3, cols: 3, mineCount: 1 });
    board = placeMinesAt(board, [4]);
    board = reveal(board, 4);
    expect(board.status).toBe('lost');
    expect(board.cells[4].state).toBe('revealed');
  });

  test('reveal is a no-op on flagged cells and after game over', () => {
    let board = createBoard({ rows: 3, cols: 3, mineCount: 1 });
    board = placeMinesAt(board, [4]);
    board = toggleFlag(board, 0);
    expect(reveal(board, 0)).toBe(board);
    const lost = reveal(board, 4);
    expect(reveal(lost, 1)).toBe(lost);
  });
});

describe('reveal with pre-revealed sections', () => {
  test('a pre-revealed section does not wall off the flood fill', () => {
    const sections: SectionSpec[] = [
      { id: 'music', href: '/music', glyphs: ['音', '乐'], cells: [5, 6] },
    ];
    let board = createBoard({
      rows: 4, cols: 4, mineCount: 0,
      sections, revealedSectionIds: ['music'],
    });
    board = placeMinesAt(board, []);
    board = reveal(board, 15); // far corner, other side of the section wall
    expect(board.cells.every((c) => c.state === 'revealed')).toBe(true);
    expect(board.status).toBe('won');
  });
});
