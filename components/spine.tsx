'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * English-first labels; `zh` is the hanzi rail that sits beside the English
 * stack on desktop only. `/cv.pdf` is a static asset, not a route.
 */
const NAV = [
  { href: '/projects', en: 'WORK', zh: '项目' },
  { href: '/music', en: 'MUSIC', zh: '音乐' },
  { href: '/about', en: 'ABOUT', zh: '关于' },
  { href: '/minesweeper', en: 'SWEEP', zh: '扫雷' },
  { href: '/cv.pdf', en: 'RESUME', zh: '简历' },
];

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-vermilion';

/** English label: upright Latin letters stacked top-to-bottom. */
const EN_VERTICAL =
  '[writing-mode:vertical-rl] [text-orientation:upright] font-mono-game text-xs tracking-[0.15em]';

/** Hanzi rail: natural CJK vertical orientation. Sized above the English —
 * CJK glyphs need more pixels than Latin for equal legibility. */
const ZH_VERTICAL = '[writing-mode:vertical-rl] font-serif-sc text-base';

type NavEntry = (typeof NAV)[number];

/**
 * One nav entry. Desktop renders the English stack plus the hanzi rail, vertically
 * centered against each other; mobile renders the English label only (no room for
 * the rail). Visible text is the accessible name — no aria-label to override it.
 */
function NavLink({
  item,
  pathname,
  variant,
}: {
  item: NavEntry;
  pathname: string;
  variant: 'desktop' | 'mobile';
}) {
  const active = item.href !== '/cv.pdf' && pathname.startsWith(item.href);
  const enColor = active ? 'text-vermilion-text' : 'text-muted';

  const props = {
    className:
      variant === 'desktop'
        ? `group flex items-center gap-1 ${FOCUS_RING}`
        : `py-2 -my-2 font-mono-game text-xs tracking-[0.15em] transition-colors hover:text-paper ${FOCUS_RING} ${enColor}`,
    'aria-current': active ? ('page' as const) : undefined,
  };

  const children =
    variant === 'desktop' ? (
      <>
        {item.zh ? (
          <span
            lang="zh-Hans"
            className={`${ZH_VERTICAL} transition-colors group-hover:text-paper ${
              active ? 'text-vermilion-text' : 'text-faint'
            }`}
          >
            {item.zh}
          </span>
        ) : null}
        <span
          className={`${EN_VERTICAL} transition-colors group-hover:text-paper ${enColor}`}
        >
          {item.en}
        </span>
      </>
    ) : (
      item.en
    );

  return item.href === '/cv.pdf' ? (
    <a href={item.href} target="_blank" rel="noopener" {...props}>
      {children}
    </a>
  ) : (
    <Link href={item.href} {...props}>
      {children}
    </Link>
  );
}

/** Shared by both breakpoint variants so they cannot drift apart. */
function NavItems({
  pathname,
  variant,
}: {
  pathname: string;
  variant: 'desktop' | 'mobile';
}) {
  return (
    <>
      {NAV.map((item) => (
        <NavLink
          key={item.href}
          item={item}
          pathname={pathname}
          variant={variant}
        />
      ))}
    </>
  );
}

export default function Spine() {
  const pathname = usePathname();
  return (
    <>
      {/* Desktop: fixed vertical spine */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[72px] flex-col items-center border-r border-hairline-2 bg-ink py-6 md:flex">
        <Link
          href="/"
          lang="zh-Hans"
          className={`text-xl tracking-[0.5em] [writing-mode:vertical-rl] [text-orientation:upright] ${FOCUS_RING}`}
        >
          贾一茗
        </Link>
        <nav aria-label="Site" className="mt-8 flex flex-col items-center gap-5">
          <NavItems pathname={pathname} variant="desktop" />
        </nav>
        <Link
          href="/"
          aria-label="Home"
          className={`mt-auto flex h-9 w-9 items-center justify-center rounded-[2px] bg-vermilion text-base text-seal ${FOCUS_RING}`}
        >
          <span lang="zh-Hans">贾</span>
        </Link>
      </aside>

      {/* Mobile: sticky top bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-hairline-2 bg-ink/90 px-4 py-3 backdrop-blur md:hidden">
        <Link
          href="/"
          lang="zh-Hans"
          className={`tracking-[0.3em] ${FOCUS_RING}`}
        >
          贾一茗
        </Link>
        <nav aria-label="Site" className="flex gap-3">
          <NavItems pathname={pathname} variant="mobile" />
        </nav>
      </header>
    </>
  );
}
