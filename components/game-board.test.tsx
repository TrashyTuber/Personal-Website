import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import GameBoard from './game-board';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

beforeEach(() => {
  push.mockClear();
  window.sessionStorage.clear();
});

function cell(row: number, col: number): HTMLElement {
  return screen.getByRole('button', { name: `cell ${row},${col}` });
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
    expect(cell(1, 1)).toHaveTextContent('音');
    fireEvent.click(cell(1, 1));
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
});
