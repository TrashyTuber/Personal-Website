import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import PlayableBoard from './playable-board';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe('PlayableBoard', () => {
  test('shows a visible win line once the board is cleared', () => {
    render(<PlayableBoard rows={3} cols={3} mineCount={0} showStatus={false} />);
    expect(screen.getByText(/CLEAR THE BOARD/)).toBeInTheDocument();

    // 0 mines: the first reveal floods the whole board and wins.
    fireEvent.click(screen.getByRole('button', { name: 'cell 0,0' }));

    const line = screen.getByText(/BOARD COMPLETE/);
    expect(line).toBeInTheDocument();
    expect(line.className).toContain('vermilion');
    // Not a live region: GameBoard already owns the aria-live announcement.
    expect(line).not.toHaveAttribute('aria-live');
  });
});
