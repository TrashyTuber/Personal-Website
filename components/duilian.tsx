/**
 * One flank of the homepage couplet, as a slow vertical marquee: the line
 * repeats down the full height of the page — 方寸藏雷 · 方寸藏雷 · … — and
 * scrolls continuously until the footer cuts it off. Duilian-inspired ambient
 * ornament rather than a literal couplet plaque; no translation, no frame.
 *
 * Pure CSS: the loop is a keyframe translating the doubled content by -50%
 * (the two halves are identical, so the wrap is seamless), gated behind
 * motion-safe so reduced-motion users get a still column. No client JS.
 */

/** Repetitions per half; enough to overfill any sane viewport height. */
const REPEATS = 6;

export interface DuilianProps {
  /**
   * Which flank this column hangs on. Traditional placement puts the 上联 on
   * the right and the 下联 on the left; here it also sets the scroll
   * direction, so the two bands stream past each other.
   */
  side: 'left' | 'right';
  /** The line itself. */
  hanzi: string;
  /** Positioning comes from the caller — the component owns only its own look. */
  className?: string;
}

export default function Duilian({ side, hanzi, className = '' }: DuilianProps) {
  // Each half ends with its own separator so the copy seam reads as one more
  // "· " like every other joint in the band.
  const half = `${Array.from({ length: REPEATS }, () => hanzi).join(' · ')} · `;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none overflow-hidden ${className}`}
    >
      <div
        className="motion-safe:animate-duilian-marquee flex flex-col items-center"
        style={side === 'right' ? { animationDirection: 'reverse' } : undefined}
      >
        {[0, 1].map((copy) => (
          <span
            key={copy}
            lang="zh-Hans"
            className="font-serif-sc text-8xl font-light leading-none tracking-[0.25em] text-paper/25 [writing-mode:vertical-rl]"
          >
            {half}
          </span>
        ))}
      </div>
    </div>
  );
}
