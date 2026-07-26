import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Not found — Yiming Jia' };

/**
 * Next's built-in 404 ships an unlayered `body { background: #fff }`, which
 * beats Tailwind's layered utilities and leaves a white page against the dark
 * spine. Owning the route keeps the site's ink background and typography.
 */
export default function NotFound() {
  return (
    <div className="mx-auto min-h-[60vh] max-w-xl px-6 py-16 text-center">
      <p lang="zh-Hans" className="text-sm tracking-[0.6em] text-muted">
        未 找 到
      </p>
      <h1 className="mt-2 text-4xl font-light">Page not found</h1>
      <p className="mt-3 font-mono-game text-sm text-faint">
        404 — this tile is empty
      </p>
      <div className="mx-auto mt-6 h-px w-16 bg-hairline-2" />
      <p className="mt-10">
        <Link
          href="/"
          className="font-mono-game text-sm text-vermilion-text transition-colors hover:text-paper focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-vermilion"
        >
          <span aria-hidden="true">←</span> back to the board
        </Link>
      </p>
    </div>
  );
}
