# Conference Timeline Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a one-page Next.js conference timeline browser with self-maintained typed conference data, a fixed metadata column, and a gantt-like timeline that makes the `full paper -> rebuttal -> notification` sequence easy to compare across venues.

**Architecture:** Bootstrap a minimal Next.js App Router app from the official empty template, keep all conference data in typed local TypeScript modules, move date math and filtering into pure utility functions, and render the UI with a server page shell plus a client-side browser component that owns filters, range presets, and hover state. Render the timeline directly with CSS and React instead of a chart library so layout, motion, and the Apple-like visual treatment stay fully controllable.

**Tech Stack:** Next.js 16.2.1, React 19.2.4, TypeScript 5, Tailwind CSS 4, ESLint 9, Vitest, Testing Library, jsdom, date-fns.

---

### Task 1: Bootstrap The Next.js App And Test Harness

**Files:**
- Create: `.gitignore`
- Create: `app/globals.css`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `eslint.config.mjs`
- Create: `next-env.d.ts`
- Create: `next.config.ts`
- Create: `package.json`
- Create: `postcss.config.mjs`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Test: `app/page.test.tsx`

**Step 1: Write the failing smoke test**

```tsx
import { render, screen } from "@testing-library/react";
import Home from "./page";

it("renders the conference timeline heading", () => {
  render(<Home />);
  expect(
    screen.getByRole("heading", { name: /conference timeline/i }),
  ).toBeInTheDocument();
});
```

**Step 2: Run the test to verify it fails**

Run:

```bash
npm run test -- --run app/page.test.tsx
```

Expected: fail because the project and `test` script do not exist yet.

**Step 3: Scaffold the app and add the test harness**

Run:

```bash
tmpdir="/tmp/aitimelinebootstrap$(date +%s)"
npm create next-app@latest "$tmpdir" -- --ts --tailwind --eslint --app --empty --use-npm --skip-install --disable-git --yes
rsync -a "$tmpdir"/ ./ \
  --exclude "AGENTS.md" \
  --exclude "CLAUDE.md" \
  --exclude "README.md"
npm pkg set name="aitimeline"
npm pkg set scripts.test="vitest"
npm install
npm install date-fns
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @vitejs/plugin-react
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./vitest.setup.ts",
  },
});
```

Create `vitest.setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

Update `app/page.tsx` minimally:

```tsx
export default function Home() {
  return (
    <main className="min-h-screen p-10">
      <h1 className="text-4xl font-semibold tracking-tight">
        Conference Timeline
      </h1>
    </main>
  );
}
```

**Step 4: Run verification**

Run:

```bash
npm run test -- --run app/page.test.tsx
npm run lint
npm run build
```

Expected: all three commands pass.

**Step 5: Commit**

```bash
git add .gitignore app app/page.test.tsx eslint.config.mjs next-env.d.ts next.config.ts package.json package-lock.json postcss.config.mjs tsconfig.json vitest.config.ts vitest.setup.ts
git commit -m "chore: bootstrap next timeline app"
```

### Task 2: Define The Conference Data Model And Seed Data

**Files:**
- Create: `src/types/conference.ts`
- Create: `src/data/conferences.ts`
- Create: `src/lib/timeline/date-range.ts`
- Create: `src/lib/timeline/date-range.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { getDefaultVisibleRange } from "./date-range";

describe("getDefaultVisibleRange", () => {
  it("uses two months back and four months forward", () => {
    const range = getDefaultVisibleRange(new Date("2026-03-26T00:00:00Z"));

    expect(range.start.toISOString().slice(0, 10)).toBe("2026-01-26");
    expect(range.end.toISOString().slice(0, 10)).toBe("2026-07-26");
  });
});
```

**Step 2: Run the test to verify it fails**

Run:

```bash
npm run test -- --run src/lib/timeline/date-range.test.ts
```

Expected: fail with `Cannot find module './date-range'` or equivalent.

**Step 3: Write the minimal implementation**

Create `src/types/conference.ts` with the core model:

```ts
export type ConferenceCategory =
  | "AI"
  | "CG"
  | "CT"
  | "DB"
  | "DS"
  | "HI"
  | "MX"
  | "NW"
  | "SC"
  | "SE";

export type MilestoneType =
  | "abstract"
  | "fullPaper"
  | "supplementary"
  | "rebuttalStart"
  | "rebuttalEnd"
  | "notification"
  | "cameraReady"
  | "conferenceStart"
  | "conferenceEnd"
  | "workshop";

export interface Milestone {
  id: string;
  type: MilestoneType;
  label: string;
  dateStart: string;
  dateEnd?: string;
  timezone: string;
  importance: "primary" | "secondary";
  note?: string;
}

export interface Conference {
  id: string;
  slug: string;
  title: string;
  shortName: string;
  year: number;
  website: string;
  location: string;
  category: ConferenceCategory;
  rankings: {
    ccf?: string;
    core?: string;
    thcpl?: string;
  };
  milestones: Milestone[];
}
```

Create `src/lib/timeline/date-range.ts`:

```ts
export function getDefaultVisibleRange(now: Date) {
  const start = new Date(now);
  start.setMonth(start.getMonth() - 2);

  const end = new Date(now);
  end.setMonth(end.getMonth() + 4);

  return { start, end };
}
```

Create `src/data/conferences.ts` with an initial curated dataset covering multiple categories and milestone types. Seed at least 8 conferences so filters and layout have enough variation. Include:

- conference short name and full name
- CCF / CORE / THCPL values when known
- location
- website for the current year
- primary milestones for `fullPaper`, `rebuttalStart`, `rebuttalEnd`, `notification`
- secondary milestones such as `abstract`, `cameraReady`, `conferenceStart`, `conferenceEnd`

**Step 4: Run the test to verify it passes**

Run:

```bash
npm run test -- --run src/lib/timeline/date-range.test.ts
```

Expected: pass.

**Step 5: Commit**

```bash
git add src/types/conference.ts src/data/conferences.ts src/lib/timeline/date-range.ts src/lib/timeline/date-range.test.ts
git commit -m "feat: add typed conference data model"
```

### Task 3: Add Filtering, Key-Path, And Positioning Utilities

**Files:**
- Create: `src/lib/timeline/filtering.ts`
- Create: `src/lib/timeline/key-path.ts`
- Create: `src/lib/timeline/positioning.ts`
- Test: `src/lib/timeline/filtering.test.ts`
- Test: `src/lib/timeline/key-path.test.ts`
- Test: `src/lib/timeline/positioning.test.ts`

**Step 1: Write the failing tests**

Create `src/lib/timeline/filtering.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { conferences } from "@/data/conferences";
import { filterConferences } from "./filtering";

describe("filterConferences", () => {
  it("filters by search query, category, milestone types, and range", () => {
    const result = filterConferences({
      conferences,
      query: "neurips",
      categories: new Set(["AI"]),
      visibleMilestoneTypes: new Set(["fullPaper", "notification"]),
      visibleRange: {
        start: new Date("2026-06-01T00:00:00Z"),
        end: new Date("2026-12-31T00:00:00Z"),
      },
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.shortName).toMatch(/neurips/i);
    expect(result[0]?.milestones.every((item) => item.type !== "cameraReady")).toBe(true);
  });
});
```

Create `src/lib/timeline/key-path.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { conferences } from "@/data/conferences";
import { getPrimaryPathTypes } from "./key-path";

describe("getPrimaryPathTypes", () => {
  it("returns the decision path in order", () => {
    const types = getPrimaryPathTypes(conferences[0]!.milestones);
    expect(types).toEqual(["fullPaper", "rebuttalStart", "notification"]);
  });
});
```

Create `src/lib/timeline/positioning.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getPositionPercent } from "./positioning";

describe("getPositionPercent", () => {
  it("maps the visible range bounds to 0 and 100", () => {
    const start = new Date("2026-01-01T00:00:00Z");
    const end = new Date("2026-03-01T00:00:00Z");

    expect(getPositionPercent(start, { start, end })).toBe(0);
    expect(getPositionPercent(end, { start, end })).toBe(100);
  });
});
```

**Step 2: Run the tests to verify they fail**

Run:

```bash
npm run test -- --run src/lib/timeline/filtering.test.ts src/lib/timeline/key-path.test.ts src/lib/timeline/positioning.test.ts
```

Expected: fail because the utility modules do not exist yet.

**Step 3: Write the minimal implementation**

Create `src/lib/timeline/filtering.ts` with one pure entry point:

```ts
interface FilterArgs {
  conferences: Conference[];
  query: string;
  categories: Set<ConferenceCategory>;
  visibleMilestoneTypes: Set<MilestoneType>;
  visibleRange: { start: Date; end: Date };
}

export function filterConferences(args: FilterArgs): Conference[] {
  // filter by query/category first, then drop milestones outside type/range
}
```

Create `src/lib/timeline/key-path.ts`:

```ts
const PRIMARY_PATH: MilestoneType[] = ["fullPaper", "rebuttalStart", "notification"];

export function getPrimaryPathTypes(milestones: Milestone[]) {
  return PRIMARY_PATH.filter((type) =>
    milestones.some((item) => item.type === type),
  );
}
```

Create `src/lib/timeline/positioning.ts`:

```ts
export function getPositionPercent(
  value: Date,
  range: { start: Date; end: Date },
) {
  const total = range.end.getTime() - range.start.getTime();
  const offset = value.getTime() - range.start.getTime();
  return Math.max(0, Math.min(100, (offset / total) * 100));
}
```

**Step 4: Run the tests to verify they pass**

Run:

```bash
npm run test -- --run src/lib/timeline/filtering.test.ts src/lib/timeline/key-path.test.ts src/lib/timeline/positioning.test.ts
```

Expected: pass.

**Step 5: Commit**

```bash
git add src/lib/timeline/filtering.ts src/lib/timeline/filtering.test.ts src/lib/timeline/key-path.ts src/lib/timeline/key-path.test.ts src/lib/timeline/positioning.ts src/lib/timeline/positioning.test.ts
git commit -m "feat: add timeline filtering utilities"
```

### Task 4: Create The Browser Shell And Sticky Controls

**Files:**
- Modify: `app/page.tsx`
- Create: `src/components/timeline/timeline-browser.tsx`
- Create: `src/components/timeline/controls-bar.tsx`
- Test: `src/components/timeline/timeline-browser.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { conferences } from "@/data/conferences";
import { TimelineBrowser } from "./timeline-browser";

it("renders the sticky control bar and seeded conferences", () => {
  render(
    <TimelineBrowser
      conferences={conferences}
      now={new Date("2026-03-26T00:00:00Z")}
    />,
  );

  expect(screen.getByPlaceholderText(/search conferences/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "6M" })).toBeInTheDocument();
  expect(screen.getByText(conferences[0]!.shortName)).toBeInTheDocument();
});
```

**Step 2: Run the test to verify it fails**

Run:

```bash
npm run test -- --run src/components/timeline/timeline-browser.test.tsx
```

Expected: fail because the component does not exist yet.

**Step 3: Write the minimal implementation**

Create `src/components/timeline/timeline-browser.tsx` as the main client component:

```tsx
"use client";

import { useState } from "react";
import { getDefaultVisibleRange } from "@/lib/timeline/date-range";
import { filterConferences } from "@/lib/timeline/filtering";
import type { Conference, MilestoneType } from "@/types/conference";

interface TimelineBrowserProps {
  conferences: Conference[];
  now: Date;
}

export function TimelineBrowser({ conferences, now }: TimelineBrowserProps) {
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<Set<Conference["category"]>>(new Set());
  const [visibleMilestoneTypes, setVisibleMilestoneTypes] = useState<Set<MilestoneType>>(
    new Set(["abstract", "fullPaper", "rebuttalStart", "rebuttalEnd", "notification", "cameraReady", "conferenceStart", "conferenceEnd"]),
  );
  const [visibleRange, setVisibleRange] = useState(getDefaultVisibleRange(now));

  const visibleConferences = filterConferences({
    conferences,
    query,
    categories,
    visibleMilestoneTypes,
    visibleRange,
  });

  return (
    <main>
      <ControlsBar
        query={query}
        onQueryChange={setQuery}
        visibleRange={visibleRange}
        onRangeChange={setVisibleRange}
      />
      <section>{visibleConferences.map((conference) => conference.shortName)}</section>
    </main>
  );
}
```

Update `app/page.tsx` to import the seeded data and render `TimelineBrowser`.

**Step 4: Run the test to verify it passes**

Run:

```bash
npm run test -- --run src/components/timeline/timeline-browser.test.tsx
```

Expected: pass.

**Step 5: Commit**

```bash
git add app/page.tsx src/components/timeline/timeline-browser.tsx src/components/timeline/controls-bar.tsx src/components/timeline/timeline-browser.test.tsx
git commit -m "feat: add timeline browser shell"
```

### Task 5: Make Filtering Interactions Work

**Files:**
- Modify: `src/components/timeline/timeline-browser.tsx`
- Modify: `src/components/timeline/controls-bar.tsx`
- Test: `src/components/timeline/controls-bar.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { conferences } from "@/data/conferences";
import { TimelineBrowser } from "./timeline-browser";

it("updates the visible rows when search and presets change", async () => {
  const user = userEvent.setup();

  render(
    <TimelineBrowser
      conferences={conferences}
      now={new Date("2026-03-26T00:00:00Z")}
    />,
  );

  await user.type(screen.getByPlaceholderText(/search conferences/i), "icml");

  expect(screen.getByText(/icml/i)).toBeInTheDocument();
  expect(screen.queryByText(/neurips/i)).not.toBeInTheDocument();
});
```

**Step 2: Run the test to verify it fails**

Run:

```bash
npm run test -- --run src/components/timeline/controls-bar.test.tsx
```

Expected: fail because the search input is not wired to visible rows yet.

**Step 3: Write the minimal implementation**

Expand `ControlsBar` to render:

- search input
- category toggles
- milestone type toggles
- range preset buttons: `3M`, `6M`, `12M`, `All`

Keep `ControlsBar` dumb and let `TimelineBrowser` own state. The key prop surface should look like:

```tsx
interface ControlsBarProps {
  query: string;
  onQueryChange: (value: string) => void;
  categories: Set<ConferenceCategory>;
  onCategoryToggle: (value: ConferenceCategory) => void;
  visibleMilestoneTypes: Set<MilestoneType>;
  onMilestoneToggle: (value: MilestoneType) => void;
  onPresetSelect: (preset: "3M" | "6M" | "12M" | "All") => void;
}
```

**Step 4: Run the test to verify it passes**

Run:

```bash
npm run test -- --run src/components/timeline/controls-bar.test.tsx
```

Expected: pass.

**Step 5: Commit**

```bash
git add src/components/timeline/timeline-browser.tsx src/components/timeline/controls-bar.tsx src/components/timeline/controls-bar.test.tsx
git commit -m "feat: add timeline filtering controls"
```

### Task 6: Render The Conference Metadata Column And External Links

**Files:**
- Create: `src/components/timeline/conference-meta-column.tsx`
- Modify: `src/components/timeline/timeline-browser.tsx`
- Test: `src/components/timeline/conference-meta-column.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { conferences } from "@/data/conferences";
import { ConferenceMetaColumn } from "./conference-meta-column";

it("shows rankings, location, and an external conference link", () => {
  render(<ConferenceMetaColumn conference={conferences[0]!} />);

  const link = screen.getByRole("link", { name: conferences[0]!.shortName });

  expect(link).toHaveAttribute("target", "_blank");
  expect(link).toHaveAttribute("rel", expect.stringContaining("noreferrer"));
  expect(screen.getByText(/ccf/i)).toBeInTheDocument();
  expect(screen.getByText(conferences[0]!.location)).toBeInTheDocument();
});
```

**Step 2: Run the test to verify it fails**

Run:

```bash
npm run test -- --run src/components/timeline/conference-meta-column.test.tsx
```

Expected: fail because the metadata column component does not exist yet.

**Step 3: Write the minimal implementation**

Create `ConferenceMetaColumn` with:

- conference short name as the primary link
- full name below it
- compact ranking pills for `CCF`, `CORE`, `THCPL`
- location text

Keep the styling close to `ccfddl` in information density, but cleaner and more restrained.

**Step 4: Run the test to verify it passes**

Run:

```bash
npm run test -- --run src/components/timeline/conference-meta-column.test.tsx
```

Expected: pass.

**Step 5: Commit**

```bash
git add src/components/timeline/conference-meta-column.tsx src/components/timeline/timeline-browser.tsx src/components/timeline/conference-meta-column.test.tsx
git commit -m "feat: add conference metadata column"
```

### Task 7: Render The Timeline Grid, Key Path, And Tooltip

**Files:**
- Create: `src/components/timeline/timeline-grid.tsx`
- Create: `src/components/timeline/milestone-tooltip.tsx`
- Modify: `src/components/timeline/timeline-browser.tsx`
- Modify: `app/globals.css`
- Test: `src/components/timeline/timeline-grid.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { conferences } from "@/data/conferences";
import { TimelineGrid } from "./timeline-grid";

it("renders highlighted primary milestones and shows a tooltip on hover", async () => {
  const user = userEvent.setup();

  render(
    <TimelineGrid
      conferences={conferences.slice(0, 1)}
      visibleRange={{
        start: new Date("2026-01-01T00:00:00Z"),
        end: new Date("2026-12-31T00:00:00Z"),
      }}
    />,
  );

  const fullPaperNode = screen.getByLabelText(/full paper/i);
  expect(fullPaperNode).toHaveAttribute("data-primary-path", "true");

  await user.hover(fullPaperNode);
  expect(screen.getByText(/full paper/i)).toBeInTheDocument();
});
```

**Step 2: Run the test to verify it fails**

Run:

```bash
npm run test -- --run src/components/timeline/timeline-grid.test.tsx
```

Expected: fail because the grid and tooltip components do not exist yet.

**Step 3: Write the minimal implementation**

Create `TimelineGrid` so each row:

- uses shared `visibleRange`
- places point milestones using `left: ${percent}%`
- visually emphasizes `fullPaper`, `rebuttalStart`, `notification`
- draws range bars when paired milestones imply a span, especially `rebuttalStart -> rebuttalEnd` and `conferenceStart -> conferenceEnd`

Create `MilestoneTooltip` as a lightweight hover surface that shows:

- conference short name
- milestone label
- formatted date
- optional note

Update `app/globals.css` to define:

- neutral Apple-like color variables
- sticky top bar blur and border
- subtle hover transitions
- `prefers-reduced-motion` overrides

**Step 4: Run the test to verify it passes**

Run:

```bash
npm run test -- --run src/components/timeline/timeline-grid.test.tsx
```

Expected: pass.

**Step 5: Commit**

```bash
git add src/components/timeline/timeline-grid.tsx src/components/timeline/milestone-tooltip.tsx src/components/timeline/timeline-browser.tsx app/globals.css src/components/timeline/timeline-grid.test.tsx
git commit -m "feat: render gantt-style conference timeline"
```

### Task 8: Add Maintenance Docs And Run Full Verification

**Files:**
- Create: `README.md`
- Modify: `src/data/conferences.ts`

**Step 1: Document how to maintain conference data**

Add a concise `README.md` section that explains:

- where the data file lives
- how to add a new conference
- which milestone types are supported
- how to run the app locally
- how to run tests, lint, and build

Add short comments in `src/data/conferences.ts` only where they help future editors understand expected ordering or date format.

**Step 2: Run the full test suite**

Run:

```bash
npm run test -- --run
```

Expected: all tests pass.

**Step 3: Run static verification**

Run:

```bash
npm run lint
npm run build
```

Expected: both commands pass.

**Step 4: Run the app for manual QA**

Run:

```bash
npm run dev
```

Manual checklist:

- default visible window is roughly past 2 months plus next 4 months
- conference names open external sites in a new tab
- full paper / rebuttal / notification read as the strongest visual path
- search and filters update the visible rows without jank
- page remains usable on desktop and narrower laptop widths
- reduced motion does not break layout

**Step 5: Commit**

```bash
git add README.md src/data/conferences.ts
git commit -m "docs: add conference timeline maintenance notes"
```
