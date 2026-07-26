'use client';

import { useEffect, useRef } from 'react';

/**
 * Fraction of the page's scroll offset a column drifts by, and the cap on that
 * drift. Small on purpose: the couplet should breathe against the board, not
 * slide past it.
 */
const DRIFT_RATE = 0.06;
const DRIFT_CAP_PX = 40;

export interface DuilianProps {
  /**
   * Which flank this column hangs on. Traditional placement puts the 上联 on the
   * right and the 下联 on the left; here it also sets the drift direction, so
   * the two columns pull gently apart as the page moves.
   */
  side: 'left' | 'right';
  /** The line itself. */
  hanzi: string;
  /** English gloss, set below the hanzi in the same vertical flow. */
  gloss: string;
  /** Positioning comes from the caller — the component owns only its own look. */
  className?: string;
}

/**
 * One hanging column of a couplet: large, barely-there hanzi with its gloss
 * beneath, drifting slowly against the scroll.
 *
 * A client component purely for that drift. It is pure ornament — the whole
 * flank is aria-hidden, so nothing here is content a screen reader loses.
 */
export default function Duilian({
  side,
  hanzi,
  gloss,
  className = '',
}: DuilianProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Reduced motion: no listener at all, the columns simply hang still.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const direction = side === 'left' ? -1 : 1;
    let frame = 0;

    const apply = () => {
      frame = 0;
      const raw = window.scrollY * DRIFT_RATE * direction;
      const drift = Math.max(-DRIFT_CAP_PX, Math.min(DRIFT_CAP_PX, raw));
      // Written straight to the node: a setState per scroll frame would
      // re-render the page for a decorative pixel offset.
      el.style.transform = `translate3d(0, ${drift.toFixed(2)}px, 0)`;
    };

    const onScroll = () => {
      // The listener only ever schedules, so a burst of scroll events still
      // costs one style write per frame.
      if (frame === 0) frame = requestAnimationFrame(apply);
    };

    apply(); // a reload partway down the page starts already drifted
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, [side]);

  return (
    // Two elements on purpose. The outer one is positioned and centred by the
    // caller; the inner one is the drifting box and must keep an auto height,
    // because vertical text in a height-constrained box wraps into a second
    // column instead of running long. The handler owns `transform`, so no
    // transform-based centring may appear here either.
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none items-center ${className}`}
    >
      <div ref={ref} className="flex flex-col items-center gap-6">
        {/* lang is correct whether or not the flank stays aria-hidden. */}
        <span
          lang="zh-Hans"
          className="font-serif-sc text-5xl font-light leading-none tracking-[0.3em] text-paper/[0.09] [writing-mode:vertical-rl]"
        >
          {hanzi}
        </span>
        <span className="font-mono-game text-[11px] tracking-[0.08em] text-faint/50 [writing-mode:vertical-rl]">
          {gloss}
        </span>
      </div>
    </div>
  );
}
