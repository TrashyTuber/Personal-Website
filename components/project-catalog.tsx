'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { Project } from '@/content/projects';
import { useInView } from '@/lib/use-motion';
import Specimen, { hasSpecimen } from './project-specimens';

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-vermilion';

/**
 * The projects index: a dated contents list on the left; hovering or
 * focusing a row plays that project's specimen in a sticky panel on the
 * right. Rows never change size, so the list itself never moves (per-card
 * resize fought itself — see CLAUDE.md). Below lg the panel folds into each
 * row and plays while scrolled into view.
 */
export default function ProjectCatalog({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState(0);
  const current = projects[active];

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
      <ol className="border-t border-hairline">
        {projects.map((project, i) => (
          <Row
            key={project.slug}
            project={project}
            on={i === active}
            onActivate={() => setActive(i)}
          />
        ))}
      </ol>

      <aside aria-hidden="true" className="hidden lg:block">
        {/* Decorative on desktop: every word here is also in the row's
            link or the project page, so screen readers skip the echo. */}
        <div className="sticky top-24">
          <div key={current.slug} className="motion-safe:animate-[specimen-fade_300ms_ease-out]">
            {hasSpecimen(current.slug) && (
              <div className="relative border border-hairline p-8">
                <span className="absolute -left-px -top-px h-2 w-2 border-l border-t border-vermilion" />
                <Specimen slug={current.slug} active />
              </div>
            )}
            <Details project={current} />
          </div>
        </div>
      </aside>
    </div>
  );
}

function Details({ project }: { project: Project }) {
  return (
    <>
      {project.stat && (
        <p className="mt-6 flex items-baseline gap-3">
          <span className="font-mono-game text-2xl text-paper">{project.stat.value}</span>
          <span className="font-mono-game text-xs text-faint">{project.stat.label}</span>
        </p>
      )}
      <p className="mt-3 text-base leading-relaxed text-muted">{project.blurb}</p>
    </>
  );
}

function Row({
  project,
  on,
  onActivate,
}: {
  project: Project;
  on: boolean;
  onActivate: () => void;
}) {
  const { ref, inView } = useInView<HTMLLIElement>(0.5);
  return (
    <li ref={ref} className="border-b border-hairline">
      <Link
        href={`/projects/${project.slug}`}
        onMouseEnter={onActivate}
        onFocus={onActivate}
        className={`relative grid items-baseline gap-x-4 gap-y-1 py-6 sm:grid-cols-[3.5rem_minmax(0,1fr)] ${FOCUS_RING}`}
      >
        <span
          aria-hidden="true"
          className={`absolute -left-4 top-0 hidden h-full w-px origin-top bg-vermilion transition-transform duration-300 motion-reduce:transition-none lg:block ${on ? 'scale-y-100' : 'scale-y-0'}`}
        />
        <span className="font-mono-game text-xs text-faint">{project.year}</span>
        <div className="min-w-0">
          <span
            className={`block font-display-sc text-2xl font-light transition-colors duration-300 motion-reduce:transition-none md:text-3xl ${on ? 'text-paper' : 'text-paper lg:text-muted'}`}
          >
            {project.title}
          </span>
          <span className="mt-2 block font-mono-game text-xs text-faint">
            {project.tech.join(' · ')}
          </span>

          {/* Below lg the panel folds into the row. */}
          <div className="lg:hidden">
            {hasSpecimen(project.slug) && (
              <div className="mt-6 border border-hairline p-5">
                <Specimen slug={project.slug} active={inView} />
              </div>
            )}
            <Details project={project} />
          </div>
        </div>
      </Link>
    </li>
  );
}
