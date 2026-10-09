'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { Project } from '@/content/projects';
import { ORDINAL_TEXT, STATS } from './extras';
import { useInView } from './hooks';
import Specimen from './specimens';

/**
 * PROTOTYPE #1 — catalog index. A typographic contents page on the left;
 * hovering or focusing a row plays that project's specimen in a fixed panel
 * on the right. Rows never change size, so the list itself never moves.
 * Below lg the panel folds into each row and plays when scrolled into view.
 */
export default function Catalog({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState(0);
  const current = projects[active];
  const stat = STATS[current.slug];

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <ol className="border-t border-hairline">
        {projects.map((project, i) => (
          <Row
            key={project.slug}
            project={project}
            index={i}
            on={i === active}
            onActivate={() => setActive(i)}
          />
        ))}
      </ol>

      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <div
            key={current.slug}
            className="motion-safe:animate-[specimen-fade_300ms_ease-out]"
          >
            <div className="relative flex aspect-[4/3] items-center border border-hairline-2 p-6">
              <span className="absolute -left-px -top-px h-2 w-2 border-l-2 border-t-2 border-vermilion" />
              <div className="w-full">
                <Specimen slug={current.slug} active />
              </div>
            </div>
            {stat && (
              <p className="mt-6 flex items-baseline gap-4">
                <span className={`font-mono-game text-5xl ${ORDINAL_TEXT[active % 8]}`}>
                  {stat.value}
                </span>
                <span className="font-mono-game text-xs text-faint">{stat.label}</span>
              </p>
            )}
            <p className="mt-4 text-base leading-relaxed text-muted">{current.blurb}</p>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Row({
  project,
  index,
  on,
  onActivate,
}: {
  project: Project;
  index: number;
  on: boolean;
  onActivate: () => void;
}) {
  const { ref, inView } = useInView<HTMLLIElement>(0.5);
  const ordinal = ORDINAL_TEXT[index % 8];
  const stat = STATS[project.slug];
  return (
    <li ref={ref} className="border-b border-hairline">
      <Link
        href={`/projects/${project.slug}`}
        onMouseEnter={onActivate}
        onFocus={onActivate}
        className="group relative grid grid-cols-[3rem_minmax(0,1fr)_auto] items-baseline gap-x-4 py-7 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-vermilion md:grid-cols-[4.5rem_minmax(0,1fr)_auto]"
      >
        <span
          aria-hidden="true"
          className={`absolute -left-4 top-0 h-full w-0.5 origin-top bg-vermilion transition-transform duration-300 motion-reduce:transition-none ${on ? 'scale-y-100' : 'scale-y-0'} max-lg:hidden`}
        />
        <span
          aria-hidden="true"
          className={`font-display-sc text-4xl leading-none transition-opacity duration-300 md:text-6xl ${ordinal} ${on ? 'opacity-100' : 'opacity-40 max-lg:opacity-100'}`}
        >
          {index + 1}
        </span>
        <span className="min-w-0">
          <span
            className={`block font-display-sc text-3xl font-light transition-colors duration-300 md:text-4xl ${on ? 'text-paper' : 'text-muted max-lg:text-paper'}`}
          >
            {project.title}
          </span>
          <span className="mt-2 block font-mono-game text-xs text-faint">
            {project.tech.join(' · ')}
          </span>
        </span>
        <span className="font-mono-game text-xs text-faint">{project.year}</span>

        {/* Below lg: the specimen panel folds into the row. */}
        <span className="col-span-3 mt-6 block lg:hidden">
          <span className="block border border-hairline-2 p-4">
            <Specimen slug={project.slug} active={inView} />
          </span>
          {stat && (
            <span className="mt-4 flex items-baseline gap-3">
              <span className={`font-mono-game text-3xl ${ordinal}`}>{stat.value}</span>
              <span className="font-mono-game text-xs text-faint">{stat.label}</span>
            </span>
          )}
          <span className="mt-3 block text-base leading-relaxed text-muted">{project.blurb}</span>
        </span>
      </Link>
    </li>
  );
}
