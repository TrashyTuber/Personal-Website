import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import Duilian from './duilian';

function renderColumn(side: 'left' | 'right') {
  return render(
    <Duilian side={side} hanzi="方寸藏雷" gloss="thunder in a square inch" />,
  );
}

describe('Duilian', () => {
  test('is ornament only: hidden from assistive tech, hanzi still tagged', () => {
    const { container } = renderColumn('right');
    const flank = container.querySelector('[aria-hidden="true"]')!;
    expect(flank).toBeInTheDocument();
    expect(flank.querySelector('[lang="zh-Hans"]')).toHaveTextContent(
      '方寸藏雷',
    );
  });

  test('is a static inscription: no animation classes anywhere', () => {
    const { container } = renderColumn('left');
    expect(container.innerHTML).not.toContain('animate-');
    expect(container.innerHTML).not.toContain('animation');
  });

  test('the gloss sits beneath the hanzi, once', () => {
    const { container } = renderColumn('left');
    const flank = container.querySelector('[aria-hidden="true"]')!;
    expect(flank.lastElementChild).toHaveTextContent(
      'thunder in a square inch',
    );
    expect(
      (container.textContent!.match(/thunder in a square inch/g) ?? []).length,
    ).toBe(1);
  });
});
