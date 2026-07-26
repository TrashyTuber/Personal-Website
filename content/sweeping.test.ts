import { describe, expect, test } from 'vitest';
import {
  formatRank,
  formatTime,
  SWEEP_RECORDS,
  topPercent,
} from './sweeping';

describe('sweeping content', () => {
  test('topPercent keeps one significant figure', () => {
    expect(topPercent(4221, 5392830)).toBe('top 0.08%');
    expect(topPercent(344, 4015210)).toBe('top 0.009%');
    expect(topPercent(320, 3718430)).toBe('top 0.009%');
  });

  test('formatTime always shows milliseconds', () => {
    expect(formatTime(2.082)).toBe('2.082');
    expect(formatTime(14.78)).toBe('14.780');
  });

  test('formatRank groups thousands', () => {
    expect(formatRank(4221)).toBe('#4,221');
    expect(formatRank(344)).toBe('#344');
  });

  test('records carry authentic geometries', () => {
    expect(SWEEP_RECORDS.map((r) => [r.id, r.rows, r.cols, r.mines])).toEqual([
      ['beginner', 9, 9, 10],
      ['intermediate', 16, 16, 40],
      ['expert', 16, 30, 99],
    ]);
  });
});
