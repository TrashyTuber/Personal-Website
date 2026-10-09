'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Project } from '@/content/projects';
import { ORDINAL_TEXT, STATS } from './extras';
import { useInView } from './hooks';
import Specimen from './specimens';

/**
 * PROTOTYPE #2 — folio. One project per screen, sides zigzagging; the
 * specimen plays while its section is in view, and a fixed rail of
 * ordinals tracks (and jumps to) position.
 */
export default function Folio({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState(0);
  return (
    <>
      <nav
        aria-label="Projects"
        className="fixed right-4 top-1/2 z-10 hidden -translate-y-1/2 flex-col gap-3 font-mono-game text-sm lg:flex"
      >
        {projects.map((p, i) => (
          <a
            key={p.slug}
            href={`#${p.slug}`}
            aria-label={p.title}
            aria-current={i === active ? 'true' : undefined}
            className={`flex h-7 w-7 items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-vermilion ${i === active ? `${ORDINAL_TEXT[i % 8]} font-bold` : 'text-faint hover:text-paper'}`}
          >
            {i + 1}
          </a>
        ))}
      </nav>
      {projects.map((p, i) => (
        <Section key={p.slug} project={p} index={i} onActive={setActive} />
      ))}
    </>
  );
}

function Section({
  project,
  index,
  onActive,
}: {
  project: Project;
  index: number;
  onActive: (i: number) => void;
}) {
  const { ref, inView, seen } = useInView<HTMLElement>(0.3);
  useEffect(() => {
    if (inView) onActive(index);
  }, [inView, onActive, index]);
  const ordinal = ORDINAL_TEXT[index % 8];
  const stat = STATS[project.slug];
  const flip = index % 2 === 1;

  return (
    <section
      ref={ref}
      id={project.slug}
      className="grid min-h-[calc(100svh-5rem)] scroll-mt-16 items-center gap-10 border-t border-hairline py-16 lg:grid-cols-2 lg:gap-16"
    >
      <div
        className={`transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none ${seen ? 'opacity-100 motion-safe:translate-y-0' : 'opacity-0 motion-safe:translate-y-6 motion-reduce:opacity-100'} ${flip ? 'lg:order-2' : ''}`}
      >
        <span aria-hidden="true" className={`block font-display-sc text-[7rem] leading-[0.8] md:text-[10rem] ${ordinal}`}>
          {index + 1}
        </span>
        <h2 className="mt-6 font-display-sc text-4xl font-light md:text-5xl">{project.title}</h2>
        <p className="mt-3 font-mono-game text-xs text-faint">
          {project.tech.join(' · ')} — {project.year}
        </p>
        {stat && (
          <p className="mt-8 flex items-baseline gap-4">
            <span className={`font-mono-game text-5xl ${ordinal}`}>{stat.value}</span>
            <span className="font-mono-game text-xs text-faint">{stat.label}</span>
          </p>
        )}
        <p className="mt-6 max-w-prose text-lg leading-relaxed text-muted">{project.blurb}</p>
        <Link
          href={`/projects/${project.slug}`}
          className="mt-8 inline-block font-mono-game text-xs tracking-[0.3em] text-vermilion-text hover:text-paper focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-vermilion"
        >
          READ →<span className="sr-only"> {project.title}</span>
        </Link>
      </div>
      <div
        className={`relative flex aspect-[4/3] items-center border border-hairline-2 p-6 transition-opacity delay-150 duration-700 motion-reduce:transition-none md:p-10 ${seen ? 'opacity-100' : 'opacity-0 motion-reduce:opacity-100'}`}
      >
        <span className="absolute -left-px -top-px h-2 w-2 border-l-2 border-t-2 border-vermilion" />
        <div className="w-full">
          <Specimen slug={project.slug} active={inView} />
        </div>
      </div>
    </section>
  );
}
