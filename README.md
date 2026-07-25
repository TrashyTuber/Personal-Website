# Yiming Jia — 贾一茗

Personal site. The homepage is a playable minesweeper board: clearing it uncovers
the tiles that link to the rest of the site. Built with Next.js (App Router) and
Tailwind CSS v4; the minesweeper rules live in a dependency-free TypeScript engine
under `lib/` with its own unit tests, separate from the React components that render it.

## Development

```bash
npm run dev        # dev server on http://localhost:3000
npm test           # vitest run
npm run typecheck  # tsc --noEmit
npm run build      # production build
```

Requires Node 20 or newer.

## Editing content

Projects and music live in `content/*.ts` as typed data — edit those files rather
than the pages. Static copy for the about page is in `app/about/page.tsx`. Assets
(CV, audio) go in `public/`.

The site spec and the implementation plan are in `docs/superpowers/`.
