import type { Metadata } from 'next';
import LatticeFrame from '@/components/lattice-frame';
import { projects } from '@/content/projects';

export const metadata: Metadata = { title: 'Projects — Yiming Jia' };

export default function ProjectsPage() {
  const ordered = [
    ...projects.filter((p) => p.featured),
    ...projects.filter((p) => !p.featured),
  ];
  const rows: (typeof ordered)[] = [];
  for (let i = 0; i < ordered.length; i += 2) rows.push(ordered.slice(i, i + 2));

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-lg tracking-[0.5em] text-paper">
        PROJECTS{' '}
        <span className="font-serif-sc text-sm tracking-normal text-faint">
          / <span lang="zh-Hans">项目</span>
        </span>
      </h1>
      <div className="mt-10 flex flex-col gap-3">
        {rows.map((row, r) => (
          <div key={r} className="flex flex-col gap-3 md:flex-row">
            {row.map((project, i) => (
              <LatticeFrame
                key={project.slug}
                project={project}
                index={r * 2 + i}
                wide={r === 0 && i === 0}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
