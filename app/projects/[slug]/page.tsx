import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { projects } from '@/content/projects';

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-vermilion';

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  return { title: project ? `${project.title} — Yiming Jia` : 'Project' };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) notFound();

  return (
    <article className="mx-auto max-w-2xl px-6 py-16">
      <p className="font-mono-game text-[10px] tracking-[0.3em] text-faint">
        PROJECT — {project.year}
      </p>
      <div className="mt-4 flex flex-wrap items-baseline gap-4">
        <h1 className="text-4xl font-light">{project.title}</h1>
        <span lang="zh-Hans" className="text-lg text-muted">
          {project.zh}
        </span>
      </div>
      <div className="mt-2 h-px w-24 bg-hairline-2" />
      <p className="mt-6 text-lg leading-relaxed text-paper">{project.blurb}</p>
      {project.body?.map((paragraph, i) => (
        <p key={i} className="mt-5 leading-loose text-muted">
          {paragraph}
        </p>
      ))}
      <p className="mt-8 font-mono-game text-xs text-faint">
        {project.tech.join(' · ')}
      </p>
      {project.links && (
        <div className="mt-6 flex flex-wrap gap-5">
          {project.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener"
              className={`font-mono-game text-xs text-vermilion-text transition-colors hover:text-paper ${FOCUS_RING}`}
            >
              {link.label} <span aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      )}
    </article>
  );
}
