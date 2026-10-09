'use client';

/**
 * One drawn "specimen" per project for the projects index. Every visual is
 * generated from code (no screenshots to maintain), animates only while
 * `active`, and rests in a finished state under reduced motion.
 *
 * House style: 1px non-scaling hairlines, structure in hairline grey, the
 * subject in paper, at most one vermilion accent. Words live in the HTML
 * caption, not inside the SVG, so they keep the 12px floor at any width.
 * A project without a specimen simply renders none.
 */
import { useTick } from '@/lib/use-motion';

const HAIR = { vectorEffect: 'non-scaling-stroke', strokeWidth: 1 } as const;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Trajecta — five readers vote, their lines converge on a verdict, and the
   verdict lands on a 0–100 scale past the baseline tick. */
function Trajecta({ active }: { active: boolean }) {
  const { tick, still } = useTick(active, 600);
  const voted = still ? 5 : Math.min(5, tick % 8);
  const done = voted === 5;
  const scale = (v: number) => 40 + v * 3.2;
  return (
    <svg viewBox="0 0 400 260" className="h-auto w-full" role="img" aria-label="Five simulated readers converge on a verdict that scores 82.7%, past a 58% baseline">
      {Array.from({ length: 5 }, (_, i) => {
        const x = 72 + i * 64;
        const on = i < voted;
        return (
          <g key={i}>
            <line x1={x} y1={64} x2={200} y2={140} stroke={on ? 'var(--color-muted)' : 'var(--color-hairline-2)'} {...HAIR} style={{ transition: 'stroke 300ms' }} />
            <circle cx={x} cy={56} r={7} fill={on ? 'var(--color-seal)' : 'var(--color-ink)'} stroke={on ? 'var(--color-seal)' : 'var(--color-hairline-2)'} {...HAIR} style={{ transition: 'fill 300ms' }} />
          </g>
        );
      })}
      <circle cx={200} cy={140} r={4} fill={done ? 'var(--color-vermilion)' : 'var(--color-hairline-2)'} style={{ transition: 'fill 300ms' }} />
      <line x1={200} y1={144} x2={scale(82.7)} y2={204} stroke={done ? 'var(--color-vermilion)' : 'transparent'} {...HAIR} style={{ transition: 'stroke 300ms' }} />
      <line x1={scale(0)} y1={210} x2={scale(100)} y2={210} stroke="var(--color-hairline-2)" {...HAIR} />
      {[0, 100].map((v) => (
        <line key={v} x1={scale(v)} y1={205} x2={scale(v)} y2={215} stroke="var(--color-hairline-2)" {...HAIR} />
      ))}
      <line x1={scale(58)} y1={202} x2={scale(58)} y2={218} stroke="var(--color-faint)" {...HAIR} />
      <circle cx={scale(82.7)} cy={210} r={4} fill={done ? 'var(--color-vermilion)' : 'transparent'} style={{ transition: 'fill 300ms' }} />
    </svg>
  );
}

/* Melody Harmonizer — a piano roll: melody above, the smoothed chord per
   note below, colored in as the playhead passes. */
const MELODY = [7, 9, 11, 12, 11, 9, 7, 4, 5, 7, 9, 7, 5, 4, 2, 0];
const CHORDS = [
  { name: 'C', from: 0, to: 4, rows: [0, 2, 4] },
  { name: 'Am', from: 4, to: 8, rows: [5, 0, 2] },
  { name: 'F', from: 8, to: 12, rows: [3, 5, 0] },
  { name: 'G', from: 12, to: 16, rows: [4, 6, 1] },
];

function Harmonizer({ active }: { active: boolean }) {
  const { tick, still } = useTick(active, 280);
  const step = still ? 16 : tick % 20;
  const x0 = 24;
  const w = 352 / 16;
  return (
    <svg viewBox="0 0 400 250" className="h-auto w-full" role="img" aria-label="Piano roll: a melody with one predicted chord per note">
      {Array.from({ length: 17 }, (_, i) => (
        <line key={i} x1={x0 + i * w} x2={x0 + i * w} y1={16} y2={216} stroke={i % 4 === 0 ? 'var(--color-hairline-2)' : 'var(--color-hairline)'} {...HAIR} />
      ))}
      {MELODY.map((p, i) => (
        <rect key={i} x={x0 + i * w + 3} y={22 + (13 - p) * 8} width={w - 6} height={3} fill={i < step ? 'var(--color-paper)' : 'var(--color-hairline-2)'} style={{ transition: 'fill 150ms' }} />
      ))}
      {CHORDS.map((c, ci) =>
        c.rows.map((r) => (
          <rect
            key={`${ci}-${r}`}
            x={x0 + c.from * w + 3}
            y={150 + (6 - r) * 9}
            width={(c.to - c.from) * w - 6}
            height={2}
            fill={c.from < step ? (ci % 2 ? 'var(--color-n2)' : 'var(--color-n1)') : 'var(--color-hairline-2)'}
            style={{ transition: 'fill 200ms' }}
          />
        )),
      )}
      {CHORDS.map((c) => (
        <text key={c.name} x={x0 + c.from * w + 3} y={242} fill="var(--color-faint)" fontSize={16} fontFamily="var(--font-mono-game)">
          {c.name}
        </text>
      ))}
      {!still && step < 16 && (
        <line x1={x0 + step * w} x2={x0 + step * w} y1={12} y2={220} stroke="var(--color-vermilion)" {...HAIR} />
      )}
    </svg>
  );
}

/* Live coding — the score is code, typed in front of you. */
const CODE = `setcps(0.6)
stack(
  s("bd*2 [~ bd] sd ~"),
  note("<c3 eb3 g3 bb2>*4")
    .s("sawtooth")
    .lpf(sine.range(300, 2200).slow(8)),
  s("hh*8").gain(perlin.range(.3, .7))
)`;

function LiveCoding({ active }: { active: boolean }) {
  const { tick, still } = useTick(active, 45);
  const cycle = CODE.length + 40; // hold the finished pattern for a beat
  const shown = still ? CODE.length : Math.min(CODE.length, (tick * 2) % cycle);
  return (
    <div role="img" aria-label="A Strudel live-coding pattern being typed" className="font-mono-game text-xs leading-6 sm:text-[13px]">
      <pre className="whitespace-pre-wrap break-words text-muted">
        {CODE.slice(0, shown)}
        <span className="ml-px inline-block h-3.5 w-px translate-y-0.5 bg-vermilion" />
      </pre>
    </div>
  );
}

/* Prophet Hacks — a calibration plot; the judge strikes the overconfident
   calls at the extremes. */
function Prophet({ active }: { active: boolean }) {
  const { tick, still } = useTick(active, 380);
  const rng = mulberry32(7);
  const pts = Array.from({ length: 18 }, (_, i) => {
    const p = 0.05 + (i / 17) * 0.9;
    const o = Math.min(0.97, Math.max(0.03, p + (rng() - 0.5) * 0.16));
    const vetoed = (p < 0.12 || p > 0.88) && rng() < 0.9;
    return { p, o, vetoed };
  });
  const shown = still ? pts.length + 3 : tick % (pts.length + 8);
  const X = (v: number) => 40 + v * 320;
  const Y = (v: number) => 236 - v * 216;
  return (
    <svg viewBox="0 0 400 250" className="h-auto w-full" role="img" aria-label="Calibration plot of predicted versus observed probabilities, with overconfident calls vetoed">
      <line x1={X(0)} y1={Y(0)} x2={X(1)} y2={Y(0)} stroke="var(--color-hairline-2)" {...HAIR} />
      <line x1={X(0)} y1={Y(0)} x2={X(0)} y2={Y(1)} stroke="var(--color-hairline-2)" {...HAIR} />
      <line x1={X(0)} y1={Y(0)} x2={X(1)} y2={Y(1)} stroke="var(--color-hairline-2)" strokeDasharray="2 5" {...HAIR} />
      {pts.map((pt, i) => {
        if (i >= shown) return null;
        const judged = i < shown - 3 && pt.vetoed;
        const cx = X(pt.p);
        const cy = Y(pt.o);
        return judged ? (
          <g key={i}>
            <circle cx={cx} cy={cy} r={3.5} fill="none" stroke="var(--color-hairline-2)" {...HAIR} />
            <line x1={cx - 7} y1={cy + 7} x2={cx + 7} y2={cy - 7} stroke="var(--color-vermilion)" {...HAIR} />
          </g>
        ) : (
          <circle key={i} cx={cx} cy={cy} r={3} fill="var(--color-paper)" />
        );
      })}
    </svg>
  );
}

/* Patches Infinity — an endless supply of fresh partitions, each region
   carrying its area clue the way the game does. */
function partition(seed: number) {
  const rng = mulberry32(seed);
  const out: { x: number; y: number; w: number; h: number; cx: number; cy: number }[] = [];
  const split = (x: number, y: number, w: number, h: number) => {
    const a = w * h;
    if (a <= 2 || (a <= 8 && rng() < 0.5)) {
      out.push({ x, y, w, h, cx: x + Math.floor(rng() * w), cy: y + Math.floor(rng() * h) });
      return;
    }
    const vertical = w > h ? true : w < h ? false : rng() < 0.5;
    const len = vertical ? w : h;
    const c = 1 + Math.floor(rng() * (len - 1));
    if (vertical) {
      split(x, y, c, h);
      split(x + c, y, w - c, h);
    } else {
      split(x, y, w, c);
      split(x, y + c, w, h - c);
    }
  };
  split(0, 0, 8, 6);
  return out;
}

const CLUE = ['var(--color-n1)', 'var(--color-n2)', 'var(--color-n3)', 'var(--color-n4)'];

function Patches({ active }: { active: boolean }) {
  const { tick, still } = useTick(active, 2600);
  const seed = still ? 11 : 11 + tick;
  const rects = partition(seed);
  const c = 44;
  const ox = 24;
  const oy = 4;
  return (
    <svg viewBox="0 0 400 272" className="h-auto w-full" role="img" aria-label="A grid partitioned into rectangles with area clues, regenerating endlessly">
      {Array.from({ length: 48 }, (_, i) => (
        <circle key={i} cx={ox + (i % 8) * c + c / 2} cy={oy + Math.floor(i / 8) * c + c / 2} r={1} fill="var(--color-hairline-2)" />
      ))}
      <g key={seed} className="motion-safe:animate-[specimen-fade_600ms_ease-out]">
        {rects.map((r, i) => (
          <g key={i}>
            <rect x={ox + r.x * c + 3} y={oy + r.y * c + 3} width={r.w * c - 6} height={r.h * c - 6} rx={2} fill="none" stroke="var(--color-muted)" strokeOpacity={0.6} {...HAIR} />
            <rect x={ox + r.cx * c + 3} y={oy + r.cy * c + 3} width={c - 6} height={c - 6} rx={2} fill="var(--color-ink)" />
            <text
              x={ox + r.cx * c + c / 2}
              y={oy + r.cy * c + c / 2 + 6}
              textAnchor="middle"
              fill={CLUE[(r.w * r.h) % CLUE.length]}
              fontSize={17}
              fontFamily="var(--font-mono-game)"
            >
              {r.w * r.h}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}

const SPECIMENS: Record<string, { Draw: (p: { active: boolean }) => React.ReactElement; caption: string }> = {
  trajecta: { Draw: Trajecta, caption: 'five readers · one verdict · the baseline it clears' },
  'melody-harmonizer': { Draw: Harmonizer, caption: 'melody above · one chord per note below' },
  'live-coding': { Draw: LiveCoding, caption: 'the score is the code' },
  'prophet-hacks': { Draw: Prophet, caption: 'predicted vs. observed · the judge strikes the overconfident' },
  'patches-infinity': { Draw: Patches, caption: 'a fresh solvable board every few seconds' },
};

export function hasSpecimen(slug: string) {
  return slug in SPECIMENS;
}

export default function Specimen({ slug, active }: { slug: string; active: boolean }) {
  const s = SPECIMENS[slug];
  if (!s) return null;
  return (
    <figure>
      <s.Draw active={active} />
      <figcaption className="mt-4 font-mono-game text-xs text-faint">{s.caption}</figcaption>
    </figure>
  );
}
