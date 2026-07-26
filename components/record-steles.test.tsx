import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import RecordSteles from './record-steles';
import { SWEEP_RECORDS } from '@/content/sweeping';

describe('RecordSteles', () => {
  test('renders one pressed button per record, English name carrying the label', () => {
    render(
      <RecordSteles
        records={SWEEP_RECORDS}
        selected="intermediate"
        onSelect={() => {}}
      />,
    );

    const beginner = screen.getByRole('button', {
      name: /Beginner — 2\.082 seconds, world rank 4,221/,
    });
    const intermediate = screen.getByRole('button', {
      name: /Intermediate — 14\.780 seconds, world rank 344/,
    });
    expect(beginner).toHaveAttribute('aria-pressed', 'false');
    expect(intermediate).toHaveAttribute('aria-pressed', 'true');
    // Percentile is visible text on every stele.
    expect(screen.getByText('#4,221 · top 0.08%')).toBeInTheDocument();
  });

  test('hanzi is marked zh-Hans on its own span, not on the button', () => {
    render(
      <RecordSteles
        records={SWEEP_RECORDS}
        selected="beginner"
        onSelect={() => {}}
      />,
    );
    const hanzi = screen.getByText('初级');
    expect(hanzi).toHaveAttribute('lang', 'zh-Hans');
    expect(hanzi.closest('button')).not.toHaveAttribute('lang');
  });

  test('clicking a stele reports its id', () => {
    const onSelect = vi.fn();
    render(
      <RecordSteles
        records={SWEEP_RECORDS}
        selected="beginner"
        onSelect={onSelect}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Expert/ }));
    expect(onSelect).toHaveBeenCalledWith('expert');
  });
});
