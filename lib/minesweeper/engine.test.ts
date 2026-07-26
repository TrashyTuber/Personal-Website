import { describe, expect, test } from 'vitest';
import {
  checkWin,
  chord,
  createBoard,
  minesRemaining,
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

  test('restores a found section as just its glyph cells, not a cleared patch', () => {
    // 4x5, section on cells 10 and 11 (row 2, cols 0-1). A restored board
    // starts with only the glyphs showing — quiet bookmarks in the mass. The
    // neighbourhood opens on a mid-game find (settleSections), never on
    // restore: an owner-decided distinction, do not "fix" one to match the
    // other.
    const board = createBoard({
      rows: 4, cols: 5, mineCount: 3,
      sections: SECTIONS,
      revealedSectionIds: ['music'],
    });
    for (const i of [10, 11]) {
      expect(board.cells[i].state).toBe('revealed');
    }
    // Everything else — including the section's own neighbourhood — is hidden.
    for (const i of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 12, 13, 14, 15, 16, 17, 18, 19]) {
      expect(board.cells[i].state).toBe('hidden');
    }
  });

  test('leaves the board hidden when no section is restored', () => {
    const board = createBoard({ rows: 4, cols: 5, mineCount: 3, sections: SECTIONS });
    expect(board.cells.every((c) => c.state === 'hidden')).toBe(true);
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
  test('flood fill routes around a small pre-revealed section', () => {
    // 5x5 with the section on the centre cell: the restored clearing is the
    // middle 3x3, an island the flood has to travel around rather than a wall.
    const sections: SectionSpec[] = [
      { id: 'music', href: '/music', glyphs: ['音'], cells: [12] },
    ];
    let board = createBoard({
      rows: 5, cols: 5, mineCount: 0,
      sections, revealedSectionIds: ['music'],
    });
    board = placeMinesAt(board, []);
    board = reveal(board, 0); // corner, outside the clearing
    expect(board.cells.every((c) => c.state === 'revealed')).toBe(true);
    expect(board.status).toBe('won');
  });

  test('a section spanning a full column DOES wall off the flood fill', () => {
    // 4x6, mine-free, column 2 (cells 2, 8, 14, 20) restored as glyphs only.
    // The flood only enqueues *hidden* neighbors, so it cannot route through
    // already-revealed terrain: revealing 0 fills columns 0-1 and stops at the
    // wall, leaving columns 3-5 hidden and the game unfinished. This is the
    // constraint app/page.tsx encodes — no section may span a full row or
    // column (mid-game finds also clear the neighbourhood, widening the wall).
    const sections: SectionSpec[] = [
      {
        id: 'wall',
        href: '/wall',
        glyphs: ['一', '二', '三', '四'],
        cells: [2, 8, 14, 20],
      },
    ];
    let board = createBoard({
      rows: 4, cols: 6, mineCount: 0,
      sections, revealedSectionIds: ['wall'],
    });
    board = placeMinesAt(board, []);
    board = reveal(board, 0);
    for (const i of [0, 1, 6, 7, 12, 13, 18, 19]) {
      expect(board.cells[i].state).toBe('revealed'); // columns 0-1: flooded
    }
    for (const i of [2, 8, 14, 20]) {
      expect(board.cells[i].state).toBe('revealed'); // column 2: the wall
    }
    for (const i of [3, 4, 5, 9, 10, 11, 15, 16, 17, 21, 22, 23]) {
      expect(board.cells[i].state).toBe('hidden'); // columns 3-5: unreachable
    }
    expect(board.status).toBe('playing');
  });
});

describe('chord', () => {
  // 4x4 with mines in the top corners (0, 3). reveal(12) floods rows 1-3,
  // leaving row 0 hidden: cells 1 and 2 are safe "1"s, 0 and 3 are mines.
  // (A 3x3/1-mine fixture is degenerate: the setup reveal insta-wins and
  // chord never runs — do not shrink this fixture.)
  const chordBase = () => {
    let b = createBoard({ rows: 4, cols: 4, mineCount: 2 });
    b = placeMinesAt(b, [0, 3]);
    return reveal(b, 12); // status 'playing'; cells 4-15 revealed, 0-3 hidden
  };

  test('reveals unflagged neighbors when flags match the number', () => {
    let board = chordBase();
    board = toggleFlag(board, 0); // correctly flag the mine
    board = chord(board, 5); // "1" next to the flag
    expect(board.cells[1].state).toBe('revealed');
    expect(board.cells[2].state).toBe('revealed');
    expect(board.status).toBe('won');
  });

  test('does nothing when flag count does not match', () => {
    const board = chordBase();
    expect(chord(board, 5)).toBe(board); // no flags placed
  });

  test('loses if a flag was wrong', () => {
    let board = chordBase();
    board = toggleFlag(board, 1); // wrong flag on a safe cell
    // cell 0 (a mine) is the first hidden neighbor — detonates before cell 2
    // is reached
    board = chord(board, 5);
    expect(board.status).toBe('lost');
  });

  test('is a no-op on flagged, hidden, and zero-adjacent targets', () => {
    let board = chordBase();
    board = toggleFlag(board, 1);
    expect(chord(board, 1)).toBe(board); // target is flagged, not revealed
    expect(chord(board, 2)).toBe(board); // target is still hidden
    expect(chord(board, 12)).toBe(board); // revealed, but adjacent === 0
  });
});

describe('checkWin', () => {
  test('never resurrects a lost board', () => {
    // Task 7's settleSections force-reveals section cells outside the engine
    // and re-runs checkWin. A detonated board must stay lost even once every
    // non-mine cell has ended up revealed.
    let board = createBoard({ rows: 3, cols: 3, mineCount: 1 });
    board = placeMinesAt(board, [4]);
    board = reveal(board, 4);
    expect(board.status).toBe('lost');
    const settled = {
      ...board,
      cells: board.cells.map((c) => ({ ...c, state: 'revealed' as const })),
    };
    expect(checkWin(settled)).toBe(settled);
    expect(checkWin(settled).status).toBe('lost');
  });
});

describe('minesRemaining', () => {
  test('mineCount minus flags', () => {
    let board = createBoard({ rows: 3, cols: 3, mineCount: 2 });
    board = placeMinesAt(board, [0, 1]);
    expect(minesRemaining(board)).toBe(2);
    board = toggleFlag(board, 5);
    expect(minesRemaining(board)).toBe(1);
  });

  test('goes negative when the player over-flags', () => {
    let board = createBoard({ rows: 3, cols: 3, mineCount: 2 });
    board = placeMinesAt(board, [0, 1]);
    for (const i of [5, 6, 7]) board = toggleFlag(board, i);
    expect(minesRemaining(board)).toBe(-1);
  });

  test('reports the requested mineCount before mines are placed', () => {
    const board = createBoard({ rows: 3, cols: 3, mineCount: 2 });
    expect(board.minesPlaced).toBe(false);
    expect(minesRemaining(board)).toBe(2);
  });
});

describe('placeMines section neighborhoods', () => {
  test('never places mines on section cells or any of their neighbors', () => {
    // Section tiles carry no visible adjacency number, so any mine next to one
    // would be invisible to deduction. Excluding the whole neighborhood makes a
    // section tile's true count zero — informationally inert, like cleared
    // terrain. Many seeds: a single lucky placement must not pass this.
    for (let seed = 0; seed < 30; seed++) {
      const base = createBoard({
        rows: 8,
        cols: 12,
        mineCount: 15,
        sections: SECTIONS,
      });
      const board = placeMines(base, 40, mulberry32(seed));
      const forbidden = new Set<number>();
      for (const section of SECTIONS) {
        for (const index of section.cells) {
          forbidden.add(index);
          for (const n of neighbors(board, index)) forbidden.add(n);
        }
      }
      const offenders = board.cells
        .map((c, i) => (c.mine && forbidden.has(i) ? i : -1))
        .filter((i) => i >= 0);
      expect(offenders).toEqual([]);
      expect(board.mineCount).toBe(15);
    }
  });
});
