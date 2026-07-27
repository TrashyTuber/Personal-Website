import { describe, expect, test } from 'vitest';
import { estimateStanding, fitLogNormal, formatStanding, phi } from './rank-model';

// Expert anchors sampled from minesweeper.online, july 2026.
const EXPERT_ANCHORS: [number, number][] = [
  [1, 29.461],
  [10, 34.956],
  [50, 42.642],
  [101, 46.191],
  [320, 52.803],
];
const EXPERT_N = 3718430;

describe('phi (standard normal CDF)', () => {
  test('matches known values', () => {
    expect(phi(0)).toBeCloseTo(0.5, 6);
    expect(phi(-1.96)).toBeCloseTo(0.025, 3);
    expect(phi(1.96)).toBeCloseTo(0.975, 3);
  });
});

describe('fitLogNormal + estimateStanding', () => {
  const model = fitLogNormal(EXPERT_ANCHORS, EXPERT_N);

  test('reproduces its own anchors within tail tolerance', () => {
    // Least-squares over a deep tail: exact ranks are not expected, but each
    // anchor's estimated rank must land within a factor of 3.
    for (const [rank, seconds] of EXPERT_ANCHORS) {
      const est = estimateStanding(seconds, model, EXPERT_N);
      expect(est.rank).toBeGreaterThanOrEqual(rank / 3);
      expect(est.rank).toBeLessThanOrEqual(rank * 3);
    }
  });

  test('is monotonic: slower time, worse rank', () => {
    let prev = 0;
    for (const s of [30, 60, 100, 200, 400, 900]) {
      const est = estimateStanding(s, model, EXPERT_N);
      expect(est.rank).toBeGreaterThan(prev);
      prev = est.rank;
    }
  });

  test('clamps the extremes', () => {
    expect(estimateStanding(1, model, EXPERT_N).rank).toBe(1);
    expect(
      estimateStanding(100000, model, EXPERT_N).rank,
    ).toBeLessThanOrEqual(EXPERT_N);
  });
});

describe('formatStanding', () => {
  test('elite times get sub-1% labels with one significant figure', () => {
    const label = formatStanding({ percent: 0.0082, rank: 30500 }, EXPERT_N);
    expect(label).toBe('≈ top 0.8% on minesweeper.online (~#31,000 of 3.7M)');
  });

  test('midfield times get integer percent', () => {
    const label = formatStanding({ percent: 0.47, rank: 1747662 }, EXPERT_N);
    expect(label).toBe('≈ top 47% on minesweeper.online (~#1,700,000 of 3.7M)');
  });

  test('deep-tail results cap at 90%+', () => {
    const label = formatStanding({ percent: 0.984, rank: 3659136 }, EXPERT_N);
    expect(label).toBe('≈ top 90%+ on minesweeper.online');
  });

  test('a world-record beater is #1, not 0%', () => {
    const label = formatStanding({ percent: 0.0000001, rank: 1 }, EXPERT_N);
    expect(label).toBe('≈ top 0.001% on minesweeper.online (~#1 of 3.7M)');
  });
});
