import Link from 'next/link';
import type { Project } from '@/content/projects';

const ORDINAL_CLASSES = ['text-n1', 'text-n2', 'text-n3', 'text-muted'];

export default function LatticeFrame({
  project,
  index,
  wide = false,
}: {
  project: Project;
  index: number;
  wide?: boolean;
}) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className={`group relative block border border-hairline-2 p-6 transition-all duration-300 hover:bg-surface focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-vermilion motion-reduce:transition-none md:hover:flex-[2] ${
        wide ? 'md:flex-[1.6]' : 'md:flex-1'
      }`}
    >
      <span className="absolute -left-px -top-px h-2 w-2 border-l-2 border-t-2 border-vermilion" />
      <div className="flex flex-wrap items-baseline gap-3">
        <span
          className={`font-mono-game text-sm font-bold ${ORDINAL_CLASSES[Math.min(index, 3)]}`}
        >
          {index + 1}
        </span>
        <h2 className="text-3xl font-light">{project.title}</h2>
        <span lang="zh-Hans" className="text-base text-muted">
          {project.zh}
        </span>
      </div>
      <p className="mt-3 max-w-prose text-base leading-relaxed text-muted">
        {project.blurb}
      </p>
      <p className="mt-4 font-mono-game text-xs text-faint">
        {/* An empty tech list would otherwise render a bare " — 2024". */}
        {project.tech.length
          ? `${project.tech.join(' · ')} — ${project.year}`
          : project.year}
      </p>
    </Link>
  );
}
