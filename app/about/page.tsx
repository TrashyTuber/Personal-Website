import type { Metadata } from 'next';

export const metadata: Metadata = { title: '关于 About — Yiming Jia' };

const SECTIONS: { zh: string; en: string; body: string[] }[] = [
  {
    zh: '出身',
    en: 'Origins',
    body: [
      'REPLACE: Born in Shanghai; moved to the US. A paragraph about that arc and what stuck — including the pull of the minimalism and neo-Chinese architecture rediscovered on a recent visit back.',
    ],
  },
  {
    zh: '现在',
    en: 'Now',
    body: [
      'REPLACE: Studying CS (BA) and Music Composition (BM, Bienen) at Northwestern. What each side feeds; why both.',
    ],
  },
  {
    zh: '扫雷',
    en: 'Sweeping',
    body: [
      'REPLACE: A short word on minesweeper — 52s expert, 14s intermediate — and why a decades-old grid game earns a whole page on this site.',
    ],
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-lg tracking-[0.5em] text-paper">
        ABOUT{' '}
        <span className="font-serif-sc text-sm tracking-normal text-faint">
          / <span lang="zh-Hans">关于</span>
        </span>
      </h1>
      {SECTIONS.map((section) => (
        <section key={section.en} className="mt-16">
          <div className="flex items-baseline gap-3">
            <h2 className="text-2xl font-light">{section.en}</h2>
            <span
              lang="zh-Hans"
              className="font-serif-sc text-base text-faint"
            >
              {section.zh}
            </span>
          </div>
          <div className="mt-3 h-px w-12 bg-hairline-2" />
          {section.body.map((paragraph, i) => (
            <p key={i} className="mt-5 text-lg leading-loose text-muted">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </div>
  );
}
