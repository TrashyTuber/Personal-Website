export interface Project {
  slug: string;
  title: string;
  /** Optional hanzi accent — currently unused for projects by owner decision. */
  zh?: string;
  year: string;
  blurb: string;
  tech: string[];
  featured?: boolean;
  /** One headline number for the projects index, taken from the body text. */
  stat?: { value: string; label: string };
  links?: { label: string; href: string }[];
  /** Case-study paragraphs; a project without a body still gets a detail page showing metadata. */
  body?: string[];
}

export const projects: Project[] = [
  {
    slug: 'trajecta',
    title: 'Trajecta',
    year: '2026',
    blurb:
      'An AI college-admissions planning platform with 100+ active users — committee-grade application review without the private-consultant price tag.',
    tech: ['React', 'TypeScript', 'Express', 'Supabase', 'Anthropic API'],
    stat: { value: '82.7%', label: 'accuracy on real admissions outcomes · 58% baseline' },
    featured: true,
    body: [
      'Trajecta is a full-stack admissions planning platform I co-founded and lead engineering for, now serving 100+ active users: a React/Vite front end over an Express/TypeScript API on Render, with Supabase for Postgres and auth. It exists because committee-quality application feedback is mostly locked behind private consultants.',
      'The core is a multi-agent LLM committee: several simulated admissions readers evaluate an application, constrained by fixed JSON output schemas — the models argue inside guardrails rather than free-associating. An eval harness scores it against 100 real admissions outcomes: 82.7% accuracy against a 58% baseline. A six-category chancing engine calibrates against Common Data Set percentiles, correcting the self-report bias that plagues chancing tools.',
      'Documents enter through a PDF import pipeline that strips metadata and enforces schema constraints before anything reaches a model: untrusted uploads are treated as a prompt-injection surface, not just files.',
      'Around it: GitHub Actions CI (lint, type-check, 78 Vitest test files), Stripe subscription billing, and rate limiting on every LLM call.',
    ],
  },
  {
    slug: 'melody-harmonizer',
    title: 'Melody Harmonizer',
    year: '2026',
    blurb:
      'A neural network that harmonizes a melody — one chord per note — with a live demo that plays it back as MIDI and audio.',
    tech: ['Python', 'PyTorch', 'music21', 'Gradio'],
    stat: { value: '66.8%', label: 'exact chord accuracy · 25% baseline' },
    links: [{ label: 'demo', href: 'https://huggingface.co/spaces/Trazhytuber/Melody_Harmonizer' }],
    body: [
      'A BiLSTM sequence-labeling model predicts a chord for every melody note, trained on the Nottingham folk dataset. The chord vocabulary is transposition-closed (121 chords), the data is augmented across all 12 keys, and train/test splits are made by song so transposed copies never leak across.',
      'Benchmarked against a size-matched Transformer encoder over three seeds, the BiLSTM led on every metric: 66.8% exact and 76.8% key-aware functional accuracy on a held-out test set, against a 25% baseline.',
      'Raw per-note predictions change chords too often, so a learned chord-transition Viterbi decoder smooths them, bringing the chord-change rate from 8% over ground truth to within 5%. It runs as a Gradio app on Hugging Face Spaces with MIDI and audio output.',
    ],
  },
  {
    slug: 'live-coding',
    title: 'Algorithmic Live Coding',
    year: '2025',
    blurb:
      'Music performed by writing code in real time — 2nd place at the BitCrush Hackathon; a recording passed 250,000 views.',
    tech: ['JavaScript', 'Strudel'],
    stat: { value: '250k', label: 'views on one recorded set' },
    body: [
      'Music performed by programming it live: algorithms in Strudel generate and mutate musical patterns in front of the audience, with the code as the score. The set took 2nd place at the BitCrush Hackathon, and a recording surpassed 250,000 views on Instagram.',
      'The follow-up is a four-track EP synthesized entirely from code, produced with an entertainment company.',
    ],
  },
  {
    slug: 'prophet-hacks',
    title: 'Prophet Hacks',
    year: '2026',
    blurb:
      'An automated prediction-market trading system with a two-stage LLM architecture and fractional-Kelly risk management.',
    tech: ['Python', 'LLMs'],
    stat: { value: '1,200', label: 'markets in the backtest' },
    body: [
      'Two models share the desk: a scout proposes probabilities, and a judge vetoes overconfident trades. Position sizing is fractional-Kelly with per-market exposure limits, stop-loss, and take-profit rules.',
      'A market classifier routes each question to external data — FRED, Open-Meteo, news, sports odds — and a probability-calibration layer shrinks estimates toward market-implied prices. An offline backtesting harness evaluates strategy calibration against a 1,200-market dataset, reporting per-category Brier scores.',
    ],
  },
  {
    slug: 'patches-infinity',
    title: 'Patches Infinity',
    year: '2026',
    blurb: 'A browser puzzle game with an endless procedural generator — playable now.',
    tech: ['React', 'Vite', 'JavaScript'],
    stat: { value: '∞', label: 'puzzles, every one solvable, none repeated' },
    links: [{ label: 'play', href: 'https://patchesinfinity.com' }],
    body: [
      'A procedural generator partitions grids into non-overlapping rectangles via area-weighted sampling with a constraint-checked retry loop — every puzzle solvable, none repeated.',
      'A seeded clue system, drag-to-draw input with real-time area and shape validation, undo history, and localStorage persistence carry the game feel.',
    ],
  },
];
