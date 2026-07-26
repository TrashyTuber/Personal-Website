import Link from 'next/link';
import type { Project } from '@/content/projects';

/** Ordinal accents cycle through the board's number palette. */
const ORDINAL_CLASSES = [
  'text-n1',
  'text-n2',
  'text-n3',
  'text-n4',
  'text-n5',
  'text-n6',
  'text-n7',
  'text-n8',
];

export default function LatticeFrame({
  project,
  index,
  className = '',
}: {
  project: Project;
  index: number;
  /** Grid span classes from the page's lattice pattern. */
  className?: string;
}) {
  const ordinal = ORDINAL_CLASSES[index % ORDINAL_CLASSES.length];
  return (
    <Link
      href={`/projects/${project.slug}`}
      className={`group relative flex flex-col overflow-hidden border border-hairline-2 p-6 transition-colors duration-300 hover:bg-surface focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-vermilion motion-reduce:transition-none ${className}`}
    >
      <span className="absolute -left-px -top-px h-2 w-2 border-l-2 border-t-2 border-vermilion" />
      {/* Watermark ordinal: the number palette at mural scale, bleeding out of
          the corner the way the duilian sits behind the homepage. */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute -bottom-6 -right-2 select-none font-mono-game text-[7rem] font-bold leading-none opacity-[0.08] ${ordinal}`}
      >
        {index + 1}
      </span>
      {/* No flex-wrap: the ordinal stays put and long titles wrap within
          their own column, so every card leads the same way. */}
      <div className="flex items-baseline gap-3">
        <span className={`font-mono-game text-sm font-bold ${ordinal}`}>
          {index + 1}
        </span>
        <h2 className="min-w-0 text-2xl font-light md:text-3xl">
          {project.title}
        </h2>
        {project.zh && (
          <span lang="zh-Hans" className="text-base text-muted">
            {project.zh}
          </span>
        )}
      </div>
      <p className="mt-3 max-w-prose text-base leading-relaxed text-muted">
        {project.blurb}
      </p>
      <p className="mt-auto pt-4 font-mono-game text-xs text-faint">
        {/* An empty tech list would otherwise render a bare " — 2024". */}
        {project.tech.length
          ? `${project.tech.join(' · ')} — ${project.year}`
          : project.year}
      </p>
    </Link>
  );
}
