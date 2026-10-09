'use client';

/**
 * PROTOTYPE: one drawn "specimen" per project. Every visual is generated
 * from code (no screenshots to maintain), animates only while `active`, and
 * rests in a finished state under reduced motion.
 */
import { useTick } from './hooks';

const LABEL = {
  fontFamily: 'var(--font-mono-game)',
  fontSize: 16,
  fill: 'var(--color-faint)',
} as const;

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

/* ── Trajecta: a committee of readers, then the verdict against baseline ── */
function Trajecta({ active }: { active: boolean }) {
  const { tick, still } = useTick(active, 520);
  const phase = still ? 5 : tick % 7; // readers light one by one, then hold
  return (
    <svg viewBox="0 0 400 300" className="h-auto w-full" role="img" aria-label="Five simulated readers reach a verdict; model accuracy 82.7% against a 58% baseline">
      <text x="24" y="34" style={LABEL}>committee</text>
      {Array.from({ length: 5 }, (_, i) => {
        const lit = i < phase;
        return (
          <g key={i}>
            <rect
              x={24 + i * 72}
              y={50}
              width={56}
              height={56}
              rx={4}
              fill={lit ? 'var(--color-vermilion)' : 'var(--color-tile)'}
              style={{ transition: 'fill 300ms' }}
            />
            <circle cx={52 + i * 72} cy={78} r={5} fill={lit ? 'var(--color-seal)' : 'var(--color-hairline-2)'} />
          </g>
        );
      })}
      <text x="24" y="166" style={LABEL}>model</text>
      <rect x="24" y="176" width="352" height="18" fill="var(--color-tile)" />
      <rect
        x="24"
        y="176"
        width={352 * 0.827}
        height="18"
        fill="var(--color-n4)"
        style={{ transformOrigin: '24px 0', transform: `scaleX(${phase >= 5 ? 1 : 0.04})`, transition: 'transform 700ms ease-out' }}
      />
      <text x="24" y="236" style={LABEL}>baseline</text>
      <rect x="24" y="246" width="352" height="18" fill="var(--color-tile)" />
      <rect x="24" y="246" width={352 * 0.58} height="18" fill="var(--color-hairline-2)" />
    </svg>
  );
}

/* ── Melody Harmonizer: a piano roll, melody above, smoothed chords below ── */
const MELODY = [7, 9, 11, 12, 11, 9, 7, 4, 5, 7, 9, 7, 5, 4, 2, 0];
const CHORDS = [
  { name: 'C', from: 0, to: 4, rows: [0, 2, 4] },
  { name: 'Am', from: 4, to: 8, rows: [5, 0, 2] },
  { name: 'F', from: 8, to: 12, rows: [3, 5, 0] },
  { name: 'G', from: 12, to: 16, rows: [4, 6, 1] },
];

function Harmonizer({ active }: { active: boolean }) {
  const { tick, still } = useTick(active, 260);
  const step = still ? 16 : tick % 18;
  const x0 = 24;
  const w = 352 / 16;
  return (
    <svg viewBox="0 0 400 300" className="h-auto w-full" role="img" aria-label="Piano roll: a melody with one predicted chord per note">
      <text x="24" y="22" style={LABEL}>melody</text>
      {Array.from({ length: 17 }, (_, i) => (
        <line key={i} x1={x0 + i * w} x2={x0 + i * w} y1={32} y2={276} stroke="var(--color-hairline)" strokeWidth={i % 4 === 0 ? 1 : 0.5} />
      ))}
      {MELODY.map((p, i) => (
        <rect
          key={i}
          x={x0 + i * w + 2}
          y={32 + (13 - p) * 8}
          width={w - 4}
          height={7}
          fill={i < step ? 'var(--color-n4)' : 'var(--color-hairline-2)'}
          style={{ transition: 'fill 150ms' }}
        />
      ))}
      <text x="24" y="168" style={LABEL}>chords</text>
      {CHORDS.map((c, ci) =>
        c.rows.map((r) => (
          <rect
            key={`${ci}-${r}`}
            x={x0 + c.from * w + 2}
            y={182 + (6 - r) * 11}
            width={(c.to - c.from) * w - 4}
            height={9}
            fill={c.from < step ? (ci % 2 ? 'var(--color-n2)' : 'var(--color-n1)') : 'var(--color-tile)'}
            style={{ transition: 'fill 200ms' }}
          />
        )),
      )}
      {CHORDS.map((c) => (
        <text key={c.name} x={x0 + c.from * w + 4} y={274} style={LABEL}>
          {c.name}
        </text>
      ))}
      {!still && step < 16 && (
        <line x1={x0 + step * w} x2={x0 + step * w} y1={28} y2={280} stroke="var(--color-vermilion)" strokeWidth={2} />
      )}
    </svg>
  );
}

/* ── Live coding: the score is code, typed in front of you ── */
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
    <div role="img" aria-label="Strudel live-coding pattern being typed" className="relative min-h-[15rem] font-mono-game text-[13px] leading-6 sm:text-sm">
      <pre className="whitespace-pre-wrap break-words text-muted">
        {CODE.slice(0, shown)}
        <span className={`ml-px inline-block h-4 w-2 translate-y-0.5 bg-vermilion ${still ? '' : 'motion-safe:animate-pulse'}`} />
      </pre>
    </div>
  );
}

/* ── Prophet Hacks: a calibration plot; the judge vetoes the overconfident ── */
function Prophet({ active }: { active: boolean }) {
  const { tick, still } = useTick(active, 380);
  const rng = mulberry32(7);
  const pts = Array.from({ length: 18 }, (_, i) => {
    const p = 0.05 + (i / 17) * 0.9;
    const o = Math.min(0.97, Math.max(0.03, p + (rng() - 0.5) * 0.16));
    const vetoed = (p < 0.12 || p > 0.88) && rng() < 0.9;
    return { p, o, vetoed };
  });
  const shown = still ? pts.length + 3 : tick % (pts.length + 6);
  const X = (v: number) => 48 + v * 320;
  const Y = (v: number) => 256 - v * 228;
  return (
    <svg viewBox="0 0 400 300" className="h-auto w-full" role="img" aria-label="Calibration plot of predicted versus observed probabilities">
      <line x1={X(0)} y1={Y(0)} x2={X(1)} y2={Y(0)} stroke="var(--color-hairline-2)" />
      <line x1={X(0)} y1={Y(0)} x2={X(0)} y2={Y(1)} stroke="var(--color-hairline-2)" />
      <line x1={X(0)} y1={Y(0)} x2={X(1)} y2={Y(1)} stroke="var(--color-hairline-2)" strokeDasharray="4 6" />
      <text x={X(1)} y={286} textAnchor="end" style={LABEL}>predicted</text>
      <text x={20} y={Y(1)} style={LABEL} transform={`rotate(-90 20 ${Y(1)})`} textAnchor="end">observed</text>
      {pts.map((pt, i) => {
        if (i >= shown) return null;
        const judged = i < shown - 3 && pt.vetoed;
        return (
          <g key={i}>
            <circle cx={X(pt.p)} cy={Y(pt.o)} r={6} fill={judged ? 'none' : 'var(--color-n2)'} stroke={judged ? 'var(--color-hairline-2)' : 'none'} />
            {judged && (
              <path d={`M${X(pt.p) - 7} ${Y(pt.o) - 7} l14 14 m0 -14 l-14 14`} stroke="var(--color-vermilion)" strokeWidth={2} />
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ── Patches Infinity: an endless supply of fresh partitions ── */
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
    if (vertical) {
      const c = 1 + Math.floor(rng() * (w - 1));
      split(x, y, c, h);
      split(x + c, y, w - c, h);
    } else {
      const c = 1 + Math.floor(rng() * (h - 1));
      split(x, y, w, c);
      split(x, y + c, w, h - c);
    }
  };
  split(0, 0, 8, 6);
  return out;
}

const PIGMENTS = ['var(--color-n1)', 'var(--color-n2)', 'var(--color-n3)', 'var(--color-n4)', 'var(--color-n5)', 'var(--color-n6)', 'var(--color-n7)'];

function Patches({ active }: { active: boolean }) {
  const { tick, still } = useTick(active, 2400);
  const seed = still ? 11 : 11 + tick;
  const rects = partition(seed);
  const c = 44;
  return (
    <svg viewBox="0 0 400 300" className="h-auto w-full" role="img" aria-label="A grid partitioned into rectangles, regenerating endlessly">
      <g key={seed} className="motion-safe:animate-[specimen-fade_500ms_ease-out]">
        {rects.map((r, i) => (
          <g key={i}>
            <rect
              x={24 + r.x * c + 3}
              y={18 + r.y * c + 3}
              width={r.w * c - 6}
              height={r.h * c - 6}
              rx={3}
              fill="none"
              stroke={PIGMENTS[i % PIGMENTS.length]}
              strokeOpacity={0.75}
              strokeWidth={2}
            />
            <text
              x={24 + r.cx * c + c / 2}
              y={18 + r.cy * c + c / 2 + 6}
              textAnchor="middle"
              style={{ ...LABEL, fontSize: 18, fontWeight: 700, fill: PIGMENTS[i % PIGMENTS.length] }}
            >
              {r.w * r.h}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}

/* ── Election model: one scatter, three decision boundaries ── */
function Election({ active }: { active: boolean }) {
  const { tick, still } = useTick(active, 1800);
  const model = still ? 2 : tick % 3;
  const rng = mulberry32(3);
  const curve = (x: number) => 150 + 50 * Math.sin((x - 24) / 60);
  const pts = Array.from({ length: 46 }, () => {
    const x = 32 + rng() * 336;
    const y = 40 + rng() * 220;
    const noisy = rng() < 0.08;
    return { x, y, a: (y < curve(x)) !== noisy };
  });
  const xs = Array.from({ length: 15 }, (_, i) => 24 + i * 25.14);
  const boundary = [
    // logistic: a straight line
    `M24 ${curve(24) + 20} L376 ${curve(376) - 20}`,
    // knn: jagged
    'M' + xs.map((x, i) => `${x} ${curve(x) + (i % 2 ? 14 : -10)}`).join(' L'),
    // forest: axis-aligned steps
    `M24 ${Math.round(curve(24) / 22) * 22}` +
      xs.map((x, i) => ` V${Math.round(curve(x) / 22) * 22} H${xs[i + 1] ?? 376}`).join(''),
  ][model];
  return (
    <svg viewBox="0 0 400 300" className="h-auto w-full" role="img" aria-label="Scatter of two classes with logistic, k-nearest-neighbor and random-forest decision boundaries">
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={5} fill={p.a ? 'var(--color-n1)' : 'var(--color-n3)'} />
      ))}
      <path key={model} d={boundary} fill="none" stroke="var(--color-paper)" strokeWidth={2} className="motion-safe:animate-[specimen-fade_500ms_ease-out]" />
      <text x="24" y="290" style={LABEL}>
        {['logistic regression', 'k-nearest neighbors', 'random forest'][model]}
      </text>
    </svg>
  );
}

/* ── MIDI controller: pads strike, faders ride ── */
function Midi({ active }: { active: boolean }) {
  const { tick, still } = useTick(active, 180);
  const rng = mulberry32(still ? 5 : tick + 1);
  const hit = new Set([Math.floor(rng() * 16), Math.floor(rng() * 16)]);
  return (
    <svg viewBox="0 0 400 300" className="h-auto w-full" role="img" aria-label="A four-by-four pad grid and four faders">
      {Array.from({ length: 16 }, (_, i) => (
        <rect
          key={i}
          x={24 + (i % 4) * 58}
          y={24 + Math.floor(i / 4) * 64}
          width={48}
          height={54}
          rx={4}
          fill={hit.has(i) ? 'var(--color-vermilion)' : 'var(--color-tile)'}
          style={{ transition: hit.has(i) ? 'none' : 'fill 400ms' }}
        />
      ))}
      {Array.from({ length: 4 }, (_, i) => {
        const v = still ? 0.35 + i * 0.15 : 0.5 + 0.4 * Math.sin(tick / 6 + i * 1.3);
        const y = 270 - v * 236;
        return (
          <g key={i}>
            <line x1={276 + i * 30} x2={276 + i * 30} y1={30} y2={270} stroke="var(--color-hairline-2)" strokeWidth={2} />
            <rect x={266 + i * 30} y={y - 6} width={20} height={12} rx={2} fill="var(--color-n4)" />
          </g>
        );
      })}
    </svg>
  );
}

const SPECIMENS: Record<string, (p: { active: boolean }) => React.ReactElement> = {
  trajecta: Trajecta,
  'melody-harmonizer': Harmonizer,
  'live-coding': LiveCoding,
  'prophet-hacks': Prophet,
  'patches-infinity': Patches,
  'election-model': Election,
  'midi-controller': Midi,
};

export default function Specimen({ slug, active }: { slug: string; active: boolean }) {
  const S = SPECIMENS[slug];
  return S ? <S active={active} /> : null;
}
