'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/projects', zh: '项目', en: 'Projects', lang: 'zh-Hans' },
  { href: '/music', zh: '音乐', en: 'Music', lang: 'zh-Hans' },
  { href: '/about', zh: '关于', en: 'About', lang: 'zh-Hans' },
  { href: '/minesweeper', zh: '扫雷', en: 'Minesweeper', lang: 'zh-Hans' },
  { href: '/cv.pdf', zh: 'CV', en: 'CV', lang: undefined },
];

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-vermilion';

function navLinkProps(pathname: string, href: string, extra: string) {
  const active = href !== '/cv.pdf' && pathname.startsWith(href);
  return {
    className: `${extra} text-sm tracking-[0.35em] transition-colors hover:text-paper ${FOCUS_RING} ${
      active ? 'text-vermilion-text' : 'text-muted'
    }`,
    'aria-current': active ? ('page' as const) : undefined,
  };
}

/** Shared by both breakpoint variants; `extra` carries the layout-specific classes. */
function NavItems({ pathname, extra }: { pathname: string; extra: string }) {
  return (
    <>
      {NAV.map((item) =>
        // /cv.pdf is a static asset, not a route — plain anchor, new tab.
        item.href === '/cv.pdf' ? (
          <a
            key={item.href}
            href={item.href}
            target="_blank"
            rel="noopener"
            aria-label={item.en}
            {...navLinkProps(pathname, item.href, extra)}
          >
            {item.zh}
          </a>
        ) : (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.en}
            {...navLinkProps(pathname, item.href, extra)}
          >
            <span lang={item.lang}>{item.zh}</span>
          </Link>
        ),
      )}
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
          <NavItems
            pathname={pathname}
            extra="[writing-mode:vertical-rl] [text-orientation:upright]"
          />
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
          <NavItems pathname={pathname} extra="py-2 -my-2" />
        </nav>
      </header>
    </>
  );
}
