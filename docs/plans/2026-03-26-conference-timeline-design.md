# Conference Timeline Design

**Date:** 2026-03-26

## Goal

Build a single-page conference timeline browser with Next.js that helps researchers compare important conference dates at a glance, especially the relationship between full paper deadlines, rebuttal periods, and notifications so they can plan submissions, reviews, withdrawals, and resubmissions.

## Scope

- One page only
- Next.js App Router, React, TypeScript, Tailwind CSS
- Self-maintained local data source stored in repository files
- Conference coverage aligned with the broad range users expect from `ccfddl.com`
- Default time window: past 2 months plus next 4 months
- Users can adjust filters and time range on the page

## Non-Goals

- No admin backend in v1
- No multi-page conference detail pages in v1
- No dependency on a third-party charting library in v1
- No attempt to mirror `ccfddl.com` data schema exactly

## Product Direction

The page should partially borrow the information density and quick scanning experience of `ccfddl.com`, but the primary view should be a gantt-like timeline instead of a deadline table. The product focus is not only "when is the deadline" but "what is the sequence of key events for each venue."

The visual direction should be minimalist and restrained, closer to Apple's marketing pages than to a dense dashboard. The UI should feel calm, precise, and deliberate, with generous spacing, low-saturation colors, subtle depth, and short motion.

## Primary User Needs

- Compare multiple conferences in one place
- See how full paper, rebuttal, and notification relate in time
- Decide whether submission, review work, or resubmission windows overlap
- Filter which milestone types are visible
- Jump from a conference name to that year's official website

## Information Architecture

### Page Structure

1. Sticky top control bar
2. Main two-column timeline layout
3. Left fixed conference information column
4. Right horizontally scrollable timeline grid

### Top Control Bar

- Search by conference name or abbreviation
- Filter by conference category
- Toggle milestone types on and off
- Quick range presets such as `3M`, `6M`, `12M`, `All`
- Adjustable visible time range
- Zoom level or scale control for timeline density

### Conference Row Layout

Each conference occupies one row.

Left side shows:

- Conference abbreviation and full name
- Ranking metadata including CCF, CORE, and THCPL when available
- Conference location
- Optional category or tag metadata

Right side shows:

- All important milestones positioned on a shared time axis
- Point markers for single-date events
- Thin range bars for naturally ranged events such as rebuttal windows or conference dates

## Interaction Model

### Links

- The conference name is the primary external link
- Clicking the conference name opens that year's conference website in a new tab

### Timeline Interaction

- Hovering a milestone shows a lightweight tooltip
- Hovering or focusing a row highlights its timeline path
- The timeline remains interactive without forcing navigation away from the page

This separates browsing from outbound navigation and avoids accidental redirects while exploring the timeline.

## Data Model

The data source should be local and self-maintained in TypeScript files.

### Conference Entity

Suggested fields:

- `id`
- `slug`
- `title`
- `shortName`
- `year`
- `website`
- `location`
- `category`
- `rankings`
- `tags`
- `milestones`

### Ranking Entity

Suggested fields:

- `ccf`
- `core`
- `thcpl`

### Milestone Entity

Suggested fields:

- `id`
- `type`
- `label`
- `dateStart`
- `dateEnd` optional
- `timezone`
- `importance`
- `note` optional

### Milestone Types

Initial milestone types should support:

- `abstract`
- `fullPaper`
- `supplementary`
- `rebuttalStart`
- `rebuttalEnd`
- `notification`
- `cameraReady`
- `conferenceStart`
- `conferenceEnd`
- `workshop`
- other future milestone types as needed

## Key Visual Logic

The main visual emphasis should be on the decision chain:

- `full paper`
- `rebuttal`
- `notification`

These milestones should be highlighted by default with stronger contrast than secondary milestones. When a conference contains all three, the row should visually communicate the chain so users can quickly understand the submission-to-decision flow.

All other important dates are still available and visible by default, but users can toggle categories of milestones on or off to reduce clutter.

## Timeline Behavior

- The default visible window is from 2 months before the current date through 4 months after the current date
- Users can expand or contract the visible range
- The horizontal axis should support different zoom densities
- The left info column should remain readable while the timeline scrolls

## Motion and Visual Style

- Minimal and short animations only
- Prefer `opacity` and `transform` transitions
- Use soft highlight, gentle fade, and slight positional motion
- Respect `prefers-reduced-motion`
- Use a restrained palette: cool neutrals, graphite, off-white, and a small number of accent tones

## Technical Architecture

- Use Next.js App Router
- Keep the app as a single-page experience in `app/page.tsx`
- Split UI into focused components such as filters, conference list, timeline grid, and tooltip
- Keep date math, filtering, and timeline positioning in pure utility functions
- Do not introduce a charting library for v1

## Testing Strategy

Prioritize tests for pure logic:

- default visible range calculation
- milestone filtering
- key path extraction
- date-to-position mapping

UI tests should cover at least:

- baseline rendering of conference rows
- milestone visibility toggles
- link behavior for conference names

## Risks and Constraints

- Self-maintained data quality will determine usefulness
- Different conferences expose different milestone granularity
- Too many visible milestone types can reduce readability if styling is not well tiered
- The layout must stay usable on both desktop and narrower laptop widths

## Initial Recommendation

Implement v1 as a clean, static-data, single-page browser with strong defaults and selective interactivity. Invest effort in the data schema and the timeline rendering quality first. Delay backend editing, scraping, and multi-page expansion until the browsing experience is clearly useful.
