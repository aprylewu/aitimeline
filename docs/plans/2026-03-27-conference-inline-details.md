# Conference Inline Details Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the hover conference detail overlay with dense inline expandable strips that appear below each conference and can be expanded independently.

**Architecture:** Keep the existing timeline row structure intact and add a new full-width detail row after any expanded conference. Render the detail area as a shared-border strip with compact typography, integrated date/location/ranking content, and an optional `CFP` action sourced from a new optional `cfpUrl` field on conference records.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Vitest, Testing Library, Tailwind utility classes, date-fns

---

### Task 1: Lock the new accordion behavior with tests

**Files:**
- Modify: `src/components/timeline/timeline-grid.test.tsx`
- Test: `src/components/timeline/timeline-grid.test.tsx`

**Step 1: Write the failing test**

Add tests that:

- click one conference trigger and expect a dense inline detail strip below it
- assert the expanded detail strip shows `ACL 2026` style title hierarchy,
  compact date/location text, and tight inline ranking content
- assert a `CFP` link appears only when the selected conference has `cfpUrl`
- click two conference triggers and expect both detail strips to remain visible
- click the same trigger twice and expect its detail strip to collapse

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/components/timeline/timeline-grid.test.tsx`
Expected: FAIL because the grid still uses hover detail cards and does not
render inline accordion rows.

**Step 3: Write minimal implementation**

Do not implement yet in this task. The failing test is the deliverable.

**Step 4: Run test to verify it still fails for the expected reason**

Run: `npm test -- --run src/components/timeline/timeline-grid.test.tsx`
Expected: FAIL with missing inline detail row assertions.

**Step 5: Commit**

```bash
git add src/components/timeline/timeline-grid.test.tsx
git commit -m "test: cover inline conference detail rows"
```

### Task 2: Replace hover detail state with expandable inline rows

**Files:**
- Modify: `src/components/timeline/timeline-grid.tsx`
- Modify: `src/components/timeline/conference-meta-column.tsx`
- Test: `src/components/timeline/timeline-grid.test.tsx`

**Step 1: Write the failing test**

Re-run the focused timeline grid test file after Task 1 to confirm the current
implementation still fails.

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/components/timeline/timeline-grid.test.tsx`
Expected: FAIL with the new accordion expectations.

**Step 3: Write minimal implementation**

Implement:

- optional `cfpUrl` support in the conference data model
- `expandedConferenceIds` state in `TimelineGrid`
- click toggle behavior per conference
- inline detail strip inserted after each conference using `col-span-2`
- title treatment with strong short name + muted mono year
- compact date/location/ranking rendering
- optional `CFP` button on the right
- removal of obsolete card-like detail markup

Keep milestone tooltip behavior untouched.

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/components/timeline/timeline-grid.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/timeline/timeline-grid.tsx src/components/timeline/conference-meta-column.tsx src/components/timeline/timeline-grid.test.tsx
git commit -m "feat: add inline conference detail rows"
```

### Task 3: Refresh styles for the inline expansion row

**Files:**
- Modify: `app/globals.css`
- Modify: `src/components/timeline/timeline-grid.tsx`
- Modify: `src/components/timeline/conference-meta-column.tsx`
- Test: `src/components/timeline/timeline-grid.test.tsx`

**Step 1: Write the failing test**

Add or refine assertions that the expanded trigger exposes a semantic expanded
state and that the inline row uses the expected test id hooks.

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/components/timeline/timeline-grid.test.tsx`
Expected: FAIL if the accessibility or detail-row hooks are still missing.

**Step 3: Write minimal implementation**

Add the shared-border strip styling, disclosure arrow animation, and smooth
expand/collapse transition, and remove the obsolete card animation styles.

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/components/timeline/timeline-grid.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add app/globals.css src/components/timeline/timeline-grid.tsx src/components/timeline/conference-meta-column.tsx src/components/timeline/timeline-grid.test.tsx
git commit -m "style: refine inline conference detail expansion"
```

### Task 4: Run regression checks for the page-level timeline

**Files:**
- Test: `src/components/timeline/timeline-browser.test.tsx`
- Test: `src/components/timeline/timeline-grid.test.tsx`
- Test: `app/page.test.tsx`

**Step 1: Write the failing test**

No new test is required if existing browser and page tests already cover the
unchanged shell. Use the current suite as regression verification.

**Step 2: Run test to verify current state**

Run: `npm test -- --run src/components/timeline/timeline-browser.test.tsx app/page.test.tsx src/components/timeline/timeline-grid.test.tsx`
Expected: PASS

**Step 3: Write minimal implementation**

No implementation in this task. Only make code changes if regression failures
reveal a real integration gap.

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/components/timeline/timeline-browser.test.tsx app/page.test.tsx src/components/timeline/timeline-grid.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/timeline/timeline-browser.test.tsx app/page.test.tsx src/components/timeline/timeline-grid.test.tsx
git commit -m "test: verify inline conference detail regressions"
```
