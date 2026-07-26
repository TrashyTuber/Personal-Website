/**
 * One flank of the homepage couplet: a static inscription — large vertical
 * hanzi with the English gloss beneath, hung beside the board the way a
 * duilian hangs beside a doorway. No motion: a couplet is carved, not
 * scrolled (an earlier marquee version undermined the metaphor).
 */
export interface DuilianProps {
  /**
   * Which flank this column hangs on. Traditional placement puts the 上联 on
   * the right and the 下联 on the left.
   */
  side: 'left' | 'right';
  /** The line itself. */
  hanzi: string;
  /** English gloss, set below the hanzi in the same vertical flow. */
  gloss: string;
  /** Positioning comes from the caller — the component owns only its own look. */
  className?: string;
}

export default function Duilian({ hanzi, gloss, className = '' }: DuilianProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none flex-col items-center justify-center gap-10 ${className}`}
    >
      <span
        lang="zh-Hans"
        className="shrink-0 whitespace-nowrap font-serif-sc text-6xl font-light leading-none tracking-[0.25em] text-paper/25 [writing-mode:vertical-rl]"
      >
        {hanzi}
      </span>
      <span className="shrink-0 whitespace-nowrap font-mono-game text-xs tracking-[0.08em] text-faint [writing-mode:vertical-rl]">
        {gloss}
      </span>
    </div>
  );
}
