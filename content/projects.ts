export interface Project {
  slug: string;
  title: string;
  zh: string;
  year: string;
  blurb: string;
  tech: string[];
  featured?: boolean;
  links?: { label: string; href: string }[];
  /** Case-study paragraphs; a project without a body still gets a detail page showing metadata. */
  body?: string[];
}

export const projects: Project[] = [
  {
    slug: 'trajecta',
    title: 'Trajecta',
    zh: '轨迹',
    year: '2026',
    blurb: 'REPLACE: one-line description of Trajecta.',
    tech: ['REPLACE: tech list'],
    featured: true,
    links: [{ label: 'github', href: 'https://github.com/REPLACE' }],
    body: [
      'REPLACE: what Trajecta is and why you built it.',
      'REPLACE: the interesting technical problems.',
      'REPLACE: current status and what is next.',
    ],
  },
  {
    slug: 'REPLACE-project-2',
    title: 'REPLACE: second project',
    zh: '二',
    year: 'REPLACE',
    blurb: 'REPLACE: one-line description.',
    tech: ['REPLACE'],
  },
];
