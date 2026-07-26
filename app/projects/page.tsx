import type { Metadata } from 'next';
import LatticeFrame from '@/components/lattice-frame';
import { projects, type Project } from '@/content/projects';

export const metadata: Metadata = { title: 'Projects — Yiming Jia' };

/**
 * Experiment toggle: frames start as vermilion "unrevealed tiles" and sweep
 * clear on hover. Flip to false to fall back to plain open frames.
 */
const REVEAL_FACES = true;

/**
 * The lattice is rule-driven so the layout survives any project count without
 * hand-rebalancing: the featured frame is large, every other frame takes its
 * size from a repeating pattern, and empty hairline cells (negative space — a
 * first-class element of a lattice window) are inserted on a fixed cadence.
 * Adding a project is one entry in content/projects.ts; the dense grid flow
 * re-composes everything else.
 */
const SIZE_CYCLE = [
  'md:row-span-2', // tall
  '', // single
  'md:col-span-2', // wide
  '', // single
];
const FEATURED_SPAN = 'md:col-span-2 md:row-span-2';
/** One void cell after every VOID_CADENCE projects. */
const VOID_CADENCE = 3;

type LatticeItem =
  | { kind: 'project'; project: Project; index: number; span: string }
  | { kind: 'void'; key: string };

function buildLattice(ordered: Project[]): LatticeItem[] {
  const items: LatticeItem[] = [];
  ordered.forEach((project, i) => {
    const span = project.featured
      ? FEATURED_SPAN
      : SIZE_CYCLE[i % SIZE_CYCLE.length];
    items.push({ kind: 'project', project, index: i, span });
    if ((i + 1) % VOID_CADENCE === 0) {
      items.push({ kind: 'void', key: `void-${i}` });
    }
  });
  return items;
}

export default function ProjectsPage() {
  const ordered = [
    ...projects.filter((p) => p.featured),
    ...projects.filter((p) => !p.featured),
  ];
  const lattice = buildLattice(ordered);

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16">
      <h1 className="text-lg tracking-[0.5em] text-paper">
        PROJECTS{' '}
        <span className="font-serif-sc text-sm tracking-normal text-faint">
          / <span lang="zh-Hans">项目</span>
        </span>
      </h1>
      {/* Dense flow lets later frames backfill gaps the spans leave behind,
          so the mosaic stays packed at any project count. */}
      <div className="mt-10 grid grid-cols-1 gap-3 md:auto-rows-[minmax(11rem,auto)] md:grid-cols-3 md:[grid-auto-flow:dense]">
        {lattice.map((item) =>
          item.kind === 'project' ? (
            <LatticeFrame
              key={item.project.slug}
              project={item.project}
              index={item.index}
              reveal={REVEAL_FACES}
              className={item.span}
            />
          ) : (
            // Deliberate negative space: an empty pane in the lattice window.
            <div
              key={item.key}
              aria-hidden="true"
              className="hidden border border-hairline-2 md:block"
            />
          ),
        )}
      </div>
    </div>
  );
}
