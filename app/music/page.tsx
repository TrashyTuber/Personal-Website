import type { Metadata } from 'next';
import MusicRow from '@/components/music-row';
import { pieces } from '@/content/music';

export const metadata: Metadata = { title: '音乐 Music — Yiming Jia' };

export default function MusicPage() {
  const ordered = [...pieces].sort((a, b) => b.year - a.year);
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="text-center">
        <p lang="zh-Hans" className="text-sm tracking-[0.6em] text-muted">
          音 乐 目 录
        </p>
        <h1 className="mt-2 text-4xl font-light">Music Catalog</h1>
        <div className="mx-auto mt-4 h-px w-16 bg-hairline-2" />
      </div>
      <div className="mt-12">
        {ordered.map((piece) => (
          <MusicRow key={piece.slug} piece={piece} />
        ))}
      </div>
      <p className="mt-8 text-center font-mono-game text-xs text-faint">
        ◉ = recording, score, or notes available
      </p>
    </div>
  );
}
