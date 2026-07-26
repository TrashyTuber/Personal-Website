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
// Only wide/single shapes: every row sums to the 3-column track, so the grid
// packs at any count with at most one natural gap in the final row.
// (Row-spans made striking shapes but left real holes at the tail.)
const FEATURED_SPAN = 'md:col-span-2';
const WIDE = 'md:col-span-2';

/**
 * The wide frame zigzags sides row by row — [W s], [s W], [W s], … — so no
 * vertical seam runs down the page. Emission order decides the side (the grid
 * places items in order), giving: featured W + single, then single + wide,
 * then wide + single, repeating. Still fully rule-driven: any project count
 * packs, and adding one is a single content entry.
 */
function spanFor(project: Project, i: number): string {
  if (project.featured) return FEATURED_SPAN;
  const j = i - 1; // position among the non-featured frames
  if (j === 0) return ''; // single that completes the featured row
  const pair = Math.floor((j - 1) / 2);
  const second = (j - 1) % 2 === 1;
  return (pair % 2 === 0) === second ? WIDE : '';
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
      <div className="mt-10 grid grid-cols-1 gap-3 md:auto-rows-[minmax(8rem,auto)] md:grid-cols-3 md:[grid-auto-flow:dense]">
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
