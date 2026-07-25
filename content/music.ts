export interface MusicPiece {
  slug: string;
  title: string;
  instrumentation: string;
  year: number;
  audioSrc?: string;
  scoreUrl?: string;
  programNotes?: string[];
}

/** A piece gets its own page only when there is something substantial to show. */
export function hasDetail(piece: MusicPiece): boolean {
  return Boolean(
    piece.audioSrc || piece.scoreUrl || (piece.programNotes && piece.programNotes.length > 0),
  );
}

export const pieces: MusicPiece[] = [
  {
    slug: 'REPLACE-piece-1',
    title: 'REPLACE: piece with a recording',
    instrumentation: 'REPLACE: e.g. string quartet',
    year: 2025,
    audioSrc: '/audio/REPLACE.mp3',
    programNotes: ['REPLACE: program note paragraph.'],
  },
  {
    slug: 'REPLACE-piece-2',
    title: 'REPLACE: metadata-only piece',
    instrumentation: 'REPLACE: e.g. solo piano',
    year: 2024,
  },
];
