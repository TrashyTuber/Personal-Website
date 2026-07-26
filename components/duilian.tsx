/**
 * One hanging column of a couplet: large vertical hanzi with its gloss beneath,
 * floating slowly in place like a scroll hanging in moving air.
 *
 * Pure ornament and pure CSS: the drift is a keyframe loop (the homepage does
 * not scroll, so scroll-linked motion would never fire), gated behind
 * motion-safe so reduced-motion users get a still column. No client JS.
 */

/**
 * The two flanks float in opposite phase: the left column starts mid-cycle so
 * the pair breathes apart rather than bobbing in unison.
 */
const PHASE_OFFSET = '-7s';

export interface DuilianProps {
  /**
   * Which flank this column hangs on. Traditional placement puts the 上联 on
   * the right and the 下联 on the left; here it also sets the float phase.
   */
  side: 'left' | 'right';
  /** The line itself. */
  hanzi: string;
  /** English gloss, set below the hanzi in the same vertical flow. */
  gloss: string;
  /** Positioning comes from the caller — the component owns only its own look. */
  className?: string;
}

export default function Duilian({
  side,
  hanzi,
  gloss,
  className = '',
}: DuilianProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none items-center ${className}`}
    >
      <div
        className="motion-safe:animate-duilian-drift flex flex-col items-center gap-8"
        style={side === 'left' ? { animationDelay: PHASE_OFFSET } : undefined}
      >
        {/* lang is correct whether or not the flank stays aria-hidden. */}
        <span
          lang="zh-Hans"
          className="font-serif-sc text-7xl font-light leading-none tracking-[0.25em] text-paper/25 [writing-mode:vertical-rl]"
        >
          {hanzi}
        </span>
        <span className="font-mono-game text-xs tracking-[0.08em] text-faint [writing-mode:vertical-rl]">
          {gloss}
        </span>
      </div>
    </div>
  );
}
