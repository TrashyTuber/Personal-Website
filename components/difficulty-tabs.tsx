import type { DifficultyId, SweepRecord } from '@/content/sweeping';
import { formatTime } from '@/content/sweeping';

export interface DifficultyTabsProps {
  records: SweepRecord[];
  selected: DifficultyId;
  /** Re-pressing the selected tab deals a fresh board — the smiley's job. */
  onSelect: (id: DifficultyId) => void;
  /** A run is under way: mark the selected tab as the reset with a ↻. */
  live?: boolean;
}

/**
 * BEG · INT · EXP — the abbreviations speedrunners actually use — sitting in
 * the board's own status bar. Replaced the record steles: the selector shrank
 * to one line so the whole board fits on screen, and the record moved next to
 * the timer as the par. Active is vermilion text plus an underline, so the
 * state never rests on colour alone. The selected tab doubles as the reset
 * (the classic smiley sat in this same centre slot); once a run is live a ↻
 * hangs off it, absolutely placed so the row never shifts.
 */
export default function DifficultyTabs({
  records,
  selected,
  onSelect,
  live = false,
}: DifficultyTabsProps) {
  return (
    <span className="flex gap-3 sm:gap-6">
      {records.map((r) => {
        const active = r.id === selected;
        return (
          <button
            key={r.id}
            type="button"
            data-difficulty={r.id}
            aria-pressed={active}
            aria-label={
              active
                ? `${r.level} — new board, record ${formatTime(r.timeSeconds)} seconds`
                : `${r.level} — record ${formatTime(r.timeSeconds)} seconds`
            }
            title={active ? 'New board (F2)' : undefined}
            onClick={() => onSelect(r.id)}
            className={`relative -my-1 px-1.5 py-1 font-mono-game text-xs tracking-[0.2em] underline-offset-[6px] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-vermilion motion-reduce:transition-none ${
              active
                ? 'text-vermilion-text underline decoration-vermilion'
                : 'text-faint hover:text-paper'
            }`}
          >
            {r.level.slice(0, 3).toUpperCase()}
            {active && live && (
              <span
                aria-hidden="true"
                className="absolute left-full top-1/2 -translate-y-1/2 tracking-normal no-underline"
              >
                ↻
              </span>
            )}
          </button>
        );
      })}
    </span>
  );
}
