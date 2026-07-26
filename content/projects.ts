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
    blurb:
      'An AI college-admissions planning platform — committee-grade application review without the private-consultant price tag.',
    tech: ['React', 'TypeScript', 'Express', 'Prisma', 'Anthropic API'],
    featured: true,
    body: [
      'Trajecta is a full-stack admissions planning platform I co-founded and lead engineering for: a React/Vite front end over an Express/TypeScript API, Prisma on the data layer, Supabase handling auth. It exists because committee-quality application feedback is mostly locked behind private consultants.',
      'The core is a multi-agent LLM committee: several simulated admissions readers evaluate an application in parallel, constrained by fixed JSON output schemas and server-side validation — the models argue inside guardrails rather than free-associating. A six-category profile-scoring and college-chancing engine calibrates their outputs against Common Data Set percentiles, correcting the self-report bias that plagues chancing tools.',
      'Documents enter through a PDF import pipeline that strips metadata and enforces schema constraints before anything reaches a model: untrusted uploads are treated as a prompt-injection surface, not just files.',
    ],
  },
  {
    slug: 'live-coding',
    title: 'Algorithmic Live Coding',
    zh: '码乐',
    year: '2025',
    blurb:
      'Music performed by writing code in real time — 2nd place at the BitCrush Hackathon; a recording passed 250,000 views.',
    tech: ['JavaScript', 'Strudel'],
    body: [
      'Music performed by programming it live: algorithms in Strudel generate and mutate musical patterns in front of the audience, with the code as the score. The set took 2nd place at the BitCrush Hackathon, and a recording surpassed 250,000 views on Instagram.',
      'The follow-up is a four-track EP synthesized entirely from code, produced with an entertainment company.',
    ],
  },
  {
    slug: 'prophet-hacks',
    title: 'Prophet Hacks',
    zh: '先知',
    year: '2026',
    blurb:
      'An automated prediction-market trading system with a two-stage LLM architecture and fractional-Kelly risk management.',
    tech: ['Python', 'LLMs'],
    body: [
      'Two models share the desk: a scout proposes probabilities, and a judge vetoes overconfident trades. Position sizing is fractional-Kelly with per-market exposure limits, stop-loss, and take-profit rules.',
      'A market classifier routes each question to external data — FRED, Open-Meteo, news, sports odds — and a probability-calibration layer shrinks estimates toward market-implied prices. An offline backtesting harness evaluates strategy calibration against a 1,200-market dataset, reporting per-category Brier scores.',
    ],
  },
  {
    slug: 'patches-infinity',
    title: 'Patches Infinity',
    zh: '无垠',
    year: '2026',
    blurb: 'A browser puzzle game with an endless procedural generator — playable now.',
    tech: ['React', 'Vite', 'JavaScript'],
    links: [{ label: 'play', href: 'https://patchesinfinity.com' }],
    body: [
      'A procedural generator partitions grids into non-overlapping rectangles via area-weighted sampling with a constraint-checked retry loop — every puzzle solvable, none repeated.',
      'A seeded clue system, drag-to-draw input with real-time area and shape validation, undo history, and localStorage persistence carry the game feel.',
    ],
  },
  {
    slug: 'election-model',
    title: 'Election Prediction Model',
    zh: '预测',
    year: '2023',
    blurb: 'Machine-learning classifiers predicting election outcomes from historical data.',
    tech: ['Python', 'scikit-learn', 'Pandas'],
    body: [
      'An ML model predicting election outcomes from historical data — KNN, logistic regression, and random-forest classifiers implemented and compared head-to-head.',
    ],
  },
  {
    slug: 'midi-controller',
    title: 'Custom MIDI Controller',
    zh: '音控',
    year: '2022',
    blurb: 'A hardware MIDI interface with low-latency signal processing, built from scratch.',
    tech: ['C++', 'Arduino'],
    body: [
      'A MIDI controller hardware interface translating physical inputs into digital musical protocols for DAW integration, engineered around low-latency signal processing.',
    ],
  },
];
