# Viewer Timezone Timeline Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Render the full timeline in the viewer's device timezone while keeping hover cards dual-labeled with both viewer-local time and AoE/source time.

**Architecture:** Introduce a timezone-aware projection layer for milestone instants, month cells, and visible-range comparisons so the timeline grid is no longer driven by raw `dateStart` strings. Keep the server-provided IP timezone as the initial SSR fallback, then promote the browser/device timezone on mount to avoid proxy errors without causing hydration mismatch.

**Tech Stack:** Next.js 16, React 19, TypeScript, `Intl.DateTimeFormat`, `date-fns`, Vitest

---

### Task 1: Add failing tests for viewer-timezone rendering

**Files:**
- Modify: `src/lib/timeline/milestone-time.test.ts`
- Modify: `src/components/timeline/timeline-grid.test.tsx`
- Modify: `src/lib/timeline/filtering.test.ts`
- Modify: `src/lib/timeline/sections.test.ts`

**Step 1: Write the failing tests**

- Add a test proving an AoE milestone is projected onto a different local calendar day in a west-coast timezone.
- Add a grid test proving the ICML full-paper milestone shifts left of Feb when rendered in `America/Los_Angeles`, because `2026-01-28 AoE` becomes `2026-01-28 03:59 PST`.
- Add a tooltip test proving hover content includes both `Your time` and `AoE`.
- Add filtering and section tests proving range inclusion and past/active classification use projected milestone instants instead of `parseISO(dateStart)`.

**Step 2: Run tests to verify they fail**

Run: `npm test -- --run src/lib/timeline/milestone-time.test.ts src/components/timeline/timeline-grid.test.tsx src/lib/timeline/filtering.test.ts src/lib/timeline/sections.test.ts`

Expected: FAIL because the code still positions and filters milestones using raw dates.

### Task 2: Build timezone projection helpers

**Files:**
- Modify: `src/lib/timeline/milestone-time.ts`
- Create or modify supporting helper code only if needed in `src/lib/timeline/`
- Test: `src/lib/timeline/milestone-time.test.ts`

**Step 1: Write minimal helpers**

- Add helpers to:
  - resolve a viewer timezone with browser/device fallback
  - convert arbitrary zoned local date-times to UTC
  - derive zoned month starts and zoned month labels
  - format viewer-local and AoE/source labels for tooltip display

**Step 2: Run targeted tests**

Run: `npm test -- --run src/lib/timeline/milestone-time.test.ts`

Expected: PASS

### Task 3: Move timeline rendering onto projected instants

**Files:**
- Modify: `src/components/timeline/timeline-browser.tsx`
- Modify: `src/components/timeline/timeline-grid.tsx`
- Modify: `src/lib/timeline/date-range.ts`
- Test: `src/components/timeline/timeline-grid.test.tsx`

**Step 1: Add viewer-timezone state**

- Initialize from server `viewerTimeZone`.
- On mount, replace it with `Intl.DateTimeFormat().resolvedOptions().timeZone` when valid.

**Step 2: Recompute time axis from projected instants**

- Build visible-range month cells in the resolved viewer timezone.
- Position `today`, milestone dots, range bars, and primary paths using `getMilestoneInstant(...)`.
- Keep the current clipping window behavior aligned to the viewer-timezone month cells.

**Step 3: Update hover rendering**

- Show both `Your time` and `AoE`/source time on the tooltip.

**Step 4: Run targeted tests**

Run: `npm test -- --run src/components/timeline/timeline-grid.test.tsx`

Expected: PASS

### Task 4: Move filtering and section logic onto projected instants

**Files:**
- Modify: `src/lib/timeline/filtering.ts`
- Modify: `src/lib/timeline/sections.ts`
- Modify: `src/components/timeline/timeline-browser.tsx`
- Test: `src/lib/timeline/filtering.test.ts`
- Test: `src/lib/timeline/sections.test.ts`

**Step 1: Update range filtering**

- Replace raw `parseISO` comparisons with projected milestone instants.

**Step 2: Update active/past split and sorting**

- Sort with projected key milestones.
- Compare decision milestones to `now` using projected instants.

**Step 3: Run targeted tests**

Run: `npm test -- --run src/lib/timeline/filtering.test.ts src/lib/timeline/sections.test.ts`

Expected: PASS

### Task 5: Full verification

**Files:**
- No new files

**Step 1: Run full test suite**

Run: `npm test -- --run`

Expected: PASS

**Step 2: Run lint**

Run: `npm run lint`

Expected: PASS

**Step 3: Run production build**

Run: `npm run build`

Expected: PASS

**Step 4: Commit**

```bash
git add docs/plans/2026-03-27-viewer-timezone-timeline.md src/lib/timeline/milestone-time.ts src/lib/timeline/milestone-time.test.ts src/components/timeline/timeline-browser.tsx src/components/timeline/timeline-grid.tsx src/components/timeline/timeline-grid.test.tsx src/lib/timeline/date-range.ts src/lib/timeline/filtering.ts src/lib/timeline/filtering.test.ts src/lib/timeline/sections.ts src/lib/timeline/sections.test.ts
git commit -m "feat: project timeline into viewer timezone"
```
