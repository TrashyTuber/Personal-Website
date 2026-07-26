import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import HomeBoard from './home-board';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const MUSIC = [
  { id: 'music', href: '/music', label: 'Music', glyphs: ['音'], cells: [4] },
];

beforeEach(() => {
  window.sessionStorage.clear();
});

describe('HomeBoard', () => {
  test('names an uncovered section in English and links to its page', () => {
    render(
      <HomeBoard rows={3} cols={3} mineCount={0} sections={MUSIC} showStatus={false} />,
    );
    expect(screen.queryByText(/uncovered:/)).not.toBeInTheDocument();

    // 0 mines: the first reveal floods the board and opens the section tile.
    fireEvent.click(screen.getByRole('button', { name: 'cell 0,0' }));

    expect(screen.getByText(/uncovered:/)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Music →' });
    expect(link).toHaveAttribute('href', '/music');
    // Not a live region: GameBoard already owns the aria-live announcement.
    expect(link.closest('p')).not.toHaveAttribute('aria-live');
  });
});
