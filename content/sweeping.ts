/**
 * The owner's minesweeper.online records — the /minesweeper page's entire
 * data source. All numbers are a manual snapshot (see RANKS_AS_OF); there is
 * no public API to pull them from, by design and by necessity.
 */
export interface SweepRecord {
  id: 'beginner' | 'intermediate' | 'expert';
  level: 'Beginner' | 'Intermediate' | 'Expert';
  /** Difficulty name as carved on the stele. Ornament only — English carries function. */
  zh: string;
  rows: number;
  cols: number;
  mines: number;
  /** Best time in seconds, exactly as minesweeper.online reports it. */
  timeSeconds: number;
  /** World rank on the all-time best-time leaderboard. */
  rank: number;
  /** Total ranked players at snapshot time — the percentile denominator. */
  playerCount: number;
}

export type DifficultyId = SweepRecord['id'];

export const PROFILE_URL = 'https://minesweeper.online/player/7108240';
export const RANKS_AS_OF = 'july 2026';
/** The stated goal from the owner's profile bio: sub-50 expert. */
export const SUB50_TARGET = 50;

export const SWEEP_RECORDS: SweepRecord[] = [
  {
    id: 'beginner',
    level: 'Beginner',
    zh: '初级',
    rows: 9,
    cols: 9,
    mines: 10,
    timeSeconds: 2.082,
    rank: 4221,
    playerCount: 5392830,
  },
  {
    id: 'intermediate',
    level: 'Intermediate',
    zh: '中级',
    rows: 16,
    cols: 16,
    mines: 40,
    timeSeconds: 14.78,
    rank: 344,
    playerCount: 4015210,
  },
  {
    id: 'expert',
    level: 'Expert',
    zh: '高级',
    rows: 16,
    cols: 30,
    mines: 99,
    timeSeconds: 52.803,
    rank: 320,
    playerCount: 3718430,
  },
];

/** "top 0.08%" — one significant figure, computed, never hand-typed. */
export function topPercent(rank: number, playerCount: number): string {
  const pct = (rank / playerCount) * 100;
  return `top ${Number(pct.toPrecision(1))}%`;
}

/** minesweeper.online shows milliseconds; so do we. */
export function formatTime(seconds: number): string {
  return seconds.toFixed(3);
}

export function formatRank(rank: number): string {
  return `#${rank.toLocaleString('en-US')}`;
}
