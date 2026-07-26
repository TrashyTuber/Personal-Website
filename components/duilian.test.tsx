import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import Duilian from './duilian';

/** The positioned flank wraps the band the animation runs on. */
function band(container: HTMLElement): HTMLElement {
  return container.querySelector<HTMLElement>(
    '[aria-hidden="true"] > div > div',
  )!;
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
    expect(flank.querySelector('[lang="zh-Hans"]')).toHaveTextContent(
      '方寸藏雷',
    );
  });

  test('marquee runs on a motion-safe CSS loop with doubled content', () => {
    const { container } = renderColumn('right');
    const el = band(container);
    // motion-safe: gating is the reduced-motion story — the animation class
    // must never appear without it.
    expect(el.className).toContain('motion-safe:animate-duilian-marquee');
    // Two identical halves make the -50% keyframe wrap seamless.
    const halves = el.querySelectorAll('[lang="zh-Hans"]');
    expect(halves).toHaveLength(2);
    expect(halves[0].textContent).toBe(halves[1].textContent);
    // The phrase actually repeats within a half — it is a band, not a plaque.
    expect(
      (halves[0].textContent!.match(/方寸藏雷/g) ?? []).length,
    ).toBeGreaterThan(1);
  });

  test('the two flanks stream in opposite directions', () => {
    const left = band(renderColumn('left').container);
    const right = band(renderColumn('right').container);
    expect(left.style.animationDirection).toBe('');
    expect(right.style.animationDirection).toBe('reverse');
  });

  test('the gloss sits outside the moving band, once', () => {
    const { container } = renderColumn('left');
    expect(container).toHaveTextContent('thunder in a square inch');
    const flank = container.querySelector('[aria-hidden="true"]')!;
    const gloss = flank.lastElementChild!;
    expect(gloss.textContent).toBe('thunder in a square inch');
  });
});
