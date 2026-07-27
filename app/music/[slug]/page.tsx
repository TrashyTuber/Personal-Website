import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasDetail, pieces } from '@/content/music';

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-vermilion';

export function generateStaticParams() {
  return pieces.filter(hasDetail).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const piece = pieces.find((p) => p.slug === slug);
  // Mirrors the page's own guard: a slug that exists but has no detail page
  // 404s, so it must not advertise a real title.
  return {
    title: piece && hasDetail(piece) ? `${piece.title} — Yiming Jia` : 'Music',
  };
}

export default async function PiecePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const piece = pieces.find((p) => p.slug === slug);
  if (!piece || !hasDetail(piece)) notFound();

  return (
    <article className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-center text-sm tracking-[0.6em] text-muted">
        {piece.instrumentation}
      </p>
      <h1 className="mt-3 text-center font-display-sc text-3xl font-light">
        {piece.title}
      </h1>
      <p className="mt-2 text-center font-mono-game text-sm text-faint">
        {piece.year}
      </p>
      <div className="mx-auto mt-6 h-px w-16 bg-hairline-2" />
      {piece.audioSrc && (
        <audio
          controls
          src={piece.audioSrc}
          className="mx-auto mt-10 w-full [color-scheme:dark]"
        />
      )}
      {piece.programNotes?.map((paragraph, i) => (
        <p key={i} className="mt-6 text-lg leading-loose text-muted">
          {paragraph}
        </p>
      ))}
      {piece.scoreUrl && (
        <p className="mt-8 text-center">
          <a
            href={piece.scoreUrl}
            target="_blank"
            rel="noopener"
            className={`font-mono-game text-sm text-vermilion-text transition-colors hover:text-paper ${FOCUS_RING}`}
          >
            view score <span aria-hidden="true">↗</span>
          </a>
        </p>
      )}
    </article>
  );
}
