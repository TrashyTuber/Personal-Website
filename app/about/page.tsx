import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'About — Yiming Jia' };

/**
 * Interim page: the owner hasn't written the bio yet. One line in the site's
 * voice until the real 出身 / 现在 / 扫雷 sections land (see git history for
 * the planned structure).
 */
export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-xl px-6 py-16">
      <h1 className="font-mono-game text-lg tracking-[0.5em] text-paper">
        ABOUT{' '}
        <span className="text-sm tracking-normal text-faint">
          / <span lang="zh-Hans" className="font-display-sc">关于</span>
        </span>
      </h1>
      <div className="mt-24 flex flex-col items-center text-center">
        <p lang="zh-Hans" className="font-display-sc text-2xl font-light text-muted">
          未完待续
        </p>
        <div className="mt-6 h-px w-12 bg-hairline-2" />
        <p className="mt-6 font-mono-game text-sm text-faint">
          this page is still being written
        </p>
      </div>
    </div>
  );
}
