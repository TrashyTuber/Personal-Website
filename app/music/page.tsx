import type { Metadata } from 'next';
import MusicRow from '@/components/music-row';
import { CATEGORIES, hasDetail, pieces } from '@/content/music';

export const metadata: Metadata = { title: 'Music — Yiming Jia' };

export default function MusicPage() {
  const anyDetail = pieces.some(hasDetail);
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-16">
      <div className="text-center">
        <p lang="zh-Hans" className="text-sm tracking-[0.6em] text-muted">
          音 乐 目 录
        </p>
        <h1 className="mt-2 text-4xl font-light">Music Catalog</h1>
        <div className="mx-auto mt-4 h-px w-16 bg-hairline-2" />
      </div>
      {/* Grouped the concert-program way: sections by force, newest first
          within each. Empty categories simply do not render. */}
      {CATEGORIES.map((category) => {
        const rows = pieces
          .filter((p) => p.category === category.name)
          .sort((a, b) => b.year - a.year);
        if (rows.length === 0) return null;
        return (
          <section key={category.name} className="mt-12">
            <h2 className="flex items-baseline justify-center gap-3">
              <span className="font-mono-game text-xs tracking-[0.3em] text-faint">
                {category.name.toUpperCase()}
              </span>
              <span lang="zh-Hans" className="font-serif-sc text-sm text-faint">
                {category.zh}
              </span>
            </h2>
            <div className="mt-4">
              {rows.map((piece) => (
                <MusicRow key={piece.slug} piece={piece} />
              ))}
            </div>
          </section>
        );
      })}
      {anyDetail && (
        <p className="mt-8 text-center font-mono-game text-xs text-faint">
          ◉ = recording, score, or notes available
        </p>
      )}
    </div>
  );
}
