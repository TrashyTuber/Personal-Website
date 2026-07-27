import Link from 'next/link';
import { hasDetail, type MusicPiece } from '@/content/music';

export default function MusicRow({ piece }: { piece: MusicPiece }) {
  const row = (
    <div className="border-b border-hairline py-4 sm:flex sm:items-baseline sm:gap-4">
      <span className="font-display-sc text-lg font-light">{piece.title}</span>
      {hasDetail(piece) && (
        <span aria-hidden className="ml-2 text-sm text-vermilion sm:ml-0">
          ◉
        </span>
      )}
      <span className="hidden sm:block sm:flex-1" />
      {/* From sm up, instrumentation holds one unwrapped right-aligned line
          with the quieter duration · year pair beneath — a force list
          wrapping mid-phrase read as bad typesetting (owner call). Below sm
          the row stacks and the longest lists may wrap: the 12px type floor
          times a 50-character instrumentation is wider than a phone. */}
      <span className="mt-1 flex flex-col gap-0.5 sm:mt-0 sm:items-end sm:text-right">
        <span className="font-mono-game text-xs text-muted sm:whitespace-nowrap">
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
