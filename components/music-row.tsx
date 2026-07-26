import Link from 'next/link';
import { hasDetail, type MusicPiece } from '@/content/music';

export default function MusicRow({ piece }: { piece: MusicPiece }) {
  const row = (
    <div className="flex items-baseline gap-4 border-b border-hairline py-4">
      <span className="text-xl font-light">{piece.title}</span>
      {hasDetail(piece) && (
        <span aria-hidden className="text-sm text-vermilion">
          ◉
        </span>
      )}
      <span className="flex-1" />
      <span className="font-mono-game text-sm text-muted">
        {[piece.instrumentation, piece.duration, String(piece.year)]
          .filter(Boolean)
          .join(' · ')}
      </span>
    </div>
  );

  return hasDetail(piece) ? (
    <Link
      href={`/music/${piece.slug}`}
      className="block transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-vermilion"
    >
      {row}
    </Link>
  ) : (
    <div>{row}</div>
  );
}
