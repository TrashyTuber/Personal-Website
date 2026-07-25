export type CellState = 'hidden' | 'revealed' | 'flagged';

export interface Cell {
  mine: boolean;
  adjacent: number;
  state: CellState;
  /** Section id if this cell carries a section glyph (guaranteed mine-free). */
  section?: string;
  /** Hanzi character shown when the cell is revealed. */
  glyph?: string;
}

export type GameStatus = 'playing' | 'lost' | 'won';

export interface Board {
  rows: number;
  cols: number;
  mineCount: number;
  /** Mines are placed lazily on first reveal so the first click is always safe. */
  minesPlaced: boolean;
  status: GameStatus;
  /** Row-major: index = row * cols + col. */
  cells: Cell[];
}

export interface SectionSpec {
  id: string;
  href: string;
  glyphs: string[];
  /** Board indices for each glyph, same order as `glyphs`. */
  cells: number[];
}
