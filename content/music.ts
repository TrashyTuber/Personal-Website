export type MusicCategory = 'Large Ensemble' | 'Chamber' | 'Solo';

export interface MusicPiece {
  slug: string;
  title: string;
  instrumentation: string;
  year: number;
  category: MusicCategory;
  /** Printed duration, concert-program style (e.g. `8'30"`). */
  duration?: string;
  audioSrc?: string;
  scoreUrl?: string;
  programNotes?: string[];
}

/** Catalog section order — mirrors the concert-program convention. */
export const CATEGORIES: { name: MusicCategory; zh: string }[] = [
  { name: 'Large Ensemble', zh: '合奏' },
  { name: 'Chamber', zh: '室内乐' },
  { name: 'Solo', zh: '独奏' },
];

/** A piece gets its own page only when there is something substantial to show. */
export function hasDetail(piece: MusicPiece): boolean {
  return Boolean(
    piece.audioSrc || piece.scoreUrl || (piece.programNotes && piece.programNotes.length > 0),
  );
}

export const pieces: MusicPiece[] = [
  {
    slug: 'a-shimmer-in-the-burgeoning-blue',
    title: 'A Shimmer in the Burgeoning Blue',
    // Forces: 2+picc.2+EH.2.2, 4.2.3.1, timp+2 perc, harp, strings
    instrumentation: 'symphony orchestra',
    year: 2024,
    category: 'Large Ensemble',
    duration: `8'30"`,
  },
  {
    slug: 'quest-for-horizon',
    title: 'Quest for Horizon',
    instrumentation: 'wind ensemble',
    year: 2024,
    category: 'Large Ensemble',
    duration: `8'`,
  },
  {
    slug: 'jetlag',
    title: 'Jetlag',
    instrumentation: 'violin, cello, and piano',
    year: 2025,
    category: 'Chamber',
    duration: `4'30"`,
  },
  {
    slug: 'tusk',
    title: 'Tusk',
    instrumentation: 'flute, english horn, contrabass clarinet, and tuba',
    year: 2025,
    category: 'Chamber',
    duration: `3'30"`,
  },
  {
    slug: 'onwards',
    title: 'Onwards',
    instrumentation: 'oboe, clarinet, and bassoon',
    year: 2025,
    category: 'Chamber',
    duration: `3'`,
  },
  {
    slug: 'chase-for-a-bygone-memory',
    title: 'Chase for a Bygone Memory',
    instrumentation: 'flute, cello, and piano',
    year: 2024,
    category: 'Chamber',
    duration: `5'`,
  },
  {
    slug: 'reverberance',
    title: 'Reverberance',
    instrumentation: 'oboe, 2 clarinets, and tuba',
    year: 2024,
    category: 'Chamber',
    duration: `3'`,
  },
  {
    slug: 'liberosis',
    title: 'Liberosis',
    instrumentation: 'flute, clarinet, harp, and vibraphone',
    year: 2023,
    category: 'Chamber',
    duration: `10'`,
  },
  {
    slug: 'long-weekend',
    title: 'Long Weekend',
    instrumentation: 'clarinet and piano',
    year: 2023,
    category: 'Chamber',
    duration: `5'`,
  },
  {
    slug: 'breeze',
    title: 'Breeze',
    instrumentation: 'clarinet quartet',
    year: 2023,
    category: 'Chamber',
    duration: `2'30"`,
  },
  {
    slug: 'a-message-from-500-years-beyond',
    title: 'A Message from 500 Years Beyond',
    instrumentation: 'solo viola',
    year: 2024,
    category: 'Solo',
    duration: `2'`,
  },
  {
    slug: 'across-the-night-sky',
    title: 'Across the Night Sky',
    instrumentation: 'solo piano',
    year: 2023,
    category: 'Solo',
    duration: `4'30"`,
  },
];
