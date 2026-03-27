# Conference Timeline Left Sidebar Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move the timeline filters into a collapsible desktop left sidebar and add a compact sticky mobile menu that shrinks after scrolling without changing existing filtering behavior.

**Architecture:** Keep all filter state in `src/components/timeline/timeline-browser.tsx`, but refactor the controls UI so the same filter groups can render in three presentation modes: desktop sidebar, mobile expanded bar, and mobile compact bar. Preserve the existing timeline grid and filtering logic, and use light UI state plus `localStorage` for desktop sidebar persistence.

**Tech Stack:** Next.js 16.2.1, React 19.2.4, TypeScript 5, Tailwind CSS 4, Vitest, Testing Library, jsdom.

---

### Task 1: Add Layout Behavior Tests

**Files:**
- Modify: `src/components/timeline/timeline-browser.test.tsx`
- Modify: `src/components/timeline/controls-bar.test.tsx`

**Step 1: Write the failing tests**

Add desktop and mobile layout assertions to `src/components/timeline/timeline-browser.test.tsx`:

```tsx
it("collapses the desktop sidebar and restores it from localStorage", async () => {
  const user = userEvent.setup();

  render(
    <TimelineBrowser
      conferences={conferences}
      now={new Date("2026-03-26T00:00:00Z")}
    />,
  );

  expect(screen.getByTestId("desktop-menu")).toHaveAttribute(
    "data-collapsed",
    "false",
  );

  await user.click(screen.getByRole("button", { name: /collapse menu/i }));

  expect(screen.getByTestId("desktop-menu")).toHaveAttribute(
    "data-collapsed",
    "true",
  );
  expect(window.localStorage.getItem("timeline.desktopMenuCollapsed")).toBe(
    "true",
  );
});

it("switches the mobile menu into compact mode after scrolling", async () => {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: 390,
  });

  render(
    <TimelineBrowser
      conferences={conferences}
      now={new Date("2026-03-26T00:00:00Z")}
    />,
  );

  expect(screen.getByTestId("mobile-menu")).toHaveAttribute(
    "data-compact",
    "false",
  );

  Object.defineProperty(window, "scrollY", {
    configurable: true,
    value: 180,
  });
  window.dispatchEvent(new Event("scroll"));

  expect(screen.getByTestId("mobile-menu")).toHaveAttribute(
    "data-compact",
    "true",
  );
});
```

Add a focused control assertion to `src/components/timeline/controls-bar.test.tsx`:

```tsx
it("restores expanded mobile controls when filters is pressed from compact mode", async () => {
  const user = userEvent.setup();

  render(
    <TimelineBrowser
      conferences={conferences}
      now={new Date("2026-03-26T00:00:00Z")}
    />,
  );

  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: 390,
  });
  Object.defineProperty(window, "scrollY", {
    configurable: true,
    value: 180,
  });
  window.dispatchEvent(new Event("scroll"));

  await user.click(screen.getByRole("button", { name: /filters/i }));

  expect(screen.getByPlaceholderText(/search conferences/i)).toBeInTheDocument();
  expect(screen.getByRole("group", { name: /category filters/i })).toBeInTheDocument();
});
```

**Step 2: Run tests to verify they fail**

Run:

```bash
npm run test -- --run src/components/timeline/timeline-browser.test.tsx src/components/timeline/controls-bar.test.tsx
```

Expected: fail because the desktop sidebar shell, collapse control, mobile compact state, and compact `Filters` affordance do not exist yet.

**Step 3: Commit**

```bash
git add src/components/timeline/timeline-browser.test.tsx src/components/timeline/controls-bar.test.tsx
git commit -m "test: cover sidebar and mobile menu states"
```

### Task 2: Refactor The Controls Surface

**Files:**
- Modify: `src/components/timeline/controls-bar.tsx`

**Step 1: Write the failing test**

Use the new assertions from Task 1 as the failing contract.

**Step 2: Run the focused tests to verify failure**

Run:

```bash
npm run test -- --run src/components/timeline/timeline-browser.test.tsx src/components/timeline/controls-bar.test.tsx
```

Expected: fail with missing buttons, missing `data-testid` attributes, and incorrect layout state.

**Step 3: Write the minimal implementation**

Refactor `ControlsBar` so it can render:

- a desktop sidebar shell with `data-testid="desktop-menu"`
- a collapsed desktop rail with an expand button
- a mobile shell with `data-testid="mobile-menu"`
- a compact mobile bar containing a `Filters` button and short selection summary

Keep the existing control groups, but move them into reusable internal sections instead of duplicating markup.

**Step 4: Run the focused tests to verify they pass**

Run:

```bash
npm run test -- --run src/components/timeline/timeline-browser.test.tsx src/components/timeline/controls-bar.test.tsx
```

Expected: pass.

**Step 5: Commit**

```bash
git add src/components/timeline/controls-bar.tsx src/components/timeline/timeline-browser.test.tsx src/components/timeline/controls-bar.test.tsx
git commit -m "feat: add responsive menu shells"
```

### Task 3: Move The Menu Into The Page Shell And Persist Desktop Collapse

**Files:**
- Modify: `src/components/timeline/timeline-browser.tsx`

**Step 1: Write the failing test**

Use the localStorage persistence and mobile compact assertions from Task 1 as the failing contract.

**Step 2: Run the focused test to verify failure**

Run:

```bash
npm run test -- --run src/components/timeline/timeline-browser.test.tsx
```

Expected: fail because `TimelineBrowser` still renders the controls as a single top bar with no responsive shell state.

**Step 3: Write the minimal implementation**

In `src/components/timeline/timeline-browser.tsx`:

- add desktop collapsed state initialized from `localStorage`
- persist the desktop collapsed preference on change
- track whether the viewport is in mobile layout
- listen for scroll on mobile and switch into compact mode after a threshold
- restore expanded mobile controls when the user returns near the top or presses `Filters`
- change the outer page layout to a desktop two-column shell with a sticky left sidebar and a right content column

**Step 4: Run the focused test to verify it passes**

Run:

```bash
npm run test -- --run src/components/timeline/timeline-browser.test.tsx
```

Expected: pass.

**Step 5: Commit**

```bash
git add src/components/timeline/timeline-browser.tsx src/components/timeline/timeline-browser.test.tsx
git commit -m "feat: move controls into collapsible sidebar"
```

### Task 4: Polish Styling And Run Full Verification

**Files:**
- Modify: `app/globals.css`
- Modify: `src/components/timeline/controls-bar.tsx`
- Modify: `src/components/timeline/timeline-browser.tsx`

**Step 1: Write the failing test**

Use the existing UI tests plus the new sidebar and compact mobile tests as the contract.

**Step 2: Run the relevant suite before styling**

Run:

```bash
npm run test -- --run src/components/timeline/*.test.tsx
```

Expected: either pass with rough styling or expose remaining layout regressions to fix before polish.

**Step 3: Write the minimal implementation**

Add and tune styles for:

- desktop sidebar width and collapsed rail width
- sticky sidebar and sticky mobile top bar surfaces
- compact mobile bar spacing and motion
- right-side content spacing so the page still feels airy and elegant

Keep the existing timeline shell and palette intact.

**Step 4: Run full verification**

Run:

```bash
npm run test -- --run
npm run lint
npm run build
```

Expected: all commands pass.

**Step 5: Commit**

```bash
git add app/globals.css src/components/timeline/controls-bar.tsx src/components/timeline/timeline-browser.tsx src/components/timeline/*.test.tsx
git commit -m "feat: polish collapsible timeline menu layout"
```
