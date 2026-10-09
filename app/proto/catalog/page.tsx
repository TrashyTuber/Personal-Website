import type { Metadata } from 'next';
import Catalog from '@/components/proto/catalog';
import { orderedProjects } from '@/components/proto/extras';
import ProtoSwitch from '@/components/proto/proto-switch';

export const metadata: Metadata = {
  title: 'Projects (prototype #1) — Yiming Jia',
  robots: { index: false },
};

export default function CatalogProto() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16">
      <ProtoSwitch current="catalog" />
      <h1 className="mb-12 font-mono-game text-lg tracking-[0.5em] text-paper">
        PROJECTS{' '}
        <span className="text-sm tracking-normal text-faint">
          / <span lang="zh-Hans" className="font-display-sc">项目</span>
        </span>
      </h1>
      <Catalog projects={orderedProjects()} />
    </div>
  );
}
