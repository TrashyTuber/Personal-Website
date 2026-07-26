import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import Duilian from './duilian';

/** The positioned flank wraps the element the animation runs on. */
function drifter(container: HTMLElement): HTMLElement {
  return container.querySelector<HTMLElement>('[aria-hidden="true"] > div')!;
}

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
    expect(flank.querySelector('[lang="zh-Hans"]')).toHaveTextContent('方寸藏雷');
  });

  test('drifts via a motion-safe CSS loop, not JS', () => {
    const { container } = renderColumn('right');
    // motion-safe: gating is the reduced-motion story — the animation class
    // must never appear without it.
    expect(drifter(container).className).toContain(
      'motion-safe:animate-duilian-drift',
    );
  });

  test('the two flanks float in opposite phase', () => {
    const left = drifter(renderColumn('left').container);
    const right = drifter(renderColumn('right').container);
    expect(left.style.animationDelay).toBe('-7s');
    expect(right.style.animationDelay).toBe('');
  });
});
