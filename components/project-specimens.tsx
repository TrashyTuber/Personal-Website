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

/* Trajecta — the committee room, after the product's own RoomSpectrum:
   four officer readers (academic, narrative, impact, context) each land a
   verdict on the five-zone deny → strong-admit spectrum, then the chair,
   reading only their reports, stamps admit / waitlist / reject. */
const ZONES = [10, 30, 50, 70, 90]; // deny · lean deny · toss-up · lean admit · strong admit
const ROOMS = [
  { reads: [3, 2, 4, 3], chair: 'admit' },
  { reads: [2, 1, 3, 2], chair: 'waitlist' },
];
const OFFICERS = ['AC', 'NR', 'IM', 'CX'];

function Trajecta({ active }: { active: boolean }) {
  const { tick, still } = useTick(active, 650);
  const room = ROOMS[still ? 0 : Math.floor(tick / 10) % ROOMS.length];
  const step = still ? 9 : tick % 10;
  const X = (pct: number) => 40 + pct * 3.2;
  // Officers on the same verdict are nudged apart, as in the product.
  const placed = room.reads.map((zone, i) => {
    const same = room.reads.filter((z, j) => z === zone && j < i).length;
    const count = room.reads.filter((z) => z === zone).length;
    return { zone, x: X(ZONES[zone]) + (same - (count - 1) / 2) * 30 };
  });
  // Seal + label centered as one unit on the spectrum's midpoint; mono
  // glyphs advance 0.6em, so the label's width is known without measuring.
  const chairLabel = `chair · ${room.chair}`;
  const chairX = 200 - (14 + 10 + chairLabel.length * 16 * 0.6) / 2;
  return (
    <svg viewBox="0 70 400 160" className="h-auto w-full" role="img" aria-label={`Four officer readers place verdicts on a deny-to-admit spectrum; the chair decides ${room.chair}`}>
      <line x1={X(0)} y1={130} x2={X(100)} y2={130} stroke="var(--color-hairline-2)" {...HAIR} />
      {ZONES.map((z) => (
        <line key={z} x1={X(z)} y1={124} x2={X(z)} y2={136} stroke="var(--color-hairline-2)" {...HAIR} />
      ))}
      <text x={X(0)} y={162} fill="var(--color-faint)" fontSize={15} fontFamily="var(--font-mono-game)">deny</text>
      <text x={X(100)} y={162} textAnchor="end" fill="var(--color-faint)" fontSize={15} fontFamily="var(--font-mono-game)">admit</text>
      {placed.map((p, i) =>
        i < step ? (
          <g key={`${room.chair}-${i}`} className="motion-safe:animate-[specimen-fade_400ms_ease-out]">
            <line x1={p.x} y1={108} x2={p.x} y2={126} stroke="var(--color-hairline-2)" {...HAIR} />
            <circle cx={p.x} cy={130} r={4} fill="var(--color-paper)" />
            <text x={p.x} y={100} textAnchor="middle" fill="var(--color-muted)" fontSize={15} fontFamily="var(--font-mono-game)">
              {OFFICERS[i]}
            </text>
          </g>
        ) : null,
      )}
      {step > 4 && (
        <g key={`chair-${room.chair}`} className="motion-safe:animate-[specimen-fade_500ms_ease-out]">
          <rect x={chairX} y={200} width={14} height={14} rx={1} fill="var(--color-vermilion)" />
          <text x={chairX + 24} y={212} fill="var(--color-paper)" fontSize={16} fontFamily="var(--font-mono-game)">
            {chairLabel}
          </text>
        </g>
      )}
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
// An excerpt from one of Yiming's own sets (lightly condensed).
const CODE = `setcpm(148/4)
const chordnotes = [
  "[eb3,g3,bb3,d4]", "[f#3,c4,d4,a4]",
  "[g3,d4,f4,bb4]", "[f3,c4,d4,a4]",
  "[g3,a3,d4,f4]"
]
$Chords: note(pick(chordnotes,
    "<0 1 2 [3 4]>"))
  .struct("[x -]*4").s("supersaw")
  .lpf(slider(5000, 1000, 5000))
  .release(.6).decay(.75)`;

function LiveCoding({ active }: { active: boolean }) {
  const { tick, still } = useTick(active, 45);
  const cycle = CODE.length + 40; // hold the finished pattern for a beat
  const shown = still ? CODE.length : Math.min(CODE.length, (tick * 2) % cycle);
  return (
    <div role="img" aria-label="A Strudel live-coding pattern being typed" className="font-mono-game text-xs leading-6">
      <pre className="whitespace-pre-wrap break-words text-muted">
        {CODE.slice(0, shown)}
        <span className="ml-px inline-block h-3.5 w-px translate-y-0.5 bg-vermilion" />
      </pre>
    </div>
  );
}

/* Prophet Hacks — a calibration plot. Most of the scout's calls sit near
   the diagonal; the few that land far off it are the overconfident ones,
   and the judge strikes them a beat after they appear. */
const OFF_DIAGONAL = new Set([3, 8, 11, 15]);

function Prophet({ active }: { active: boolean }) {
  const { tick, still } = useTick(active, 380);
  const rng = mulberry32(7);
  const pts = Array.from({ length: 18 }, (_, i) => {
    const p = 0.05 + (i / 17) * 0.9;
    const vetoed = OFF_DIAGONAL.has(i);
    const miss = vetoed ? (p < 0.5 ? 1 : -1) * (0.24 + rng() * 0.1) : (rng() - 0.5) * 0.12;
    const o = Math.min(0.97, Math.max(0.03, p + miss));
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

/* Patches Infinity — a port of the game's own generator (patches repo,
   puzzleGenerator.js): a 7×7 medium board, area-weighted rectangle
   sampling, no 1-cell regions, region count within [n, 1.45n]; ~40% of
   clues show a shape hint instead of the area. The regions are then drawn
   in one by one, the way a player solves it, and a fresh board follows. */
type Region = { r1: number; c1: number; rows: number; cols: number; area: number };
type Clue = { r: number; c: number; area: number; hint: 'number' | 'square' | 'tall' | 'wide' | 'any' };

const SIZE = 7;
const BOARD_TICKS = 16; // ≤10 regions drawn, then a held beat

function attemptGenerate(rng: () => number, targetCount: number): Region[] {
  const grid = Array.from({ length: SIZE }, () => Array<number>(SIZE).fill(-1));
  const rects: Region[] = [];
  const targetArea = (SIZE * SIZE) / targetCount;
  const weight = (area: number) =>
    area < 2 ? 0 : Math.exp(-0.5 * ((area - targetArea) / (targetArea * 0.75)) ** 2);
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] !== -1) continue;
      const cands: { r2: number; c2: number; area: number }[] = [];
      for (let c2 = c; c2 < SIZE && grid[r][c2] === -1; c2++) {
        let maxR2 = r;
        while (maxR2 + 1 < SIZE) {
          let free = true;
          for (let cc = c; cc <= c2; cc++) if (grid[maxR2 + 1][cc] !== -1) free = false;
          if (!free) break;
          maxR2++;
        }
        for (let r2 = r; r2 <= maxR2; r2++) cands.push({ r2, c2, area: (r2 - r + 1) * (c2 - c + 1) });
      }
      const weights = cands.map((cd) => weight(cd.area));
      const total = weights.reduce((a, b) => a + b, 0);
      let chosen = cands[0];
      if (total > 0) {
        let roll = rng() * total;
        for (let i = 0; i < cands.length; i++) {
          roll -= weights[i];
          if (roll <= 0) {
            chosen = cands[i];
            break;
          }
        }
      }
      for (let rr = r; rr <= chosen.r2; rr++)
        for (let cc = c; cc <= chosen.c2; cc++) grid[rr][cc] = rects.length;
      rects.push({ r1: r, c1: c, rows: chosen.r2 - r + 1, cols: chosen.c2 - c + 1, area: chosen.area });
    }
  }
  return rects;
}

function generateBoard(seed: number) {
  const rng = mulberry32(seed);
  const min = SIZE;
  const max = Math.round(SIZE * 1.45);
  const target = Math.round((min + max) / 2);
  let regions: Region[] = [];
  for (let attempt = 0; attempt < 120; attempt++) {
    regions = attemptGenerate(rng, target);
    if (!regions.some((g) => g.area === 1) && regions.length >= min && regions.length <= max) break;
  }
  const clues: Clue[] = regions.map((g) => {
    const r = g.r1 + Math.floor(rng() * g.rows);
    const c = g.c1 + Math.floor(rng() * g.cols);
    const shape = g.rows === g.cols ? 'square' : rng() < 0.3 ? 'any' : g.rows > g.cols ? 'tall' : 'wide';
    return { r, c, area: g.area, hint: rng() < 0.4 ? shape : 'number' };
  });
  return { regions, clues };
}

/**
 * Like the game's per-region pastels, each region and its clue share one
 * pigment — the board's coloured counts (the near-white n4/n8 sit out).
 */
const REGION_INK = ['n1', 'n2', 'n3', 'n5', 'n6', 'n7'].map((n) => `var(--color-${n})`);

/** Greedy colouring: no two touching regions share a pigment. */
function inkRegions(regions: Region[], offset: number): string[] {
  const owner: number[] = [];
  regions.forEach((g, i) => {
    for (let r = g.r1; r < g.r1 + g.rows; r++)
      for (let c = g.c1; c < g.c1 + g.cols; c++) owner[r * SIZE + c] = i;
  });
  const picked: number[] = [];
  regions.forEach((g, i) => {
    const taken = new Set<number>();
    for (let r = g.r1 - 1; r <= g.r1 + g.rows; r++)
      for (let c = g.c1 - 1; c <= g.c1 + g.cols; c++) {
        if (r < 0 || c < 0 || r >= SIZE || c >= SIZE) continue;
        const j = owner[r * SIZE + c];
        if (j !== i && picked[j] !== undefined) taken.add(picked[j]);
      }
    // A big region can touch every pigment; then it just keeps its default.
    const start = (i + offset) % REGION_INK.length;
    let k = start;
    for (let n = 0; n < REGION_INK.length && taken.has(k); n++) k = (start + n + 1) % REGION_INK.length;
    picked[i] = taken.has(k) ? start : k;
  });
  return picked.map((k) => REGION_INK[k]);
}

function ShapeHint({ hint, x, y, ink }: { hint: Exclude<Clue['hint'], 'number'>; x: number; y: number; ink: string }) {
  const props = { fill: 'none', stroke: ink, strokeDasharray: '3 2', rx: 2, ...HAIR };
  if (hint === 'any')
    return (
      <g>
        <rect x={x - 9} y={y - 9} width={18} height={18} {...props} />
        <rect x={x - 4} y={y - 4} width={8} height={8} rx={1} fill={ink} />
      </g>
    );
  const [w, h] = hint === 'square' ? [16, 16] : hint === 'tall' ? [8, 18] : [18, 8];
  return <rect x={x - w / 2} y={y - h / 2} width={w} height={h} {...props} />;
}

function Patches({ active }: { active: boolean }) {
  const { tick, still } = useTick(active, 340);
  const board = still ? 0 : Math.floor(tick / BOARD_TICKS);
  const step = still ? BOARD_TICKS : tick % BOARD_TICKS;
  const { regions, clues } = generateBoard(23 + board);
  const c = 34;
  const ox = (400 - SIZE * c) / 2;
  const oy = 10;
  const clueAt = new Set(clues.map((q) => q.r * SIZE + q.c));
  const inks = inkRegions(regions, board);
  return (
    <svg viewBox="0 0 400 258" className="h-auto w-full" role="img" aria-label="A Patches board: area and shape clues, with regions drawn in one by one">
      {Array.from({ length: SIZE * SIZE }, (_, i) =>
        clueAt.has(i) ? null : (
          <circle key={i} cx={ox + (i % SIZE) * c + c / 2} cy={oy + Math.floor(i / SIZE) * c + c / 2} r={1} fill="var(--color-hairline-2)" />
        ),
      )}
      {regions.map((g, i) =>
        i < step ? (
          <rect
            key={`${board}-${i}`}
            x={ox + g.c1 * c + 2.5}
            y={oy + g.r1 * c + 2.5}
            width={g.cols * c - 5}
            height={g.rows * c - 5}
            rx={2}
            fill="none"
            stroke={inks[i]}
            strokeOpacity={0.8}
            {...HAIR}
            className="motion-safe:animate-[specimen-fade_400ms_ease-out]"
          />
        ) : null,
      )}
      {clues.map((q, i) => {
        const x = ox + q.c * c + c / 2;
        const y = oy + q.r * c + c / 2;
        const ink = inks[i]; // clue i belongs to region i
        return q.hint === 'number' ? (
          <text key={i} x={x} y={y + 6} textAnchor="middle" fill={ink} fontSize={17} fontFamily="var(--font-mono-game)">
            {q.area}
          </text>
        ) : (
          <ShapeHint key={i} hint={q.hint} x={x} y={y} ink={ink} />
        );
      })}
    </svg>
  );
}

const SPECIMENS: Record<string, { Draw: (p: { active: boolean }) => React.ReactElement; caption: string }> = {
  trajecta: { Draw: Trajecta, caption: 'four readers place their verdicts · the chair decides' },
  'melody-harmonizer': { Draw: Harmonizer, caption: 'melody above · one chord per note below' },
  'live-coding': { Draw: LiveCoding, caption: 'the score is the code' },
  'prophet-hacks': { Draw: Prophet, caption: 'predicted vs. observed · the judge strikes the overconfident' },
  'patches-infinity': { Draw: Patches, caption: 'the real generator · a fresh 7×7 board, solved region by region' },
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
