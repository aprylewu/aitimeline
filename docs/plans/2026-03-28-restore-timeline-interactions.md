# Restore Timeline Interactions Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restore the pre-merge timeline interaction, clipping, timezone, and detail-expansion behavior while preserving the current merged UI styling.

**Architecture:** Keep the current visual shell from the merged PR, but reintroduce the previously working dual-range timeline model, timezone-aware milestone logic, clipping behavior, and stable detail interactions. Implement in narrow slices with regression tests first so the restored behavior is locked in without reverting the collaborator's UI.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest, Testing Library

---

### Task 1: Capture the missing timeline behaviors with failing tests

**Files:**
- Modify: `src/components/timeline/timeline-browser.test.tsx`
- Modify: `src/components/timeline/timeline-grid.test.tsx`
- Modify: `src/lib/timeline/filtering.test.ts`
- Modify: `src/lib/timeline/sections.test.ts`

**Step 1: Write the failing tests**

Add focused regressions for:
- default focus window still representing roughly two months back and four months forward while horizontal browsing covers more than the initial viewport
- clipping of out-of-range milestones and bars
- stable conference detail expansion via clicking the title
- hover persistence when the marker and tooltip animate
- timezone-aware visible-range and active/past behavior

**Step 2: Run the focused tests to verify they fail**

Run: `npm test -- --run src/components/timeline/timeline-browser.test.tsx src/components/timeline/timeline-grid.test.tsx src/lib/timeline/filtering.test.ts src/lib/timeline/sections.test.ts`

Expected: FAIL with assertions that reflect the currently missing behaviors.

**Step 3: Commit**

Do not commit yet.

### Task 2: Restore the dual-range timeline model in the browser container

**Files:**
- Modify: `src/components/timeline/timeline-browser.tsx`
- Modify: `src/lib/timeline/date-range.ts`

**Step 1: Reintroduce the focus-range vs. timeline-range model**

Restore the proven concepts from earlier timeline commits:
- a full `timelineRange`
- a default `focusRange`
- derived content width based on focus range relative to timeline range
- initial horizontal scroll alignment to the focused range

Keep the current controls bar layout and visual styling intact.

**Step 2: Make the focused browser tests pass**

Run: `npm test -- --run src/components/timeline/timeline-browser.test.tsx`

Expected: PASS for the restored focus and horizontal browse behaviors.

**Step 3: Commit**

```bash
git add src/components/timeline/timeline-browser.tsx src/lib/timeline/date-range.ts src/components/timeline/timeline-browser.test.tsx
git commit -m "fix: restore timeline focus range behavior"
```

### Task 3: Restore timezone-aware filtering, sorting, and section placement

**Files:**
- Modify: `src/lib/timeline/filtering.ts`
- Modify: `src/lib/timeline/sections.ts`
- Modify: `src/lib/timeline/milestone-time.ts`
- Modify: `src/lib/timeline/filtering.test.ts`
- Modify: `src/lib/timeline/sections.test.ts`
- Modify: `src/lib/timeline/milestone-time.test.ts`

**Step 1: Reconnect all consumers to the milestone-time helpers**

Filtering, sorting, and active/past classification must use `getMilestoneInstant`, `getMilestoneRange`, and `resolveViewerTimeZone` consistently instead of plain `parseISO`.

**Step 2: Run the focused library tests**

Run: `npm test -- --run src/lib/timeline/filtering.test.ts src/lib/timeline/sections.test.ts src/lib/timeline/milestone-time.test.ts`

Expected: PASS for AoE/UTC/IANA timezone logic and active/past classification.

**Step 3: Commit**

```bash
git add src/lib/timeline/filtering.ts src/lib/timeline/sections.ts src/lib/timeline/milestone-time.ts src/lib/timeline/filtering.test.ts src/lib/timeline/sections.test.ts src/lib/timeline/milestone-time.test.ts
git commit -m "fix: restore timezone-aware timeline logic"
```

### Task 4: Restore clipping, detail expansion, and hover stability in the grid

**Files:**
- Modify: `src/components/timeline/timeline-grid.tsx`
- Modify: `src/components/timeline/conference-meta-column.tsx`
- Modify: `src/components/timeline/milestone-tooltip.tsx`
- Modify: `src/components/timeline/timeline-grid.test.tsx`

**Step 1: Restore clipped rendering**

Reintroduce the older clipping logic so markers and bars respect the render window and visible range before calculating positions.

**Step 2: Restore stable detail expansion**

Keep the current UI card style, but restore the older behavior where clicking the conference title expands stable details while the right timeline remains horizontally scrollable.

**Step 3: Restore hover stability**

Prevent tooltip/marker movement from cancelling hover by anchoring hover state to stable marker ownership rather than transient geometry changes.

**Step 4: Run the focused grid tests**

Run: `npm test -- --run src/components/timeline/timeline-grid.test.tsx`

Expected: PASS for clipping, title-click expansion, fixed detail behavior, and hover stability.

**Step 5: Commit**

```bash
git add src/components/timeline/timeline-grid.tsx src/components/timeline/conference-meta-column.tsx src/components/timeline/milestone-tooltip.tsx src/components/timeline/timeline-grid.test.tsx
git commit -m "fix: restore timeline grid interactions"
```

### Task 5: Reconcile the controls bar with the restored logic

**Files:**
- Modify: `src/components/timeline/controls-bar.tsx`
- Modify: `src/components/timeline/controls-bar.test.tsx`
- Modify: `src/components/timeline/timeline-browser.tsx`

**Step 1: Keep the merged controls UI but reconnect it to restored timeline state**

Ensure presets, clear filters, and milestone toggles work with the restored dual-range and timezone-aware state without regressing the collaborator's UI.

**Step 2: Run the focused controls/browser tests**

Run: `npm test -- --run src/components/timeline/controls-bar.test.tsx src/components/timeline/timeline-browser.test.tsx`

Expected: PASS with the current controls appearance and restored behavior.

**Step 3: Commit**

```bash
git add src/components/timeline/controls-bar.tsx src/components/timeline/controls-bar.test.tsx src/components/timeline/timeline-browser.tsx
git commit -m "fix: reconnect controls to restored timeline behavior"
```

### Task 6: Run full verification and manual browser validation

**Files:**
- No file changes expected

**Step 1: Run the full test suite**

Run: `npm test -- --run`

Expected: all tests pass.

**Step 2: Run lint**

Run: `npm run lint`

Expected: no lint errors.

**Step 3: Run build**

Run: `npm run build`

Expected: successful production build.

**Step 4: Manual browser check**

Run the local dev server and confirm:
- timeline opens focused on the recent six-month window
- the surface can still be browsed further horizontally
- out-of-range milestones do not leak into view
- clicking a conference title expands a visible detail panel
- hover tooltips remain stable

**Step 5: Final commit**

Commit any remaining implementation changes that were intentionally deferred until full verification.
