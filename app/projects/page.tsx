import type { Metadata } from 'next';
import LatticeFrame from '@/components/lattice-frame';
import { projects, type Project } from '@/content/projects';

export const metadata: Metadata = { title: 'Projects — Yiming Jia' };

/**
 * The lattice is rule-driven so the layout survives any project count without
 * hand-rebalancing: the featured frame is wide, every other frame takes its
 * size from a repeating pattern, and the dense grid flow packs whatever the
 * content file holds. Adding a project is one entry in content/projects.ts.
 */
// Only wide/single shapes: every width sums to the 3-column track, so the
// grid packs at any count with at most one natural gap in the final row.
// (Row-spans made striking shapes but left real holes at the tail.)
const SIZE_CYCLE = ['', 'md:col-span-2', '', '', 'md:col-span-2', ''];
const FEATURED_SPAN = 'md:col-span-2';

function spanFor(project: Project, i: number): string {
  if (project.featured) return FEATURED_SPAN;
  return SIZE_CYCLE[i % SIZE_CYCLE.length];
}

export default function ProjectsPage() {
  const ordered = [
    ...projects.filter((p) => p.featured),
    ...projects.filter((p) => !p.featured),
  ];

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
        {ordered.map((project, i) => (
          <LatticeFrame
            key={project.slug}
            project={project}
            index={i}
            className={spanFor(project, i)}
          />
        ))}
      </div>
    </div>
  );
}
