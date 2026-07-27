import type { DifficultyId, SweepRecord } from '@/content/sweeping';
import { formatRank, formatTime, topPercent } from '@/content/sweeping';

export interface RecordStelesProps {
  records: SweepRecord[];
  selected: DifficultyId;
  onSelect: (id: DifficultyId) => void;
}

/**
 * Three record inscriptions that are also the difficulty selector. Two
 * grounds only, like the homepage: bare full-strength type on the page ink,
 * and one solid vermilion stamp behind the selected difficulty — red as
 * structure, not accent. (An earlier pass used faded featherweight serif on
 * hairline-divided panels; owner read it as generically East Asian — the
 * fix was flat and heavy, not thin and floating.)
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
            // Same hover move as the board mass: a brightness lift, never a
            // drawn box — affordance without adding a third ground.
            className={`flex flex-col items-center gap-3 px-7 py-6 transition-[filter,background-color,color] hover:brightness-125 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-vermilion motion-reduce:transition-none sm:px-10 ${
              active ? 'bg-vermilion' : ''
            }`}
          >
            <span
              lang="zh-Hans"
              className={`font-display-sc text-3xl font-normal leading-none tracking-[0.1em] [writing-mode:vertical-rl] ${
                active ? 'text-seal' : 'text-paper'
              }`}
            >
              {r.zh}
            </span>
            <span
              className={`font-mono-game text-xs uppercase tracking-[0.18em] ${
                active ? 'text-seal' : 'text-faint'
              }`}
            >
              {r.level}
            </span>
            <span
              className={`font-mono-game text-2xl ${
                active ? 'text-seal' : 'text-paper'
              }`}
            >
              {formatTime(r.timeSeconds)}
            </span>
            <span
              className={`whitespace-nowrap font-mono-game text-xs ${
                active ? 'text-seal' : 'text-faint'
              }`}
            >
              {formatRank(r.rank)} · {topPercent(r.rank, r.playerCount)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
