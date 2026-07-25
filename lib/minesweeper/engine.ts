import type { Board, Cell, SectionSpec } from './types';

export interface CreateOptions {
  rows: number;
  cols: number;
  mineCount: number;
  sections?: SectionSpec[];
  revealedSectionIds?: string[];
}

export function createBoard(opts: CreateOptions): Board {
  const { rows, cols, mineCount, sections = [], revealedSectionIds = [] } = opts;
  const cells: Cell[] = Array.from({ length: rows * cols }, () => ({
    mine: false,
    adjacent: 0,
    state: 'hidden',
  }));
  for (const section of sections) {
    section.cells.forEach((index, i) => {
      cells[index].section = section.id;
      cells[index].glyph = section.glyphs[i];
      if (revealedSectionIds.includes(section.id)) {
        cells[index].state = 'revealed';
      }
    });
  }
  return { rows, cols, mineCount, minesPlaced: false, status: 'playing', cells };
}

export function neighbors(board: Board, index: number): number[] {
  const row = Math.floor(index / board.cols);
  const col = index % board.cols;
  const result: number[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < board.rows && c >= 0 && c < board.cols) {
        result.push(r * board.cols + c);
      }
    }
  }
  return result;
}

function cloneCells(board: Board): Cell[] {
  return board.cells.map((cell) => ({ ...cell }));
}

export function placeMinesAt(board: Board, mineIndices: number[]): Board {
  const cells = cloneCells(board);
  for (const index of mineIndices) cells[index].mine = true;
  const next: Board = { ...board, cells, minesPlaced: true };
  for (let i = 0; i < cells.length; i++) {
    cells[i].adjacent = neighbors(next, i).filter((n) => cells[n].mine).length;
  }
  return next;
}

export function placeMines(
  board: Board,
  safeIndex: number,
  rng: () => number = Math.random,
): Board {
  const forbidden = new Set<number>([safeIndex, ...neighbors(board, safeIndex)]);
  board.cells.forEach((cell, i) => {
    if (cell.section) forbidden.add(i);
  });
  const candidates = board.cells
    .map((_, i) => i)
    .filter((i) => !forbidden.has(i));
  // Fisher–Yates shuffle; take the first mineCount as mines.
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  return placeMinesAt(board, candidates.slice(0, board.mineCount));
}
