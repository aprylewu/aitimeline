# Conference Inline Details Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the hover conference detail overlay with inline expandable rows that appear below each conference and can be expanded independently.

**Architecture:** Keep the existing timeline row structure intact and add a new full-width detail row after any expanded conference. Move conference detail visibility from transient hover state to explicit click state in `TimelineGrid`, and derive the rendered detail fields from the existing conference data model without adding new backend data requirements.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Vitest, Testing Library, Tailwind utility classes, date-fns

---

### Task 1: Lock the new accordion behavior with tests

**Files:**
- Modify: `src/components/timeline/timeline-grid.test.tsx`
- Test: `src/components/timeline/timeline-grid.test.tsx`

**Step 1: Write the failing test**

Add tests that:

- click one conference trigger and expect an inline detail row below it
- click two conference triggers and expect both detail rows to remain visible
- click the same trigger twice and expect its detail row to disappear

Use existing sample conferences and assert for visible labels such as ranking,
type, location, and main page content.

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

- `expandedConferenceIds` state in `TimelineGrid`
- click toggle behavior per conference
- inline detail row inserted after each expanded conference using `col-span-2`
- arrow indicator in the compact conference trigger
- detail field rendering for rankings, type, dates, location, and main page
- removal of obsolete hover detail card markup

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

Add the panel styling and disclosure arrow animation, and remove the obsolete
overlay animation styles.

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
