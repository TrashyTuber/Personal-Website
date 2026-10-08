'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/** English-only labels: the seal carries the hanzi identity. `/cv.pdf` is a
 * static asset, not a route. */
const NAV = [
  { href: '/projects', label: 'WORK' },
  { href: '/music', label: 'MUSIC' },
  { href: '/about', label: 'ABOUT' },
  { href: '/minesweeper', label: 'SWEEP' },
  { href: '/cv.pdf', label: 'RESUME' },
];

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-vermilion';

/** The 贾 seal stamp — the site's one persistent mark, and the way home. */
function Seal() {
  return (
    <Link
      href="/"
      aria-label="Home"
      className={`flex h-9 w-9 items-center justify-center rounded-[2px] bg-vermilion text-base text-seal ${FOCUS_RING}`}
    >
      <span lang="zh-Hans" className="font-display-sc">
        贾
      </span>
    </Link>
  );
}

/**
 * One bar on every page, homepage included: seal left, English labels right.
 * Identical geometry everywhere so changing pages never moves the frame.
 */
export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-hairline-2 bg-ink/90 px-4 py-3 backdrop-blur md:px-6">
      <Seal />
      <nav aria-label="Site" className="flex gap-3 md:gap-8">
        {NAV.map((item) => {
          const active = item.href !== '/cv.pdf' && pathname.startsWith(item.href);
          const className = `-my-2 py-2 font-mono-game text-xs tracking-[0.15em] transition-colors hover:text-paper md:tracking-[0.3em] ${FOCUS_RING} ${
            active ? 'text-vermilion-text' : 'text-muted'
          }`;
          const current = active ? ('page' as const) : undefined;
          return item.href === '/cv.pdf' ? (
            <a key={item.href} href={item.href} target="_blank" rel="noopener" className={className}>
              {item.label}
            </a>
          ) : (
            <Link key={item.href} href={item.href} aria-current={current} className={className}>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
