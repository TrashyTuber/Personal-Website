import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import MusicRow from './music-row';
import type { MusicPiece } from '@/content/music';

const withAudio: MusicPiece = {
  slug: 'quartet',
  title: 'String Quartet',
  instrumentation: 'string quartet',
  year: 2025,
  audioSrc: '/audio/quartet.mp3',
};

const metadataOnly: MusicPiece = {
  slug: 'etude',
  title: 'Etude',
  instrumentation: 'solo piano',
  year: 2024,
};

describe('MusicRow', () => {
  test('pieces with detail render as links to their page', () => {
    render(<MusicRow piece={withAudio} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/music/quartet');
  });

  test('metadata-only pieces render as plain rows, not links', () => {
    render(<MusicRow piece={metadataOnly} />);
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('Etude')).toBeInTheDocument();
  });
});
