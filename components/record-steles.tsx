import type { DifficultyId, SweepRecord } from '@/content/sweeping';
import { formatRank, formatTime, topPercent } from '@/content/sweeping';

export interface RecordStelesProps {
  records: SweepRecord[];
  selected: DifficultyId;
  onSelect: (id: DifficultyId) => void;
}

/**
 * Three stele inscriptions (碑) that are also the difficulty selector:
 * vertical hanzi in the duilian's register, the English name carrying the
 * accessible label, the record time as the loudest line. The selected stele
 * is the one with the ink still wet — vermilion rule, full-strength text.
 */
export default function RecordSteles({
  records,
  selected,
  onSelect,
}: RecordStelesProps) {
  return (
    <div className="flex justify-center">
      {records.map((r) => {
        const active = r.id === selected;
        return (
          <button
            key={r.id}
            type="button"
            aria-pressed={active}
            // The hanzi is ornament; the whole stele reads out in English.
            aria-label={`${r.level} — ${formatTime(r.timeSeconds)} seconds, world rank ${r.rank.toLocaleString('en-US')}`}
            onClick={() => onSelect(r.id)}
            className="relative flex flex-col items-center gap-3 border-r border-hairline px-6 pb-5 pt-7 transition-colors last:border-r-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-vermilion sm:px-9"
          >
            {active && (
              <span
                aria-hidden="true"
                className="absolute inset-x-5 top-0 h-[2px] bg-vermilion"
              />
            )}
            <span
              lang="zh-Hans"
              className={`font-serif-sc text-3xl font-light leading-none tracking-[0.22em] [writing-mode:vertical-rl] ${
                active ? 'text-paper/85' : 'text-paper/25'
              }`}
            >
              {r.zh}
            </span>
            <span
              className={`font-mono-game text-xs uppercase tracking-[0.2em] ${
                active ? 'text-paper' : 'text-faint'
              }`}
            >
              {r.level}
            </span>
            <span
              className={`font-mono-game text-2xl ${
                active ? 'text-vermilion-text' : 'text-muted'
              }`}
            >
              {formatTime(r.timeSeconds)}
            </span>
            <span
              className={`whitespace-nowrap font-mono-game text-xs ${
                active ? 'text-muted' : 'text-faint'
              }`}
            >
              {formatRank(r.rank)} · {topPercent(r.rank, r.playerCount)}
            </span>
            {/* Grid spec prints width×height, the minesweeper convention. */}
            <span className="whitespace-nowrap font-mono-game text-xs text-faint">
              {r.cols}×{r.rows} · {r.mines} mines
            </span>
          </button>
        );
      })}
    </div>
  );
}
