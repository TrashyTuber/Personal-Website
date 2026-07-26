import { afterEach, describe, expect, test, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import Duilian from './duilian';

/**
 * jsdom's matchMedia always reports `matches: false`, which would only ever
 * exercise the moving branch — so the preference is stubbed outright.
 */
function stubMotionPreference(reduce: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: reduce && query.includes('reduce'),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
}

function setScrollY(value: number) {
  Object.defineProperty(window, 'scrollY', { value, configurable: true });
}

/** The positioned flank wraps the element the handler transforms. */
function drifter(container: HTMLElement): HTMLElement {
  return container.querySelector<HTMLElement>('[aria-hidden="true"] > div')!;
}

function renderColumn(side: 'left' | 'right') {
  return render(
    <Duilian side={side} hanzi="方寸藏雷" gloss="thunder in a square inch" />,
  );
}

async function scrollTo(y: number) {
  setScrollY(y);
  await act(async () => {
    window.dispatchEvent(new Event('scroll'));
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  setScrollY(0);
});

describe('Duilian', () => {
  test('is ornament only: hidden from assistive tech, hanzi still tagged', () => {
    stubMotionPreference(false);
    const { container } = renderColumn('right');
    const flank = container.querySelector('[aria-hidden="true"]')!;
    expect(flank).toBeInTheDocument();
    expect(flank.querySelector('[lang="zh-Hans"]')).toHaveTextContent('方寸藏雷');
  });

  test('the two flanks drift in opposite directions, and the drift is capped', async () => {
    stubMotionPreference(false);
    setScrollY(200);
    const left = drifter(renderColumn('left').container);
    const right = drifter(renderColumn('right').container);
    // Applied once on mount, so a reload partway down the page is not a jump.
    expect(left.style.transform).toBe('translate3d(0, -12.00px, 0)');
    expect(right.style.transform).toBe('translate3d(0, 12.00px, 0)');

    await scrollTo(5000);
    expect(left.style.transform).toBe('translate3d(0, -40.00px, 0)');
    expect(right.style.transform).toBe('translate3d(0, 40.00px, 0)');
  });

  test('reduced motion leaves the column still', async () => {
    stubMotionPreference(true);
    setScrollY(200);
    const column = drifter(renderColumn('left').container);
    expect(column.style.transform).toBe('');

    await scrollTo(600);
    expect(column.style.transform).toBe('');
  });

  test('unmounting drops the scroll listener', async () => {
    stubMotionPreference(false);
    const remove = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderColumn('right');
    unmount();
    expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function));
  });
});
