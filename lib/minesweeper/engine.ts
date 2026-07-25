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
      if (index < 0 || index >= rows * cols) {
        throw new Error(
          `section "${section.id}" cell index ${index} out of range for ${rows}x${cols} board`,
        );
      }
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
  // Dedupe: the board's mineCount must match the mines that actually exist.
  const unique = new Set(mineIndices);
  for (const index of unique) cells[index].mine = true;
  const next: Board = {
    ...board,
    cells,
    mineCount: unique.size,
    minesPlaced: true,
  };
  for (let i = 0; i < cells.length; i++) {
    cells[i].adjacent = neighbors(next, i).filter((n) => cells[n].mine).length;
  }
  return next;
}

export function placeMines(
  board: Board,
  safeIndex: number,
  /** Random source; must return values in [0, 1). */
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

export function checkWin(board: Board): Board {
  if (board.status !== 'playing') return board;
  const won = board.cells.every((cell) => cell.mine || cell.state === 'revealed');
  return won ? { ...board, status: 'won' } : board;
}

export function reveal(
  board: Board,
  index: number,
  rng: () => number = Math.random,
): Board {
  if (board.status !== 'playing') return board;
  const target = board.cells[index];
  if (target.state === 'flagged' || target.state === 'revealed') return board;

  let next = board.minesPlaced ? board : placeMines(board, index, rng);
  const cells = cloneCells(next);
  next = { ...next, cells };

  if (cells[index].mine) {
    cells[index].state = 'revealed';
    return { ...next, status: 'lost' };
  }

  const queue = [index];
  while (queue.length > 0) {
    const current = queue.pop()!;
    const cell = cells[current];
    if (cell.state !== 'hidden') continue;
    cell.state = 'revealed';
    if (cell.adjacent === 0) {
      for (const n of neighbors(next, current)) {
        if (cells[n].state === 'hidden' && !cells[n].mine) queue.push(n);
      }
    }
  }
  return checkWin(next);
}

export function toggleFlag(board: Board, index: number): Board {
  if (board.status !== 'playing') return board;
  const cell = board.cells[index];
  if (cell.state === 'revealed') return board;
  const cells = cloneCells(board);
  cells[index].state = cell.state === 'flagged' ? 'hidden' : 'flagged';
  return { ...board, cells };
}

export function chord(
  board: Board,
  index: number,
  rng: () => number = Math.random,
): Board {
  const cell = board.cells[index];
  if (
    board.status !== 'playing' ||
    cell.state !== 'revealed' ||
    cell.adjacent === 0
  ) {
    return board;
  }
  const around = neighbors(board, index);
  const flags = around.filter((n) => board.cells[n].state === 'flagged').length;
  if (flags !== cell.adjacent) return board;
  let next = board;
  for (const n of around) {
    if (next.cells[n].state === 'hidden') next = reveal(next, n, rng);
  }
  return next;
}

export function minesRemaining(board: Board): number {
  const flags = board.cells.filter((c) => c.state === 'flagged').length;
  return board.mineCount - flags;
}
