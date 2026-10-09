import type { Metadata } from 'next';
import ProjectCatalog from '@/components/project-catalog';
import { projects } from '@/content/projects';

export const metadata: Metadata = { title: 'Projects — Yiming Jia' };

export default function ProjectsPage() {
  // The featured project leads and is the panel's opening specimen.
  const ordered = [
    ...projects.filter((p) => p.featured),
    ...projects.filter((p) => !p.featured),
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16">
      <h1 className="mb-12 font-mono-game text-lg tracking-[0.5em] text-paper">
        PROJECTS{' '}
        <span className="text-sm tracking-normal text-faint">
          / <span lang="zh-Hans" className="font-display-sc">项目</span>
        </span>
      </h1>
      <ProjectCatalog projects={ordered} />
    </div>
  );
}
