import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import SweepingArena from './sweeping-arena';
import type { SweepRecord } from '@/content/sweeping';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Tiny mine-free geometries so wins are deterministic; record times chosen so
// a sub-second test win is always AHEAD of beginner and the delta math shows.
const ANCHORS: [number, number][] = [
  [1, 0.132],
  [10, 0.634],
  [101, 1.012],
  [4221, 2.082],
];
const TEST_RECORDS: SweepRecord[] = [
  { id: 'beginner', level: 'Beginner', zh: '初级', rows: 2, cols: 2, mines: 0, timeSeconds: 5, rank: 4221, playerCount: 5392830, rankAnchors: ANCHORS },
  { id: 'intermediate', level: 'Intermediate', zh: '中级', rows: 2, cols: 3, mines: 0, timeSeconds: 14.78, rank: 344, playerCount: 4015210, rankAnchors: ANCHORS },
  { id: 'expert', level: 'Expert', zh: '高级', rows: 3, cols: 3, mines: 0, timeSeconds: 52.803, rank: 320, playerCount: 3718430, rankAnchors: ANCHORS },
];

const cellCount = () =>
  screen.getAllByRole('button', { name: /^cell / }).length;

describe('SweepingArena', () => {
  test('default difficulty mounts, tab click swaps geometry, par, and focus', () => {
    render(
      <SweepingArena
        records={TEST_RECORDS}
        defaultDifficulty="intermediate"
        playable={['beginner', 'intermediate', 'expert']}
      />,
    );
    expect(cellCount()).toBe(6); // 2×3
    expect(screen.getByLabelText('record 14.780')).toBeInTheDocument();
    expect(screen.getByText(/WORLD #344/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Expert/ }));
    expect(cellCount()).toBe(9); // fresh 3×3 board
    const expertTab = screen.getByRole('button', { name: /Expert/ });
    expect(expertTab).toHaveAttribute('aria-pressed', 'true');
    expect(expertTab).toHaveTextContent('EXP');
    // The tab remounted with the board; focus follows to its replacement.
    expect(expertTab).toHaveFocus();
    expect(screen.getByLabelText('record 52.803')).toBeInTheDocument();
  });

  test('win shows the delta line and SWEEP AGAIN resets the board', () => {
    render(
      <SweepingArena
        records={TEST_RECORDS}
        defaultDifficulty="beginner"
        playable={['beginner']}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'cell 0,0' }));

    // Instant test win is far AHEAD of the 5s record.
    expect(screen.getByText(/AHEAD OF THE RECORD/)).toBeInTheDocument();
    // A win also shows the modeled minesweeper.online standing.
    expect(
      screen.getByText(/≈ top 0\.001% on minesweeper\.online/),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /SWEEP AGAIN/ }));
    expect(screen.getByText(/WORLD #4,221/)).toBeInTheDocument();
    expect(
      screen.queryByText(/on minesweeper\.online/),
    ).not.toBeInTheDocument();
    // Fresh board: cells hidden again.
    expect(
      screen.getAllByRole('button', { name: /^cell / })[0],
    ).toHaveAttribute('data-state', 'hidden');
  });

  test('re-pressing the active tab or F2 deals a fresh board mid-run', () => {
    // A reveal would flood (and win) these mine-free boards, so a flag marks
    // the board as touched instead.
    render(
      <SweepingArena
        records={TEST_RECORDS}
        defaultDifficulty="intermediate"
        playable={['beginner', 'intermediate', 'expert']}
      />,
    );
    const first = () => screen.getAllByRole('button', { name: /^cell / })[0];
    fireEvent.contextMenu(first());
    expect(first()).toHaveAttribute('data-state', 'flagged');

    const tab = screen.getByRole('button', { name: /Intermediate — new board/ });
    fireEvent.click(tab);
    expect(first()).toHaveAttribute('data-state', 'hidden');
    expect(
      screen.getByRole('button', { name: /Intermediate — new board/ }),
    ).toHaveFocus();

    fireEvent.contextMenu(first());
    fireEvent.keyDown(window, { key: 'F2' });
    expect(first()).toHaveAttribute('data-state', 'hidden');
  });

  test('non-playable difficulty shows the record but no board', () => {
    render(
      <SweepingArena
        records={TEST_RECORDS}
        defaultDifficulty="beginner"
        playable={['beginner']}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Expert/ }));
    expect(
      screen.queryByRole('group', { name: 'Minesweeper board' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/WANTS A WIDER SCREEN/)).toBeInTheDocument();
  });
});
