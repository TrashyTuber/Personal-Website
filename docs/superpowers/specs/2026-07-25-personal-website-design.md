# Personal Website — Design Spec

**Date:** 2026-07-25
**Owner:** Yiming Jia (贾一茗)
**Status:** Approved via visual brainstorming session

## 1. Concept

A dark, neo-Chinese-minimalist personal site whose front door is a **real, playable minesweeper board**. Sections of the site hide under guaranteed-safe tiles on the board; sweeping reveals them. A vertical "spine" sidebar — Yiming's name in hanzi, bilingual nav, and a vermilion seal — is the ever-present fallback navigation for visitors who don't play minesweeper.

The site presents two bodies of work in one place: **coding projects** (Trajecta foremost) and a **music composition catalog** (BM Composition, Bienen School of Music, Northwestern). The design fuses two grid traditions: the minesweeper minefield and the Chinese lattice window (花窗).

## 2. Visual Language

| Token | Value | Use |
|---|---|---|
| Background | `#0b0b0c` (near-black) | All pages |
| Surface | `#101012` – `#19191b` | Revealed tiles, panels |
| Hairline | `#1e1e20` / `#2a2a2c` | Rules, frame borders |
| Text | `#e8e4dc` (warm off-white) | Primary text |
| Muted | `#8a8a88` / `#555` | Secondary text, hints |
| Vermilion | `#c23b22` | Seal, flags, active states, section highlights |
| Number colors | `#4a9eff` (1), `#4caf50` (2), `#c23b22` (3) | Board numbers, ordinal accents on content |

- **Typography:** Noto Serif SC (hanzi + serif Latin display) with Georgia/serif fallback; a monospace face (Courier New stack or similar) for game UI, timers, and small technical labels.
- **Motifs:** vermilion seal stamp (贾), vertical writing-mode text, hairline rules, thin-bordered asymmetric frames on strict grids, generous negative space.
- **Bilingual labels:** 项目 Projects · 音乐 Music · 关于 About · 扫雷 Minesweeper · CV · Contact.

## 3. Architecture & Stack

- **Framework:** Next.js (App Router), TypeScript, Tailwind CSS.
- **Hosting:** Vercel. All pages statically rendered; no database, no CMS.
- **Content model:** typed data files (`content/projects.ts`, `content/music.ts`) plus MDX or TSX for long-form pages (Trajecta case study, music piece detail pages).
- **Minesweeper engine:** pure TypeScript module (`lib/minesweeper/`) with no DOM dependencies — board generation, first-click safety, flood fill, flags, chording, win/loss. Fully unit-testable.
- **Client components:** the board, the lattice grid (hover-resize), audio player. Everything else server-rendered.

### Routes

| Route | Purpose |
|---|---|
| `/` | The board (landing) |
| `/projects` | Lattice-window grid of projects; Trajecta gets the largest frame |
| `/projects/[slug]` | Project case studies (Trajecta first) |
| `/music` | Concert-program catalog: sparse rows (title · instrumentation · year) |
| `/music/[slug]` | Detail pages only for pieces with substantial content (audio, score, program notes); metadata-only pieces render as non-linked rows |
| `/about` | Ink-scroll layout; Shanghai → US story, CS × composition identity |
| `/minesweeper` | Personal times (52s expert / 14s intermediate), why the game matters, fully playable board |
| CV | PDF served from `/cv.pdf`, linked from the spine |
| Contact | Footer row (email, GitHub, LinkedIn) — not a separate page |

## 4. Homepage Board Mechanics

- **Real rules:** flood-fill reveal, adjacency numbers, right-click flagging, chording, running timer, mine counter. First click is always safe (mines placed after first click).
- **Section tiles:** each section's hanzi label sits under specific guaranteed-safe tiles. Revealed section tiles light up vermilion; clicking a revealed section tile navigates to that page.
- **Loss:** hitting a mine triggers a brief shake + vermilion flash, then the board softly resets (timer wipes). **Revealed sections persist** across resets and reloads within the session (`sessionStorage`).
- **Board size:** ~12×8 on desktop (intermediate-ish feel without dominating the viewport); reduced grid on mobile.
- **Mobile/touch:** tap to reveal; a flag-mode toggle button replaces right-click; long-press also flags.
- **Hints:** one line of monospace micro-copy under the board ("click reveal · right-click flag"), plus "not a sweeper? use the spine ←".

## 5. Inner-Page Layouts

- **Spine (all pages):** fixed left sidebar; vertical 贾一茗, vertical bilingual nav links, seal 贾 at bottom. Current page marked in vermilion. On mobile the spine collapses to a top bar.
- **Projects:** asymmetric thin-bordered frames on a strict CSS grid. On hover a frame expands (grid-template transition) while neighbors compress. Vermilion corner-marks echo flags. Ordinal minesweeper numbers (1/2/3 colors) mark project order.
- **Music:** concert-program rows — centered column, hairline separators, seal-styled play button for pieces with audio, instrumentation/year in muted monospace. Rows with detail pages are links; metadata-only rows are inert.
- **About:** ink-scroll — large negative space, hairline rules, one idea per screen-height.
- **Minesweeper page:** stats presented like a concert program (time as the "work"), then a playable board.

## 6. Error Handling & Edge Cases

- **JS disabled / crawler:** all pages statically rendered; spine nav is plain links, so every page is reachable without the game.
- **Reduced motion:** `prefers-reduced-motion` disables shake, flash, and hover-resize transitions (fall back to opacity/color changes).
- **Keyboard:** board is keyboard-navigable (arrow keys + Enter reveal, F flag); all nav focusable with visible focus states.
- **Small screens:** board shrinks and simplifies; lattice grid becomes single column; spine becomes horizontal top bar.
- **Font loading:** hanzi subset preloaded to avoid FOUT on the name/nav; system serif fallback acceptable elsewhere.

## 7. Testing

- **Engine (unit, Vitest):** board generation, mine placement respects first-click safety and section-tile safety, flood fill, chording, win/loss detection, reset preserving revealed sections. TDD for the whole `lib/minesweeper/` module.
- **Components (React Testing Library):** board interaction (click/flag/keyboard), section navigation, flag-mode toggle.
- **Smoke (Playwright, later):** each route renders, spine nav works, board reveals and navigates.

## 8. Out of Scope (for now)

- Blog/notes section.
- Custom domain setup (site ships on a Vercel URL first).
- Audio hosting decisions for pieces that don't yet have recordings — catalog launches with whatever assets exist.
- Leaderboards or persistent cross-session game stats.
