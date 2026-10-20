import type { DifficultyId, SweepRecord } from '@/content/sweeping';
import { formatTime } from '@/content/sweeping';

export interface DifficultyTabsProps {
  records: SweepRecord[];
  selected: DifficultyId;
  onSelect: (id: DifficultyId) => void;
}

/**
 * BEG · INT · EXP — the abbreviations speedrunners actually use — sitting in
 * the board's own status bar. Replaced the record steles: the selector shrank
 * to one line so the whole board fits on screen, and the record moved next to
 * the timer as the par. Active is vermilion text plus an underline, so the
 * state never rests on colour alone.
 */
export default function DifficultyTabs({
  records,
  selected,
  onSelect,
}: DifficultyTabsProps) {
  return (
    <span className="flex gap-1 sm:gap-3">
      {records.map((r) => {
        const active = r.id === selected;
        return (
          <button
            key={r.id}
            type="button"
            data-difficulty={r.id}
            aria-pressed={active}
            aria-label={`${r.level} — record ${formatTime(r.timeSeconds)} seconds`}
            onClick={() => onSelect(r.id)}
            className={`-my-1 px-1 py-1 font-mono-game text-xs tracking-[0.08em] underline-offset-[6px] sm:px-1.5 sm:tracking-[0.2em] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-vermilion motion-reduce:transition-none ${
              active
                ? 'text-vermilion-text underline decoration-vermilion'
                : 'text-faint hover:text-paper'
            }`}
          >
            {r.level.slice(0, 3).toUpperCase()}
          </button>
        );
      })}
    </span>
  );
}
