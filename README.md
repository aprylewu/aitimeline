# AI Timeline

AI Timeline is a conference deadline browser for AI and adjacent CS venues. It
pulls upstream conference calendars into one interactive timeline so you can
compare submission windows, rebuttal periods, notifications, camera-ready
milestones, and conference dates without jumping across multiple CFP pages.

Live site: [https://www.ai-timeline.net/](https://www.ai-timeline.net/)

Stack: Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, and Vitest.

## What The App Supports

- One continuous timeline surface with drag-to-pan for dense deadline seasons
- Search with `Cmd/Ctrl+K`
- Filters for category, milestone type, and visible range (`3M`, `6M`, `12M`,
  `All`)
- Automatic `Active` / `Past` grouping based on the viewer's current time
- Timezone-aware milestone tooltips that show both the source date context and
  the viewer-local time
- Ranking badges for `CCF`, `CORE`, and `THCPL` when available
- Expandable inline venue details with location, CFP links, and notes for
  partial schedules
- Responsive layout plus light/dark theme switching

## Data Flow

The home page renders on the server in [`app/page.tsx`](./app/page.tsx) and
loads conference data through
[`src/lib/data/get-conferences.ts`](./src/lib/data/get-conferences.ts).

The runtime data path is:

1. Try a live fetch + merge from:
   - [`ccfddl/ccf-deadlines`](https://github.com/ccfddl/ccf-deadlines)
   - [`huggingface/ai-deadlines`](https://github.com/huggingface/ai-deadlines)
2. Fall back to the committed cache snapshot in
   [`src/lib/data/cache.json`](./src/lib/data/cache.json)
3. Fall back again to the curated seed dataset in
   [`src/data/conferences.ts`](./src/data/conferences.ts)

When both upstream sources contain the same venue/year, the merge keeps the
structured category and ranking metadata from CCFDDL and the richer milestone
chain from HF AI Deadlines.

Additional details:

- [`app/page.tsx`](./app/page.tsx) exports `revalidate = 86400`, so Next.js
  refreshes the page on a 24-hour cadence.
- Milestones support `AoE`, `UTC`, named IANA timezones, and local conference
  dates.
- The static dataset remains in the repo as the final fallback, not the primary
  production source.

## Repository Guide

- [`app/page.tsx`](./app/page.tsx): server entry point that requests conference
  data and renders the timeline browser
- [`src/components/timeline`](./src/components/timeline): interactive UI for
  controls, grid rendering, tooltips, and expandable detail rows
- [`src/lib/data`](./src/lib/data): upstream fetchers, source merging, ranking
  parsing, category inference, and fallback loading
- [`src/lib/timeline`](./src/lib/timeline): range math, timezone handling,
  filtering, positioning, and sectioning
- [`src/data/conferences.ts`](./src/data/conferences.ts): curated seed data used
  only when live data and cache are both unavailable

## Local Development

Node 22 is recommended to match the GitHub Actions environment.

Install dependencies:

```bash
npm ci
```

Run the app locally:

```bash
npm run dev
```

Then open `http://localhost:3000`.

Run verification checks:

```bash
npm run test -- --run
npm run lint
npm run build
```

## CI

GitHub Actions runs the following on pushes to `main` and pull requests that
target `main`:

- tests
- lint
- production build
