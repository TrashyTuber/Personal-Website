import type { Metadata } from 'next';
import { orderedProjects } from '@/components/proto/extras';
import Folio from '@/components/proto/folio';
import ProtoSwitch from '@/components/proto/proto-switch';

export const metadata: Metadata = {
  title: 'Projects (prototype #2) — Yiming Jia',
  robots: { index: false },
};

export default function FolioProto() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16 lg:pr-16">
      <ProtoSwitch current="folio" />
      <h1 className="mb-4 font-mono-game text-lg tracking-[0.5em] text-paper">
        PROJECTS{' '}
        <span className="text-sm tracking-normal text-faint">
          / <span lang="zh-Hans" className="font-display-sc">项目</span>
        </span>
      </h1>
      <Folio projects={orderedProjects()} />
    </div>
  );
}
