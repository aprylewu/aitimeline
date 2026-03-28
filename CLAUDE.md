# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Single-page academic conference timeline browser. Researchers use it to compare submission deadlines, rebuttal windows, and notification dates across venues in a gantt-like view. The visual emphasis is on the **full paper -> rebuttal -> notification** decision chain.

## Commands

```bash
npm run dev          # Start dev server (Next.js)
npm run build        # Production build
npm run lint         # ESLint
npm run test -- --run                              # Run all tests once
npm run test -- --run src/lib/timeline/filtering.test.ts  # Run a single test file
npm run test                                       # Watch mode
```

## Architecture

**Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4, Vitest, date-fns.

**No charting library.** The timeline is rendered with CSS positioning (`left: ${percent}%`) and React. This is intentional to keep full control over layout and motion.

### Data flow

```
getConferences() in src/lib/data/get-conferences.ts
  ├── fetchCcfddl() + fetchHfDeadlines() in parallel (build-time / ISR 24h)
  ├── mergeSources() → Conference[]
  └── fallback: src/lib/data/cache.json
        |
   app/page.tsx (async server component, passes data + `now`)
        |
   TimelineBrowser (client component, owns all filter/range state)
        |
   +--> ControlsBar (search + ⌘K, category chips, milestone popover, segmented presets, theme icon)
   +--> TimelineGrid
             |
             +--> ConferenceMetaColumn (left column: name, rankings, location)
             +--> Milestone markers + range bars + MilestoneTooltip (on hover)
```

### Data sync layer (`src/lib/data/`)

Conferences are auto-synced from two GitHub sources at build time with 24h ISR:

- **ccfddl/ccf-deadlines** — 339 conferences across all 10 CS categories, submission deadlines only
- **huggingface/ai-deadlines** — ~63 conferences with full milestone chains (rebuttal, notification, camera-ready)
- **merge-sources** — matches by normalized slug + year; HF milestones take priority, ccfddl provides category/rankings
- **cache.json** — committed fallback snapshot; regenerate with `npx tsx scripts/update-cache.ts`

### Pure utility layer (`src/lib/timeline/`)

All date math, filtering, and positioning logic lives in pure functions with dedicated test files:

- **date-range** - default visible window (2 months back, 4 months forward)
- **filtering** - query/category/milestone-type/range filtering pipeline
- **positioning** - `getPositionPercent()` maps a Date to a 0-100% offset
- **key-path** - extracts the primary decision chain (`fullPaper`, `rebuttalStart`, `notification`)
- **sections** - splits filtered conferences into "Active" vs "Past" based on whether the notification date has passed, and sorts by earliest submission milestone

### Theming

Light/dark mode is driven by a `data-theme` attribute on the root `<main>` element, with CSS custom properties defined in `app/globals.css`. Toggle is local state in `TimelineBrowser`, not a system preference listener.

### Conference categories

`AI`, `CG`, `CT`, `DB`, `DS`, `HI`, `MX`, `NW`, `SC`, `SE` -- defined in `src/types/conference.ts` as `ConferenceCategory`.

## Adding a Conference

Conferences are auto-synced from ccfddl and HF ai-deadlines at build time. To add one manually, edit `src/data/conferences.ts`. Each entry needs an `id`, `slug`, `shortName`, `year`, `website`, `location`, `category`, `rankings`, and a `milestones` array. Keep milestones in chronological order. Use `YYYY-MM-DD` date strings and set `timezone` explicitly (`AoE`, `UTC`, or `Local`). Conferences with only a submission deadline will render as a single marker; those with `fullPaper`, `rebuttalStart`, and `notification` get the full gantt path visualization.

## Testing Conventions

- Tests are co-located: `foo.test.ts` next to `foo.ts`
- Vitest with jsdom, globals enabled, Testing Library + jest-dom matchers
- `@/` path alias works in both source and tests (configured in `vitest.config.ts`)
- The `TimelineBrowser` tests inject a fixed `now` date to keep assertions deterministic
