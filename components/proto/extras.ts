import { projects, type Project } from '@/content/projects';

/**
 * PROTOTYPE: one headline number per project, lifted verbatim from each
 * project's own body text (no new claims). If a design is adopted this
 * becomes an optional `stat` field on Project in content/projects.ts.
 */
export const STATS: Record<string, { value: string; label: string } | undefined> = {
  trajecta: { value: '82.7%', label: 'accuracy on real admissions outcomes · 58% baseline' },
  'melody-harmonizer': { value: '66.8%', label: 'exact chord accuracy · 25% baseline' },
  'live-coding': { value: '250k', label: 'views on one recorded set' },
  'prophet-hacks': { value: '1,200', label: 'markets in the backtest' },
  'patches-infinity': { value: '∞', label: 'puzzles, every one solvable, none repeated' },
  'election-model': { value: '3', label: 'classifiers compared head-to-head' },
};

export const ORDINAL_TEXT = [
  'text-n1',
  'text-n2',
  'text-n3',
  'text-n4',
  'text-n5',
  'text-n6',
  'text-n7',
  'text-n8',
];

export function orderedProjects(): Project[] {
  return [...projects.filter((p) => p.featured), ...projects.filter((p) => !p.featured)];
}
