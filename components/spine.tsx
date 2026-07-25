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

function linkClass(pathname: string, href: string): string {
  const active = href !== '/cv.pdf' && pathname.startsWith(href);
  return `text-xs tracking-[0.35em] transition-colors hover:text-paper ${
    active ? 'text-vermilion' : 'text-muted'
  }`;
}

export default function Spine() {
  const pathname = usePathname();
  return (
    <>
      {/* Desktop: fixed vertical spine */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[72px] flex-col items-center border-r border-hairline-2 py-6 md:flex">
        <Link
          href="/"
          lang="zh-Hans"
          className="text-lg tracking-[0.5em] [writing-mode:vertical-rl]"
        >
          贾一茗
        </Link>
        <nav aria-label="Site" className="mt-8 flex flex-col items-center gap-5">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              lang={item.lang}
              className={`[writing-mode:vertical-rl] ${linkClass(pathname, item.href)}`}
            >
              {item.zh}
            </Link>
          ))}
        </nav>
        <Link
          href="/"
          aria-label="Home"
          lang="zh-Hans"
          className="mt-auto flex h-8 w-8 items-center justify-center rounded-[2px] bg-vermilion text-sm text-seal"
        >
          贾
        </Link>
      </aside>

      {/* Mobile: sticky top bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-hairline-2 bg-ink/90 px-4 py-3 backdrop-blur md:hidden">
        <Link href="/" lang="zh-Hans" className="tracking-[0.3em]">
          贾一茗
        </Link>
        <nav aria-label="Site" className="flex gap-4">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              lang={item.lang}
              className={linkClass(pathname, item.href)}
            >
              {item.zh}
            </Link>
          ))}
        </nav>
      </header>
    </>
  );
}
