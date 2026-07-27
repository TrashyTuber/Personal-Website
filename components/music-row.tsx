import Link from 'next/link';
import { hasDetail, type MusicPiece } from '@/content/music';

export default function MusicRow({ piece }: { piece: MusicPiece }) {
  const row = (
    <div className="flex items-baseline gap-4 border-b border-hairline py-4">
      <span className="text-lg font-light">{piece.title}</span>
      {hasDetail(piece) && (
        <span aria-hidden className="text-sm text-vermilion">
          ◉
        </span>
      )}
      <span className="flex-1" />
      {/* Instrumentation holds one line no matter what; the quieter
          duration · year pair takes the second — a long force list wrapping
          mid-phrase read as bad typesetting (owner call). */}
      <span className="flex flex-col items-end gap-0.5 text-right">
        <span className="whitespace-nowrap font-mono-game text-xs text-muted">
          {piece.instrumentation}
        </span>
        <span className="font-mono-game text-xs text-faint">
          {[piece.duration, String(piece.year)].filter(Boolean).join(' · ')}
        </span>
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
