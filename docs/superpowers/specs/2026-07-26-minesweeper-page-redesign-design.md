# /minesweeper Page Redesign — Three Steles

**Date:** 2026-07-26
**Status:** Approved by owner (brainstorm session, visual companion round)

## Goal

Replace the current /minesweeper page (two stat rows + one 16×16 board) with a
page where the owner's minesweeper.online records are the centerpiece *and* the
difficulty selector: three vertical stele inscriptions (碑), one per official
difficulty, each carrying his time, world rank, and percentile. Selecting a
stele loads that difficulty's authentic board below, with his record as the
target time. No on-site leaderboard, no external API calls — all record data is
static content.

## Owner data (from minesweeper.online/player/7108240, July 2026)

| Difficulty | Grid | Best time | Rank | Players | Percentile |
|---|---|---|---|---|---|
| Beginner 初级 | 9×9 · 10 | 2.082 | #4,221 | 5,392,830 | top 0.08% |
| Intermediate 中级 | 16×16 · 40 | 14.780 | #344 | 4,015,210 | top 0.009% |
| Expert 高级 | 30×16 · 99 | 52.803 | #320 | 3,718,430 | top 0.009% |

Plus one narrative line from his profile bio: chasing **sub-50 expert**
(52.803 − 50.000 = 2.803 to go). Everything else from the profile (efficiency,
wins, streaks, mastery, PvP) was considered and cut — owner wants three numbers
to do the talking.

## Decisions made during brainstorming

- **Stats scope:** times + ranks + percentiles + profile link + the sub-50
  chase line. Nothing else (no efficiency/wins/streaks/PvP).
- **Visual treatment:** 碑 "Three Steles" — vertical hanzi inscriptions in the
  duilian's language — chosen over 印 seal-stamp cards (repeats the homepage
  trick) and 册 deepened ledger rows (stays a table). Owner requires an
  **English difficulty name** under the hanzi on each stele.
- **Mechanic:** the steles ARE the difficulty selector; separate tabs/dashboard
  layouts were rejected as off-theme (generic dashboard language).
- **Mobile:** only Beginner is playable (authentic 9×9 fits ~36px touch
  targets; 16/30-column grids do not). Intermediate/Expert steles still show
  their records; the arena shows a one-line "wants a wider screen" note. The
  current adapted 9×13·14 casual board is removed.
- **On-site leaderboard / visitor percentile comparison:** explicitly deferred
  (separate future project; needs a backend and anti-cheat design).

## Page structure (app/minesweeper/page.tsx)

1. Header — unchanged: 个人最佳 / Personal Bests / hairline.
2. **Stele selector** — three stele buttons separated by vertical hairlines.
3. **Colophon line** — `chasing sub-50 expert · 2.803 to go · minesweeper.online ↗`
   (link → https://minesweeper.online/player/7108240, opens in new tab). The
   "to go" figure is computed from content data, not hand-typed.
4. **Board arena** — the selected difficulty's board, remounted per selection.
5. Footnote — `ranks as of july 2026` in faint small mono (still ≥12px).

Header + steles + colophon stay in the existing `max-w-2xl` column. The arena
is a sibling full-width section so Expert can break out of the column.

## Components

### `content/sweeping.ts` (new)

One record per difficulty: `{ id, level ('Beginner'…), zh ('初级'…), rows,
cols, mines, timeSeconds, rank, playerCount }`, plus `PROFILE_URL`,
`RANKS_AS_OF: 'july 2026'`, and `SUB50_TARGET = 50`. Percentile derived:
`rank / playerCount`, formatted to the significant figure shown in the table
above (helper in the same file). No hanzi beyond the three difficulty names
already approved by owner.

### `components/record-steles.tsx` (new)

Presentational selector. Three `<button type="button">` in a hairline-divided
row. Anatomy top→bottom: vertical hanzi (`[writing-mode:vertical-rl]`,
`font-serif-sc`, `lang="zh-Hans"` on the span only), English name
(letterspaced `font-mono-game`), time, `#rank · top X%`, grid spec small
print. States:

- Selected: 2px vermilion top rule, hanzi at `text-paper/85`, time in
  `text-vermilion-text`.
- Unselected: hanzi `text-paper/25` (duilian weight), time `text-muted`.
- `aria-pressed` per button; `aria-label` in English carries time + rank
  (e.g. "Beginner — 2.082 seconds, world rank 4,221"), so the hanzi stays
  ornament. `lang` never sits on the button itself (Latin accessible name).
- House focus ring.

### `components/sweeping-arena.tsx` (new, client)

Owns `selected: DifficultyId` state; renders `RecordSteles` + the board +
record-aware status line. Replaces `PlayableBoard` (only /minesweeper used
it; component and its test are removed). Two page instances as per house
pattern (geometry props are mount-time): desktop (`hidden md:flex`, default
**Intermediate**, all three playable) and mobile (`md:hidden`, default
**Beginner**, Beginner playable; Intermediate/Expert show the record and the
line `this board wants a wider screen`). Board remount key = difficulty id;
switching difficulty is also the reset path mid-game.

Status line (replaces PlayableBoard's LINES):

- playing: `THE RECORD IS 14.780 — THE TIMER STOPS WHEN YOU WIN`
- won: `✓ 61.20 — 46.42 BEHIND THE RECORD · SWEEP AGAIN`. SWEEP AGAIN is a
  button that bumps the remount key. If the visitor beats the record, the
  delta line reads `0.76 AHEAD OF THE RECORD` (English carries function — no
  hanzi flourish here). Vermilion text, per house win/loss cue rules.
- lost: `✕ MINE — RESETTING` (unchanged; auto-reset stays).

### `components/game-board.tsx` (two contained changes)

1. **Proportional cell type.** Grid becomes a size container; numeral/glyph
   font-size scales with tile width via container-query units with clamps
   (numerals ≈38% of tile clamped 13–20px; glyphs ≈48% clamped 16–24px; flag
   dot unchanged). Fixes "16-col board uses the same 15px numerals as the
   12-col homepage board". Homepage numerals grow a few px (53px tiles hit
   the clamp) — intentional, verify visually.
2. **`onWin?: (elapsedMs: number) => void`** — GameBoard records a
   `startedAt` ref when the first reveal starts the clock and reports elapsed
   on the win transition, so the arena can compute the delta line. (The Timer
   leaf keeps owning the displayed clock; ±1 tick drift between the two is
   acceptable at 10Hz display resolution.)

## Board geometries & widths (desktop)

| Difficulty | Grid | Board max-width | ≈tile |
|---|---|---|---|
| Beginner | 9×9 · 10 | 432px | 48px |
| Intermediate | 16×16 · 40 | 640px | 40px (homepage parity) |
| Expert | 30×16 · 99 | `min(1140px, 100vw − 136px)` | ≤38px, fluid |

136px = 88px spine + 24px gutter each side. Mobile Beginner: `max-w-[360px]`
(~36px tiles at 375px viewport). Status strip (mines · 扫雷 · timer) unchanged.

## Accessibility

- Stele buttons: English `aria-label` with time/rank, `aria-pressed`,
  `focus-visible:ring-1 ring-vermilion`, all text ≥12px, percentile/rank line
  ≥4.5:1 (muted/faint tokens are pre-cleared on ink).
- `lang="zh-Hans"` only on hanzi spans (initially 初级/中级/高级 + existing 扫雷).
- Win/loss cues unchanged from GameBoard (sr-only live region + visible line).
- SWEEP AGAIN is a real button inside the status line, not a click-anywhere.

## Testing

- `sweeping-arena.test.tsx`: stele click swaps geometry (col count changes),
  remounts fresh board, `aria-pressed` follows, win → delta line + SWEEP
  AGAIN resets, mobile variant blocks Intermediate/Expert play.
- `record-steles.test.tsx`: labels, English names present, aria semantics.
- `content/sweeping` percentile formatting unit test (0.08% / 0.009% cases).
- game-board tests: extend for `onWin` payload; font scaling is CSS-only
  (visual check on homepage + all three difficulties).
- Remove `playable-board.test.tsx` with its component.
- Gate: `npm test` · `npm run typecheck` · `npx eslint .` · `npm run build`
  (all routes prerendered) before commit; owner reviews at localhost:3000;
  push only on his word.

## Explicitly rejected in this round

- Generic dashboard/card layouts (off-theme), 印 seal-cards, 册 ledger rows.
- Extra profile stats (efficiency, wins, streaks, mastery, PvP) — cut for
  spareness; PvP "Grandmaster, peak world #10" may return someday as a
  footnote if owner asks.
- Adapted (non-authentic) Intermediate/Expert boards on mobile.
- On-site leaderboard & visitor-percentile lookup — deferred, separate spec.
