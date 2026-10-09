import { beforeAll, describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ProjectCatalog from './project-catalog';
import type { Project } from '@/content/projects';

beforeAll(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.stubGlobal('matchMedia', () => ({
    matches: true, // reduced motion: specimens render their resting frame
    addEventListener() {},
    removeEventListener() {},
  }));
});

const projects: Project[] = [
  { slug: 'trajecta', title: 'Trajecta', year: '2026', blurb: 'First blurb.', tech: ['React'], stat: { value: '82.7%', label: 'accuracy' } },
  { slug: 'no-specimen', title: 'Plain', year: '2024', blurb: 'Second blurb.', tech: [] },
];

describe('ProjectCatalog', () => {
  test('one dated link per project, to its page', () => {
    render(<ProjectCatalog projects={projects} />);
    const link = screen.getByRole('link', { name: /Trajecta/ });
    expect(link).toHaveAttribute('href', '/projects/trajecta');
    expect(link).toHaveTextContent('2026');
    expect(screen.getByRole('link', { name: /Plain/ })).toHaveAttribute('href', '/projects/no-specimen');
  });

  test('focusing a row swaps the panel to that project', () => {
    const { container } = render(<ProjectCatalog projects={projects} />);
    const panel = () => container.querySelector('aside')!;
    expect(panel()).toHaveTextContent('First blurb.');
    fireEvent.focus(screen.getByRole('link', { name: /Plain/ }));
    expect(panel()).toHaveTextContent('Second blurb.');
    // A project without a specimen still gets its details, just no drawing.
    expect(panel().querySelector('figure')).toBeNull();
  });
});
