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
  /**
   * Hand-sampled (rank, seconds) points from the all-time leaderboard, owner's
   * record included — anchors for the log-normal standing model
   * (lib/rank-model.ts). Same snapshot vintage as RANKS_AS_OF.
   */
  rankAnchors: [rank: number, seconds: number][];
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
    rankAnchors: [
      [1, 0.132],
      [10, 0.634],
      [50, 0.9],
      [101, 1.012],
      [4221, 2.082],
    ],
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
    rankAnchors: [
      [1, 7.198],
      [10, 8.678],
      [50, 11.112],
      [101, 12.271],
      [344, 14.78],
    ],
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
    rankAnchors: [
      [1, 29.461],
      [10, 34.956],
      [50, 42.642],
      [101, 46.191],
      [320, 52.803],
    ],
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
