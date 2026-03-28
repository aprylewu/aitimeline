# Conference Data Sync + UI Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auto-sync 300+ conferences from two GitHub sources at build time and overhaul the visual design toward a Linear/Vercel aesthetic.

**Architecture:** Build-time data pipeline fetches YAML from ccfddl (339 confs, all CS categories) and huggingface/ai-deadlines (63 confs, full milestone chains), merges them into the existing `Conference[]` type, and falls back to a committed cache.json if fetch fails. ISR revalidates every 24h. UI overhaul swaps to Geist font, cool neutral color system, refined controls and timeline grid.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, Vitest, date-fns, js-yaml (new), geist (new)

---

## File Structure

**New files (data sync):**

| File | Responsibility |
|------|---------------|
| `src/lib/data/types.ts` | Intermediate types for raw ccfddl and HF YAML data |
| `src/lib/data/slug.ts` | Slug normalization: lowercase, strip year, collapse hyphens |
| `src/lib/data/slug.test.ts` | Tests for slug normalization |
| `src/lib/data/category.ts` | Map HF tags array → ConferenceCategory |
| `src/lib/data/category.test.ts` | Tests for category inference |
| `src/lib/data/rankings.ts` | Parse HF rankings string → ConferenceRanking |
| `src/lib/data/rankings.test.ts` | Tests for rankings parsing |
| `src/lib/data/fetch-ccfddl.ts` | Fetch + parse all ccfddl YAML → CcfddlConference[] |
| `src/lib/data/fetch-ccfddl.test.ts` | Tests with mocked fetch |
| `src/lib/data/fetch-hf.ts` | Fetch + parse all HF YAML → HfConference[] |
| `src/lib/data/fetch-hf.test.ts` | Tests with mocked fetch |
| `src/lib/data/merge-sources.ts` | Merge both sources → Conference[] |
| `src/lib/data/merge-sources.test.ts` | Tests with fixture data |
| `src/lib/data/get-conferences.ts` | Orchestrator: fetch both, merge, fallback to cache |
| `src/lib/data/get-conferences.test.ts` | Tests with mocked dependencies |
| `src/lib/data/cache.json` | Committed fallback snapshot |
| `scripts/update-cache.ts` | CLI to regenerate cache.json |

**Modified files:**

| File | Change |
|------|--------|
| `package.json` | Add `js-yaml`, `@types/js-yaml`, `geist` |
| `src/lib/timeline/sections.ts` | Remove `hasRenderablePrimaryPath` filter to allow partial conferences |
| `src/lib/timeline/sections.test.ts` | Update expectations for NeurIPS now being visible |
| `app/page.tsx` | Replace static import with `await getConferences()`, add ISR revalidate |
| `app/layout.tsx` | Swap Atkinson Hyperlegible → Geist Sans + Geist Mono |
| `app/globals.css` | Full color/spacing/typography overhaul |
| `src/components/timeline/controls-bar.tsx` | Segmented presets, icon theme toggle, milestone popover, search badge |
| `src/components/timeline/timeline-browser.tsx` | Milestone popover state, updated header typography, empty state |
| `src/components/timeline/timeline-grid.tsx` | Refined markers, path track, today line, row height, grid lines |
| `src/components/timeline/milestone-tooltip.tsx` | Backdrop blur, countdown, Geist Mono dates |
| `src/components/timeline/conference-meta-column.tsx` | Medium weight name, muted year suffix |

---

## Workstream A: Data Sync Pipeline

### Task 1: Install dependencies and create raw types

**Files:**
- Modify: `package.json`
- Create: `src/lib/data/types.ts`

- [ ] **Step 1: Install js-yaml**

Run: `npm install js-yaml && npm install --save-dev @types/js-yaml`

- [ ] **Step 2: Create intermediate types for raw source data**

Create `src/lib/data/types.ts`:

```typescript
/** Raw shape of a single ccfddl YAML file (top-level array element). */
export interface CcfddlRawSeries {
  title: string;
  description: string;
  sub: string;
  rank: {
    ccf?: string;
    core?: string;
    thcpl?: string;
  };
  dblp?: string;
  confs: CcfddlRawConf[];
}

export interface CcfddlRawConf {
  year: number;
  id: string;
  link: string;
  timeline: Array<{
    abstract_deadline?: string;
    deadline: string;
    comment?: string;
  }>;
  timezone: string;
  date: string;
  place: string;
}

/** Flattened ccfddl conference (one per series+year). */
export interface CcfddlConference {
  shortName: string;
  fullName: string;
  category: string;
  rank: { ccf?: string; core?: string; thcpl?: string };
  year: number;
  id: string;
  website: string;
  location: string;
  timezone: string;
  abstractDeadline: string | null;
  submissionDeadline: string;
  conferenceDateStr: string;
}

/** Raw shape of a single HF YAML file entry. */
export interface HfRawConference {
  title: string;
  year: number;
  id: string;
  full_name?: string;
  link: string;
  deadlines: Array<{
    type: string;
    label: string;
    date: string;
    timezone?: string;
  }>;
  date?: string;
  start?: string;
  end?: string;
  city?: string;
  country?: string;
  venue?: string;
  rankings?: string;
  hindex?: number;
  tags?: string[];
}

/** Flattened HF conference. */
export interface HfConference {
  shortName: string;
  fullName: string;
  year: number;
  id: string;
  website: string;
  location: string;
  deadlines: Array<{
    type: string;
    label: string;
    date: string;
    timezone: string;
  }>;
  conferenceStart: string | null;
  conferenceEnd: string | null;
  rankingsStr: string | null;
  tags: string[];
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/data/types.ts package.json package-lock.json
git commit -m "feat: add js-yaml dependency and raw data source types"
```

---

### Task 2: Slug normalization

**Files:**
- Create: `src/lib/data/slug.ts`
- Create: `src/lib/data/slug.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/data/slug.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { normalizeSlug } from "./slug";

describe("normalizeSlug", () => {
  it("lowercases and strips year suffixes", () => {
    expect(normalizeSlug("AAAI26")).toBe("aaai");
    expect(normalizeSlug("icml-2026")).toBe("icml");
    expect(normalizeSlug("NeurIPS2026")).toBe("neurips");
  });

  it("collapses hyphens and trims", () => {
    expect(normalizeSlug("chi--2026")).toBe("chi");
    expect(normalizeSlug("  CVPR  ")).toBe("cvpr");
  });

  it("handles slugs without year", () => {
    expect(normalizeSlug("sigmod")).toBe("sigmod");
    expect(normalizeSlug("kdd")).toBe("kdd");
  });

  it("strips trailing digits that look like a year", () => {
    expect(normalizeSlug("aaai26")).toBe("aaai");
    expect(normalizeSlug("chi2026")).toBe("chi");
    expect(normalizeSlug("s3")).toBe("s3");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/data/slug.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/data/slug.ts`:

```typescript
/**
 * Normalize a conference slug for cross-source matching.
 * Lowercases, strips year suffixes (2-digit or 4-digit), collapses hyphens, trims.
 */
export function normalizeSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, "-")
    .replace(/-?(20\d{2}|\d{2})$/, "")
    .replace(/-+$/, "");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/data/slug.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/data/slug.ts src/lib/data/slug.test.ts
git commit -m "feat: add slug normalization for cross-source matching"
```

---

### Task 3: Category inference from HF tags

**Files:**
- Create: `src/lib/data/category.ts`
- Create: `src/lib/data/category.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/data/category.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { inferCategory } from "./category";

describe("inferCategory", () => {
  it("maps machine-learning to AI", () => {
    expect(inferCategory(["machine-learning", "optimization"])).toBe("AI");
  });

  it("maps computer-vision to MX", () => {
    expect(inferCategory(["computer-vision"])).toBe("MX");
  });

  it("maps data-mining to DS", () => {
    expect(inferCategory(["data-mining", "machine-learning"])).toBe("DS");
  });

  it("maps human-computer-interaction to HI", () => {
    expect(inferCategory(["human-computer-interaction"])).toBe("HI");
  });

  it("maps databases to DB", () => {
    expect(inferCategory(["databases"])).toBe("DB");
  });

  it("maps security to SC", () => {
    expect(inferCategory(["security"])).toBe("SC");
  });

  it("maps networking to NW", () => {
    expect(inferCategory(["networking"])).toBe("NW");
  });

  it("maps software-engineering to SE", () => {
    expect(inferCategory(["software-engineering"])).toBe("SE");
  });

  it("maps theory to CT", () => {
    expect(inferCategory(["theory"])).toBe("CT");
  });

  it("maps computer-graphics to CG", () => {
    expect(inferCategory(["computer-graphics"])).toBe("CG");
  });

  it("defaults to AI for unknown tags", () => {
    expect(inferCategory(["unknown-tag"])).toBe("AI");
    expect(inferCategory([])).toBe("AI");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/data/category.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/data/category.ts`:

```typescript
import type { ConferenceCategory } from "@/types/conference";

const TAG_TO_CATEGORY: Array<[string[], ConferenceCategory]> = [
  [["data-mining", "information-retrieval"], "DS"],
  [["computer-vision"], "MX"],
  [["computer-graphics", "visualization"], "CG"],
  [["human-computer-interaction"], "HI"],
  [["databases"], "DB"],
  [["security", "cryptography"], "SC"],
  [["networking", "distributed-systems"], "NW"],
  [["software-engineering", "programming-languages"], "SE"],
  [["theory", "algorithms"], "CT"],
  [["machine-learning", "deep-learning", "natural-language-processing", "speech"], "AI"],
];

export function inferCategory(tags: string[]): ConferenceCategory {
  const tagSet = new Set(tags.map((t) => t.toLowerCase()));

  for (const [keywords, category] of TAG_TO_CATEGORY) {
    if (keywords.some((kw) => tagSet.has(kw))) {
      return category;
    }
  }

  return "AI";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/data/category.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/data/category.ts src/lib/data/category.test.ts
git commit -m "feat: add HF tag to ConferenceCategory inference"
```

---

### Task 4: Rankings string parsing

**Files:**
- Create: `src/lib/data/rankings.ts`
- Create: `src/lib/data/rankings.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/data/rankings.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { parseRankingsString } from "./rankings";

describe("parseRankingsString", () => {
  it("parses a full rankings string", () => {
    expect(parseRankingsString("CCF: A, CORE: A*, THCPL: A")).toEqual({
      ccf: "A",
      core: "A*",
      thcpl: "A",
    });
  });

  it("parses partial rankings", () => {
    expect(parseRankingsString("CCF: B, CORE: A")).toEqual({
      ccf: "B",
      core: "A",
    });
  });

  it("returns empty object for null/empty input", () => {
    expect(parseRankingsString(null)).toEqual({});
    expect(parseRankingsString("")).toEqual({});
  });

  it("handles extra whitespace", () => {
    expect(parseRankingsString("  CCF:  A ,  CORE:  B  ")).toEqual({
      ccf: "A",
      core: "B",
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/data/rankings.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/data/rankings.ts`:

```typescript
import type { ConferenceRanking } from "@/types/conference";

const RANKING_KEY_MAP: Record<string, keyof ConferenceRanking> = {
  ccf: "ccf",
  core: "core",
  thcpl: "thcpl",
};

export function parseRankingsString(raw: string | null): ConferenceRanking {
  if (!raw || !raw.trim()) {
    return {};
  }

  const result: ConferenceRanking = {};

  for (const part of raw.split(",")) {
    const match = part.trim().match(/^(\w+):\s*(.+)$/);

    if (match) {
      const key = RANKING_KEY_MAP[match[1].toLowerCase()];

      if (key) {
        result[key] = match[2].trim();
      }
    }
  }

  return result;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/data/rankings.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/data/rankings.ts src/lib/data/rankings.test.ts
git commit -m "feat: add HF rankings string parser"
```

---

### Task 5: Fetch and parse ccfddl data

**Files:**
- Create: `src/lib/data/fetch-ccfddl.ts`
- Create: `src/lib/data/fetch-ccfddl.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/data/fetch-ccfddl.test.ts`:

```typescript
import { describe, expect, it, vi, beforeEach } from "vitest";
import { fetchCcfddl } from "./fetch-ccfddl";

const MOCK_TREE = {
  tree: [
    { path: "conference/AI/aaai.yml", type: "blob" },
    { path: "conference/DB/sigmod.yml", type: "blob" },
    { path: "README.md", type: "blob" },
  ],
};

const MOCK_AAAI_YAML = `
- title: AAAI
  description: AAAI Conference on Artificial Intelligence
  sub: AI
  rank:
    ccf: A
    core: "A*"
    thcpl: A
  confs:
    - year: 2026
      id: aaai26
      link: https://aaai.org/2026
      timeline:
        - abstract_deadline: '2025-07-25 23:59:59'
          deadline: '2025-08-01 23:59:59'
      timezone: UTC-12
      date: February 20 - 27, 2026
      place: Philadelphia, USA
`;

const MOCK_SIGMOD_YAML = `
- title: SIGMOD
  description: ACM SIGMOD Conference
  sub: DB
  rank:
    ccf: A
    core: "A*"
  confs:
    - year: 2026
      id: sigmod26
      link: https://sigmod2026.org
      timeline:
        - deadline: '2025-10-17 23:59:59'
      timezone: UTC-12
      date: June 1 - 5, 2026
      place: Bengaluru, India
`;

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("fetchCcfddl", () => {
  it("fetches tree, downloads YAML files, and parses to CcfddlConference[]", async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_TREE),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(MOCK_AAAI_YAML),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(MOCK_SIGMOD_YAML),
      });
    vi.stubGlobal("fetch", mockFetch);

    const result = await fetchCcfddl();

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      shortName: "AAAI",
      category: "AI",
      year: 2026,
      submissionDeadline: "2025-08-01",
    });
    expect(result[0].abstractDeadline).toBe("2025-07-25");
    expect(result[1]).toMatchObject({
      shortName: "SIGMOD",
      category: "DB",
      year: 2026,
    });
  });

  it("returns empty array when tree fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({ ok: false }));

    const result = await fetchCcfddl();

    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/data/fetch-ccfddl.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write implementation**

Create `src/lib/data/fetch-ccfddl.ts`:

```typescript
import yaml from "js-yaml";
import type { CcfddlConference, CcfddlRawSeries } from "./types";

const TREE_URL =
  "https://api.github.com/repos/ccfddl/ccf-deadlines/git/trees/main?recursive=1";
const RAW_BASE =
  "https://raw.githubusercontent.com/ccfddl/ccf-deadlines/main";

function extractDate(datetime: string): string {
  return datetime.split(" ")[0];
}

function normalizeCcfTimezone(tz: string): string {
  if (tz === "UTC-12") {
    return "AoE";
  }

  return "UTC";
}

function flattenSeries(series: CcfddlRawSeries): CcfddlConference[] {
  return series.confs.map((conf) => {
    const timeline = conf.timeline[0];

    return {
      shortName: series.title,
      fullName: series.description,
      category: series.sub,
      rank: series.rank ?? {},
      year: conf.year,
      id: conf.id,
      website: conf.link,
      location: conf.place,
      timezone: normalizeCcfTimezone(conf.timezone),
      abstractDeadline: timeline?.abstract_deadline
        ? extractDate(timeline.abstract_deadline)
        : null,
      submissionDeadline: extractDate(timeline?.deadline ?? ""),
      conferenceDateStr: conf.date,
    };
  });
}

export async function fetchCcfddl(): Promise<CcfddlConference[]> {
  try {
    const treeResponse = await fetch(TREE_URL);

    if (!treeResponse.ok) {
      return [];
    }

    const tree = await treeResponse.json();
    const yamlPaths: string[] = tree.tree
      .filter(
        (item: { path: string; type: string }) =>
          item.type === "blob" &&
          item.path.startsWith("conference/") &&
          item.path.endsWith(".yml"),
      )
      .map((item: { path: string }) => item.path);

    const yamlTexts = await Promise.all(
      yamlPaths.map(async (path) => {
        const response = await fetch(`${RAW_BASE}/${path}`);

        if (!response.ok) {
          return null;
        }

        return response.text();
      }),
    );

    return yamlTexts
      .filter((text): text is string => text !== null)
      .flatMap((text) => {
        const parsed = yaml.load(text) as CcfddlRawSeries[] | null;

        if (!Array.isArray(parsed)) {
          return [];
        }

        return parsed.flatMap(flattenSeries);
      });
  } catch {
    return [];
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/data/fetch-ccfddl.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/data/fetch-ccfddl.ts src/lib/data/fetch-ccfddl.test.ts
git commit -m "feat: add ccfddl data fetcher with YAML parsing"
```

---

### Task 6: Fetch and parse HF data

**Files:**
- Create: `src/lib/data/fetch-hf.ts`
- Create: `src/lib/data/fetch-hf.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/data/fetch-hf.test.ts`:

```typescript
import { describe, expect, it, vi, beforeEach } from "vitest";
import { fetchHfDeadlines } from "./fetch-hf";

const MOCK_TREE = {
  tree: [
    { path: "src/data/conferences/aaai.yml", type: "blob" },
    { path: "src/data/conferences/README.md", type: "blob" },
  ],
};

const MOCK_AAAI_YAML = `
- title: AAAI
  year: 2026
  id: aaai26
  full_name: AAAI Conference on Artificial Intelligence
  link: https://aaai.org/2026
  deadlines:
    - type: abstract
      label: Abstract deadline
      date: '2025-07-25 23:59:59'
      timezone: AoE
    - type: paper
      label: Paper deadline
      date: '2025-08-01 23:59:59'
      timezone: AoE
    - type: notification
      label: Decision
      date: '2025-11-08 23:59:59'
      timezone: AoE
  start: '2026-02-20'
  end: '2026-02-27'
  city: Philadelphia
  country: USA
  venue: Philadelphia Convention Center
  rankings: 'CCF: A, CORE: A*, THCPL: A'
  tags:
    - machine-learning
    - natural-language-processing
`;

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("fetchHfDeadlines", () => {
  it("fetches tree, downloads YAML, and parses to HfConference[]", async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_TREE),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(MOCK_AAAI_YAML),
      });
    vi.stubGlobal("fetch", mockFetch);

    const result = await fetchHfDeadlines();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      shortName: "AAAI",
      fullName: "AAAI Conference on Artificial Intelligence",
      year: 2026,
      website: "https://aaai.org/2026",
      conferenceStart: "2026-02-20",
      conferenceEnd: "2026-02-27",
    });
    expect(result[0].deadlines).toHaveLength(3);
    expect(result[0].tags).toContain("machine-learning");
  });

  it("returns empty array when tree fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({ ok: false }));

    const result = await fetchHfDeadlines();

    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/data/fetch-hf.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write implementation**

Create `src/lib/data/fetch-hf.ts`:

```typescript
import yaml from "js-yaml";
import type { HfConference, HfRawConference } from "./types";

const TREE_URL =
  "https://api.github.com/repos/huggingface/ai-deadlines/git/trees/main?recursive=1";
const RAW_BASE =
  "https://raw.githubusercontent.com/huggingface/ai-deadlines/main";

function toHfConference(raw: HfRawConference): HfConference {
  const location = [raw.venue, raw.city, raw.country]
    .filter(Boolean)
    .join(", ");

  return {
    shortName: raw.title,
    fullName: raw.full_name ?? raw.title,
    year: raw.year,
    id: raw.id,
    website: raw.link,
    location: location || "TBA",
    deadlines: raw.deadlines.map((d) => ({
      type: d.type,
      label: d.label,
      date: d.date.split(" ")[0],
      timezone: d.timezone ?? "AoE",
    })),
    conferenceStart: raw.start ?? null,
    conferenceEnd: raw.end ?? null,
    rankingsStr: raw.rankings ?? null,
    tags: raw.tags ?? [],
  };
}

export async function fetchHfDeadlines(): Promise<HfConference[]> {
  try {
    const treeResponse = await fetch(TREE_URL);

    if (!treeResponse.ok) {
      return [];
    }

    const tree = await treeResponse.json();
    const yamlPaths: string[] = tree.tree
      .filter(
        (item: { path: string; type: string }) =>
          item.type === "blob" &&
          item.path.startsWith("src/data/conferences/") &&
          item.path.endsWith(".yml"),
      )
      .map((item: { path: string }) => item.path);

    const yamlTexts = await Promise.all(
      yamlPaths.map(async (path) => {
        const response = await fetch(`${RAW_BASE}/${path}`);

        if (!response.ok) {
          return null;
        }

        return response.text();
      }),
    );

    return yamlTexts
      .filter((text): text is string => text !== null)
      .flatMap((text) => {
        const parsed = yaml.load(text) as HfRawConference[] | null;

        if (!Array.isArray(parsed)) {
          return [];
        }

        return parsed.map(toHfConference);
      });
  } catch {
    return [];
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/data/fetch-hf.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/data/fetch-hf.ts src/lib/data/fetch-hf.test.ts
git commit -m "feat: add HF ai-deadlines data fetcher"
```

---

### Task 7: Merge sources into Conference[]

**Files:**
- Create: `src/lib/data/merge-sources.ts`
- Create: `src/lib/data/merge-sources.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/data/merge-sources.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { mergeSources } from "./merge-sources";
import type { CcfddlConference, HfConference } from "./types";

const ccfddlFixtures: CcfddlConference[] = [
  {
    shortName: "AAAI",
    fullName: "AAAI Conference on Artificial Intelligence",
    category: "AI",
    rank: { ccf: "A", core: "A*", thcpl: "A" },
    year: 2026,
    id: "aaai26",
    website: "https://aaai.org/2026",
    location: "Philadelphia, USA",
    timezone: "AoE",
    abstractDeadline: "2025-07-25",
    submissionDeadline: "2025-08-01",
    conferenceDateStr: "February 20 - 27, 2026",
  },
  {
    shortName: "SIGMOD",
    fullName: "ACM SIGMOD Conference",
    category: "DB",
    rank: { ccf: "A", core: "A*" },
    year: 2026,
    id: "sigmod26",
    website: "https://sigmod2026.org",
    location: "Bengaluru, India",
    timezone: "AoE",
    abstractDeadline: null,
    submissionDeadline: "2025-10-17",
    conferenceDateStr: "June 1 - 5, 2026",
  },
];

const hfFixtures: HfConference[] = [
  {
    shortName: "AAAI",
    fullName: "AAAI Conference on Artificial Intelligence",
    year: 2026,
    id: "aaai26",
    website: "https://aaai.org/2026",
    location: "Philadelphia Convention Center, Philadelphia, USA",
    deadlines: [
      { type: "abstract", label: "Abstract", date: "2025-07-25", timezone: "AoE" },
      { type: "paper", label: "Paper deadline", date: "2025-08-01", timezone: "AoE" },
      { type: "rebuttal_start", label: "Rebuttal opens", date: "2025-10-07", timezone: "AoE" },
      { type: "rebuttal_end", label: "Rebuttal closes", date: "2025-10-13", timezone: "AoE" },
      { type: "notification", label: "Decision", date: "2025-11-08", timezone: "AoE" },
      { type: "camera_ready", label: "Camera ready", date: "2025-11-13", timezone: "AoE" },
    ],
    conferenceStart: "2026-02-20",
    conferenceEnd: "2026-02-27",
    rankingsStr: "CCF: A, CORE: A*, THCPL: A",
    tags: ["machine-learning"],
  },
  {
    shortName: "ICLR",
    fullName: "International Conference on Learning Representations",
    year: 2026,
    id: "iclr26",
    website: "https://iclr.cc/2026",
    location: "Rio de Janeiro, Brazil",
    deadlines: [
      { type: "paper", label: "Paper deadline", date: "2025-09-24", timezone: "AoE" },
      { type: "notification", label: "Decision", date: "2026-01-25", timezone: "AoE" },
    ],
    conferenceStart: "2026-04-23",
    conferenceEnd: "2026-04-27",
    rankingsStr: "CCF: A, CORE: A*",
    tags: ["machine-learning", "deep-learning"],
  },
];

describe("mergeSources", () => {
  it("merges matched conferences: HF milestones + ccfddl category/rankings", () => {
    const result = mergeSources(ccfddlFixtures, hfFixtures);
    const aaai = result.find((c) => c.shortName === "AAAI");

    expect(aaai).toBeDefined();
    expect(aaai!.category).toBe("AI");
    expect(aaai!.rankings).toEqual({ ccf: "A", core: "A*", thcpl: "A" });
    expect(aaai!.milestones.some((m) => m.type === "rebuttalStart")).toBe(true);
    expect(aaai!.milestones.some((m) => m.type === "notification")).toBe(true);
    expect(aaai!.milestones.some((m) => m.type === "conferenceStart")).toBe(true);
  });

  it("includes ccfddl-only conferences with submission milestones", () => {
    const result = mergeSources(ccfddlFixtures, hfFixtures);
    const sigmod = result.find((c) => c.shortName === "SIGMOD");

    expect(sigmod).toBeDefined();
    expect(sigmod!.category).toBe("DB");
    expect(sigmod!.milestones.some((m) => m.type === "fullPaper")).toBe(true);
    expect(sigmod!.milestones.some((m) => m.type === "rebuttalStart")).toBe(false);
  });

  it("includes HF-only conferences with inferred category", () => {
    const result = mergeSources(ccfddlFixtures, hfFixtures);
    const iclr = result.find((c) => c.shortName === "ICLR");

    expect(iclr).toBeDefined();
    expect(iclr!.category).toBe("AI");
    expect(iclr!.rankings).toEqual({ ccf: "A", core: "A*" });
  });

  it("produces valid Conference objects with required fields", () => {
    const result = mergeSources(ccfddlFixtures, hfFixtures);

    for (const conf of result) {
      expect(conf.id).toBeTruthy();
      expect(conf.slug).toBeTruthy();
      expect(conf.shortName).toBeTruthy();
      expect(conf.year).toBeGreaterThan(2000);
      expect(conf.milestones.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/data/merge-sources.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write implementation**

Create `src/lib/data/merge-sources.ts`:

```typescript
import type { Conference, ConferenceCategory, Milestone, MilestoneType } from "@/types/conference";
import { inferCategory } from "./category";
import { parseRankingsString } from "./rankings";
import { normalizeSlug } from "./slug";
import type { CcfddlConference, HfConference } from "./types";

const HF_TYPE_MAP: Record<string, MilestoneType> = {
  abstract: "abstract",
  paper: "fullPaper",
  submission: "fullPaper",
  supplementary: "supplementary",
  rebuttal_start: "rebuttalStart",
  rebuttal_end: "rebuttalEnd",
  notification: "notification",
  camera_ready: "cameraReady",
};

const PRIMARY_TYPES = new Set<MilestoneType>([
  "fullPaper",
  "rebuttalStart",
  "rebuttalEnd",
  "notification",
]);

function makeId(shortName: string, year: number): string {
  return `${shortName.toLowerCase().replace(/\s+/g, "-")}-${year}`;
}

function makeMilestone(
  confId: string,
  type: MilestoneType,
  label: string,
  dateStart: string,
  timezone: string,
): Milestone {
  return {
    id: `${confId}-${type}`,
    type,
    label,
    dateStart,
    timezone,
    importance: PRIMARY_TYPES.has(type) ? "primary" : "secondary",
  };
}

function hfToMilestones(confId: string, hf: HfConference): Milestone[] {
  const milestones: Milestone[] = [];

  for (const deadline of hf.deadlines) {
    const type = HF_TYPE_MAP[deadline.type];

    if (!type) {
      continue;
    }

    milestones.push(
      makeMilestone(confId, type, deadline.label, deadline.date, deadline.timezone),
    );
  }

  if (hf.conferenceStart) {
    milestones.push(
      makeMilestone(confId, "conferenceStart", "Conference starts", hf.conferenceStart, "Local"),
    );
  }

  if (hf.conferenceEnd) {
    milestones.push(
      makeMilestone(confId, "conferenceEnd", "Conference ends", hf.conferenceEnd, "Local"),
    );
  }

  return milestones;
}

function ccfddlToMilestones(confId: string, ccf: CcfddlConference): Milestone[] {
  const milestones: Milestone[] = [];

  if (ccf.abstractDeadline) {
    milestones.push(
      makeMilestone(confId, "abstract", "Abstract", ccf.abstractDeadline, ccf.timezone),
    );
  }

  if (ccf.submissionDeadline) {
    milestones.push(
      makeMilestone(confId, "fullPaper", "Full paper", ccf.submissionDeadline, ccf.timezone),
    );
  }

  return milestones;
}

function isValidCategory(sub: string): sub is ConferenceCategory {
  return ["AI", "CG", "CT", "DB", "DS", "HI", "MX", "NW", "SC", "SE"].includes(sub);
}

export function mergeSources(
  ccfddlEntries: CcfddlConference[],
  hfEntries: HfConference[],
): Conference[] {
  const hfBySlugYear = new Map<string, HfConference>();

  for (const hf of hfEntries) {
    const key = `${normalizeSlug(hf.shortName)}-${hf.year}`;
    hfBySlugYear.set(key, hf);
  }

  const result: Conference[] = [];
  const processedHfKeys = new Set<string>();

  for (const ccf of ccfddlEntries) {
    const key = `${normalizeSlug(ccf.shortName)}-${ccf.year}`;
    const hfMatch = hfBySlugYear.get(key);
    const confId = makeId(ccf.shortName, ccf.year);
    const category = isValidCategory(ccf.category) ? ccf.category : "AI";

    if (hfMatch) {
      processedHfKeys.add(key);
      result.push({
        id: confId,
        slug: confId,
        title: ccf.fullName,
        shortName: ccf.shortName,
        year: ccf.year,
        website: hfMatch.website || ccf.website,
        location: hfMatch.location || ccf.location,
        category,
        rankings: ccf.rank,
        milestones: hfToMilestones(confId, hfMatch),
      });
    } else {
      result.push({
        id: confId,
        slug: confId,
        title: ccf.fullName,
        shortName: ccf.shortName,
        year: ccf.year,
        website: ccf.website,
        location: ccf.location,
        category,
        rankings: ccf.rank,
        milestones: ccfddlToMilestones(confId, ccf),
      });
    }
  }

  for (const hf of hfEntries) {
    const key = `${normalizeSlug(hf.shortName)}-${hf.year}`;

    if (processedHfKeys.has(key)) {
      continue;
    }

    const confId = makeId(hf.shortName, hf.year);

    result.push({
      id: confId,
      slug: confId,
      title: hf.fullName,
      shortName: hf.shortName,
      year: hf.year,
      website: hf.website,
      location: hf.location,
      category: inferCategory(hf.tags),
      rankings: parseRankingsString(hf.rankingsStr),
      milestones: hfToMilestones(confId, hf),
    });
  }

  return result;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/data/merge-sources.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/data/merge-sources.ts src/lib/data/merge-sources.test.ts
git commit -m "feat: add dual-source merge into Conference[]"
```

---

### Task 8: Allow partial conferences in sections.ts

**Files:**
- Modify: `src/lib/timeline/sections.ts:73-78`
- Modify: `src/lib/timeline/sections.test.ts`

Currently `organizeConferenceSections` filters out conferences without a full primary path (fullPaper + rebuttalStart + notification). With 300+ conferences from ccfddl, many will only have submission deadlines. Remove this filter so all conferences with visible milestones appear.

- [ ] **Step 1: Update the test expectations**

In `src/lib/timeline/sections.test.ts`, NeurIPS has fullPaper + notification but no rebuttalStart. After removing the filter, it will appear in the active section. Update the test:

Replace the test body in `src/lib/timeline/sections.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { conferences } from "@/data/conferences";
import { organizeConferenceSections } from "./sections";

describe("organizeConferenceSections", () => {
  it("sorts by abstract-or-submission date and splits active from past", () => {
    const sections = organizeConferenceSections({
      conferences,
      query: "",
      categories: new Set(),
      visibleMilestoneTypes: new Set([
        "fullPaper",
        "rebuttalStart",
        "notification",
      ]),
      visibleRange: {
        start: new Date("2026-01-01T00:00:00Z"),
        end: new Date("2026-12-31T00:00:00Z"),
      },
      now: new Date("2026-03-26T00:00:00Z"),
    });

    expect(sections.active.map((conference) => conference.shortName)).toEqual([
      "ACL",
      "ICML",
      "KDD",
      "CoLM",
      "NeurIPS",
    ]);
    expect(sections.past.map((conference) => conference.shortName)).toEqual([
      "CHI",
      "ICLR",
      "SIGMOD",
      "ICDE",
      "CVPR",
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/timeline/sections.test.ts`
Expected: FAIL — NeurIPS is not in the active list yet

- [ ] **Step 3: Remove the hasRenderablePrimaryPath filter**

In `src/lib/timeline/sections.ts`, remove the `.filter(...)` call at lines 73-78. The function `organizeConferenceSections` should change from:

```typescript
  const visibleConferences = filterConferences({
    conferences,
    query,
    categories,
    visibleMilestoneTypes,
    visibleRange,
  })
    .filter((conference) => {
      const sourceConference = conferenceLookup.get(conference.id) ?? conference;
      return hasRenderablePrimaryPath(sourceConference);
    })
    .sort((left, right) => {
```

To:

```typescript
  const visibleConferences = filterConferences({
    conferences,
    query,
    categories,
    visibleMilestoneTypes,
    visibleRange,
  })
    .sort((left, right) => {
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/timeline/sections.test.ts`
Expected: PASS

- [ ] **Step 5: Run all tests to check nothing else broke**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/timeline/sections.ts src/lib/timeline/sections.test.ts
git commit -m "feat: allow partial conferences without full primary path"
```

---

### Task 9: Orchestrator, page.tsx integration, and fallback cache

**Files:**
- Create: `src/lib/data/get-conferences.ts`
- Create: `src/lib/data/get-conferences.test.ts`
- Create: `src/lib/data/cache.json`
- Create: `scripts/update-cache.ts`
- Modify: `app/page.tsx`

- [ ] **Step 1: Generate the initial cache.json from existing static data**

Create `src/lib/data/cache.json` by copying the existing conference data structure. This serves as the committed fallback. Run:

```bash
npx tsx -e "
  const { conferences } = require('./src/data/conferences');
  const fs = require('fs');
  fs.writeFileSync('./src/lib/data/cache.json', JSON.stringify(conferences, null, 2));
"
```

If that doesn't work due to ESM/import issues, manually create `src/lib/data/cache.json` as an empty array `[]` for now. We'll populate it properly after the full pipeline works.

- [ ] **Step 2: Write the failing test for get-conferences**

Create `src/lib/data/get-conferences.test.ts`:

```typescript
import { describe, expect, it, vi, beforeEach } from "vitest";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("getConferences", () => {
  it("returns merged conferences from both sources", async () => {
    vi.doMock("./fetch-ccfddl", () => ({
      fetchCcfddl: vi.fn().mockResolvedValue([
        {
          shortName: "AAAI",
          fullName: "AAAI Conference",
          category: "AI",
          rank: { ccf: "A" },
          year: 2026,
          id: "aaai26",
          website: "https://aaai.org",
          location: "Philadelphia",
          timezone: "AoE",
          abstractDeadline: null,
          submissionDeadline: "2025-08-01",
          conferenceDateStr: "Feb 20-27, 2026",
        },
      ]),
    }));
    vi.doMock("./fetch-hf", () => ({
      fetchHfDeadlines: vi.fn().mockResolvedValue([]),
    }));

    const { getConferences } = await import("./get-conferences");
    const result = await getConferences();

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].shortName).toBe("AAAI");
  });

  it("falls back to cache when both fetches fail", async () => {
    vi.doMock("./fetch-ccfddl", () => ({
      fetchCcfddl: vi.fn().mockResolvedValue([]),
    }));
    vi.doMock("./fetch-hf", () => ({
      fetchHfDeadlines: vi.fn().mockResolvedValue([]),
    }));

    const { getConferences } = await import("./get-conferences");
    const result = await getConferences();

    // Should return cache data (which may be empty array if cache.json is [])
    expect(Array.isArray(result)).toBe(true);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/lib/data/get-conferences.test.ts`
Expected: FAIL — module not found

- [ ] **Step 4: Write the orchestrator**

Create `src/lib/data/get-conferences.ts`:

```typescript
import type { Conference } from "@/types/conference";
import { fetchCcfddl } from "./fetch-ccfddl";
import { fetchHfDeadlines } from "./fetch-hf";
import { mergeSources } from "./merge-sources";
import cachedConferences from "./cache.json";

export async function getConferences(): Promise<Conference[]> {
  try {
    const [ccfddlEntries, hfEntries] = await Promise.all([
      fetchCcfddl(),
      fetchHfDeadlines(),
    ]);

    const merged = mergeSources(ccfddlEntries, hfEntries);

    if (merged.length > 0) {
      return merged;
    }
  } catch {
    // Fall through to cache
  }

  return cachedConferences as Conference[];
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/lib/data/get-conferences.test.ts`
Expected: PASS

- [ ] **Step 6: Wire up page.tsx with ISR**

Replace `app/page.tsx` with:

```typescript
import { TimelineBrowser } from "@/components/timeline/timeline-browser";
import { getConferences } from "@/lib/data/get-conferences";

export const revalidate = 86400;

export default async function Home() {
  const conferences = await getConferences();

  return <TimelineBrowser conferences={conferences} now={new Date()} />;
}
```

- [ ] **Step 7: Create the cache update script**

Create `scripts/update-cache.ts`:

```typescript
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fetchCcfddl } from "../src/lib/data/fetch-ccfddl";
import { fetchHfDeadlines } from "../src/lib/data/fetch-hf";
import { mergeSources } from "../src/lib/data/merge-sources";

async function main() {
  console.log("Fetching ccfddl...");
  const ccfddl = await fetchCcfddl();
  console.log(`  → ${ccfddl.length} entries`);

  console.log("Fetching HF deadlines...");
  const hf = await fetchHfDeadlines();
  console.log(`  → ${hf.length} entries`);

  const merged = mergeSources(ccfddl, hf);
  console.log(`Merged: ${merged.length} conferences`);

  const outPath = resolve(__dirname, "../src/lib/data/cache.json");
  writeFileSync(outPath, JSON.stringify(merged, null, 2));
  console.log(`Cache written to ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

- [ ] **Step 8: Run all tests**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 9: Commit**

```bash
git add src/lib/data/get-conferences.ts src/lib/data/get-conferences.test.ts src/lib/data/cache.json scripts/update-cache.ts app/page.tsx
git commit -m "feat: wire up dual-source data pipeline with ISR and fallback cache"
```

---

## Workstream B: UI/UX Aesthetic Overhaul

### Task 10: Font swap to Geist

**Files:**
- Modify: `package.json`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Install geist font package**

Run: `npm install geist`

- [ ] **Step 2: Swap font in layout.tsx**

Replace `app/layout.tsx` with:

```typescript
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "Conference Timeline",
  description:
    "Compare academic conference deadlines, rebuttal windows, and notification dates across venues.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${GeistSans.variable} ${GeistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Verify the dev server starts**

Run: `npm run dev` and check localhost:3000 loads without errors.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx package.json package-lock.json
git commit -m "feat: swap to Geist Sans + Geist Mono fonts"
```

---

### Task 11: Color system and CSS overhaul

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Replace globals.css with the new color system**

Replace `app/globals.css` with:

```css
@import "tailwindcss";

:root {
  --page-bg: #fafafa;
  --surface-bg: rgba(255, 255, 255, 0.8);
  --surface-elevated: rgba(255, 255, 255, 0.95);
  --controls-bg: #fafafa;
  --input-bg: rgba(255, 255, 255, 0.6);
  --tooltip-bg: rgba(255, 255, 255, 0.92);
  --panel-border: rgba(0, 0, 0, 0.08);
  --chip-bg: rgba(0, 0, 0, 0.03);
  --chip-active-bg: rgba(0, 0, 0, 0.06);
  --chip-border: rgba(0, 0, 0, 0.08);
  --text-primary: #171717;
  --text-muted: #737373;
  --accent-primary: #171717;
  --accent-secondary: #3b82f6;
  --accent-warm: #d97706;
  --accent-danger: #b42318;
  --timeline-neutral: #a3a3a3;
  --timeline-neutral-soft: rgba(163, 163, 163, 0.3);
  --timeline-full-paper: #16a34a;
  --timeline-notification: #dc2626;
  --timeline-rebuttal: #d97706;
  --timeline-rebuttal-soft: rgba(217, 119, 6, 0.5);
  --timeline-conference: #3b82f6;
  --timeline-conference-soft: rgba(59, 130, 246, 0.5);
  --path-baseline: rgba(0, 0, 0, 0.06);
  --path-track: rgba(0, 0, 0, 0.1);
  --grid-line: rgba(0, 0, 0, 0.03);
  --grid-glow: rgba(0, 0, 0, 0.06);
}

[data-theme="dark"] {
  --page-bg: #0a0a0a;
  --surface-bg: rgba(20, 20, 20, 0.88);
  --surface-elevated: rgba(26, 26, 26, 0.95);
  --controls-bg: #0a0a0a;
  --input-bg: rgba(26, 26, 26, 0.84);
  --tooltip-bg: rgba(20, 20, 20, 0.92);
  --panel-border: rgba(255, 255, 255, 0.08);
  --chip-bg: rgba(255, 255, 255, 0.04);
  --chip-active-bg: rgba(255, 255, 255, 0.08);
  --chip-border: rgba(255, 255, 255, 0.08);
  --text-primary: #ededed;
  --text-muted: #a3a3a3;
  --accent-primary: #ededed;
  --accent-secondary: #60a5fa;
  --accent-warm: #f59e0b;
  --accent-danger: #f87171;
  --timeline-neutral: #a3a3a3;
  --timeline-neutral-soft: rgba(163, 163, 163, 0.3);
  --timeline-full-paper: #34d399;
  --timeline-notification: #f87171;
  --timeline-rebuttal: #fbbf24;
  --timeline-rebuttal-soft: rgba(251, 191, 36, 0.5);
  --timeline-conference: #60a5fa;
  --timeline-conference-soft: rgba(96, 165, 250, 0.5);
  --path-baseline: rgba(255, 255, 255, 0.06);
  --path-track: rgba(255, 255, 255, 0.1);
  --grid-line: rgba(255, 255, 255, 0.03);
  --grid-glow: rgba(255, 255, 255, 0.06);
}

html {
  background: var(--page-bg);
}

body {
  min-height: 100vh;
  background: var(--page-bg);
  color: var(--text-primary);
  font-family:
    var(--font-geist-sans),
    -apple-system,
    "Segoe UI",
    sans-serif;
}

.font-mono {
  font-family:
    var(--font-geist-mono),
    "SF Mono",
    "Fira Code",
    monospace;
}

.timeline-shell {
  background: var(--surface-bg);
  box-shadow: 0 0 0 1px var(--panel-border);
}

.timeline-meta-head,
.timeline-meta-cell {
  background: color-mix(in srgb, var(--surface-bg) 96%, transparent);
}

.timeline-axis,
.timeline-row {
  position: relative;
  background: color-mix(in srgb, var(--surface-bg) 80%, transparent);
}

.timeline-axis {
  min-height: 68px;
}

.timeline-axis-track {
  position: relative;
  min-height: 44px;
}

.timeline-axis-tick {
  position: absolute;
  top: 0;
  bottom: 0;
}

.timeline-axis-label {
  position: absolute;
  top: 24px;
  left: 0;
  width: max-content;
  transform: translateX(-50%);
  letter-spacing: 0.06em;
  white-space: nowrap;
}

.timeline-today-label {
  position: absolute;
  top: 6px;
  z-index: 1;
  border: 1px solid color-mix(in srgb, var(--accent-secondary) 20%, transparent);
  border-radius: 4px;
  background: var(--surface-elevated);
  padding: 1px 6px;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--accent-secondary);
  white-space: nowrap;
  transform: translateX(6px);
}

.timeline-row {
  height: 72px;
}

.timeline-row-grid {
  background-image: linear-gradient(
    90deg,
    transparent 0,
    transparent calc(10% - 1px),
    var(--grid-line) calc(10% - 1px),
    var(--grid-line) 10%
  );
  background-size: 10% 100%;
}

.timeline-marker {
  cursor: pointer;
  transition:
    transform 120ms cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 120ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.timeline-marker:hover,
.timeline-marker:focus-visible {
  transform: translateX(-50%) scale(1.15);
  box-shadow: 0 0 0 3px var(--grid-glow);
}

.conference-trigger {
  transition: color 120ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.conference-trigger-title,
.conference-trigger-year {
  transition: color 120ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.conference-trigger:hover .conference-trigger-title,
.conference-trigger:focus-visible .conference-trigger-title {
  color: var(--text-primary);
}

.conference-trigger:hover .conference-trigger-year,
.conference-trigger:focus-visible .conference-trigger-year {
  color: var(--text-primary);
}

.conference-detail-card {
  transform: translateY(-50%);
  transform-origin: left center;
  animation: conference-card-enter 120ms cubic-bezier(0.2, 0.8, 0.2, 1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

@keyframes conference-card-enter {
  from {
    opacity: 0;
    transform: translate(0, calc(-50% + 4px));
  }
  to {
    opacity: 1;
    transform: translate(0, -50%);
  }
}

@media (max-width: 900px) {
  .timeline-row {
    height: 72px;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 2: Verify visually**

Run: `npm run dev` and check both light and dark modes render with cool neutral palette.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat: overhaul color system to Linear/Vercel aesthetic"
```

---

### Task 12: Controls bar refinement

**Files:**
- Modify: `src/components/timeline/controls-bar.tsx`
- Modify: `src/components/timeline/timeline-browser.tsx`

- [ ] **Step 1: Rewrite controls-bar.tsx with refined controls**

Replace `src/components/timeline/controls-bar.tsx` with:

```typescript
import { useEffect, useRef, useState } from "react";
import type {
  ConferenceCategory,
  MilestoneType,
} from "@/types/conference";

interface ControlsBarProps {
  query: string;
  onQueryChange: (value: string) => void;
  availableCategories: ConferenceCategory[];
  categories: Set<ConferenceCategory>;
  onCategoryToggle: (value: ConferenceCategory) => void;
  availableMilestoneTypes: MilestoneType[];
  visibleMilestoneTypes: Set<MilestoneType>;
  onMilestoneToggle: (value: MilestoneType) => void;
  onPresetSelect: (preset: "3M" | "6M" | "12M" | "All") => void;
  theme: "light" | "dark";
  onThemeToggle: () => void;
}

const PRESETS = ["3M", "6M", "12M", "All"] as const;

const CATEGORY_LABELS: Record<ConferenceCategory, string> = {
  AI: "AI / ML",
  CG: "Graphics",
  CT: "Theory",
  DB: "Databases",
  DS: "Data Mining",
  HI: "HCI",
  MX: "Vision",
  NW: "Networks",
  SC: "Security",
  SE: "Software",
};

const MILESTONE_LABELS: Record<MilestoneType, string> = {
  abstract: "Abstract",
  fullPaper: "Full paper",
  supplementary: "Supplementary",
  rebuttalStart: "Rebuttal start",
  rebuttalEnd: "Rebuttal end",
  notification: "Notification",
  cameraReady: "Camera ready",
  conferenceStart: "Conference start",
  conferenceEnd: "Conference end",
  workshop: "Workshop",
};

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="8" r="3" />
      <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.17 3.17l1.06 1.06M11.77 11.77l1.06 1.06M3.17 12.83l1.06-1.06M11.77 4.23l1.06-1.06" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M13.5 8.5a5.5 5.5 0 1 1-7-7 4.5 4.5 0 0 0 7 7z" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M1.5 3.5h11M3.5 7h7M5.5 10.5h3" />
    </svg>
  );
}

export function ControlsBar({
  query,
  onQueryChange,
  availableCategories,
  categories,
  onCategoryToggle,
  availableMilestoneTypes,
  visibleMilestoneTypes,
  onMilestoneToggle,
  onPresetSelect,
  theme,
  onThemeToggle,
}: ControlsBarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setFiltersOpen(false);
      }
    }

    if (filtersOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [filtersOpen]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const activeFilterCount = availableMilestoneTypes.filter(
    (type) => !visibleMilestoneTypes.has(type),
  ).length;

  return (
    <div className="sticky top-0 z-20 border-b border-[var(--panel-border)] bg-[var(--controls-bg)] px-4 py-3 md:px-6">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <div className="relative min-w-48 flex-1">
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search conferences..."
              className="h-10 w-full rounded-lg border border-[var(--panel-border)] bg-[var(--input-bg)] px-3.5 pr-14 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)]"
            />
            <kbd className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded border border-[var(--panel-border)] bg-[var(--chip-bg)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)]">
              ⌘K
            </kbd>
          </div>
          <div
            className="flex items-center overflow-hidden rounded-lg border border-[var(--panel-border)]"
            role="group"
            aria-label="Range presets"
          >
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onPresetSelect(preset)}
                className="cursor-pointer border-r border-[var(--panel-border)] bg-[var(--chip-bg)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] transition last:border-r-0 hover:bg-[var(--chip-active-bg)] hover:text-[var(--text-primary)]"
              >
                {preset}
              </button>
            ))}
          </div>
          <div className="relative" ref={popoverRef}>
            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              className="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--panel-border)] bg-[var(--chip-bg)] px-2.5 text-xs font-medium text-[var(--text-muted)] transition hover:border-[var(--accent-primary)] hover:text-[var(--text-primary)]"
            >
              <FilterIcon />
              Filters
              {activeFilterCount > 0 ? (
                <span className="ml-0.5 rounded-full bg-[var(--accent-primary)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--page-bg)]">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>
            {filtersOpen ? (
              <div className="absolute top-full right-0 z-30 mt-1.5 w-64 rounded-xl border border-[var(--panel-border)] bg-[var(--tooltip-bg)] p-3 shadow-lg backdrop-blur-xl">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  Milestone types
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {availableMilestoneTypes.map((milestoneType) => {
                    const isActive = visibleMilestoneTypes.has(milestoneType);

                    return (
                      <button
                        key={milestoneType}
                        type="button"
                        onClick={() => onMilestoneToggle(milestoneType)}
                        aria-pressed={isActive}
                        className={`cursor-pointer rounded-md px-2 py-1 text-xs font-medium transition ${
                          isActive
                            ? "bg-[var(--chip-active-bg)] text-[var(--text-primary)]"
                            : "text-[var(--text-muted)] hover:bg-[var(--chip-bg)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        {MILESTONE_LABELS[milestoneType]}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onThemeToggle}
            aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[var(--panel-border)] bg-[var(--chip-bg)] text-[var(--text-muted)] transition hover:border-[var(--accent-primary)] hover:text-[var(--text-primary)]"
          >
            {theme === "light" ? <MoonIcon /> : <SunIcon />}
          </button>
        </div>
        {availableCategories.length > 0 ? (
          <div
            className="flex flex-wrap items-center gap-1.5"
            role="group"
            aria-label="Category filters"
          >
            {availableCategories.map((category) => {
              const isActive = categories.has(category);

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => onCategoryToggle(category)}
                  aria-pressed={isActive}
                  className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition ${
                    isActive
                      ? "bg-[var(--accent-primary)] text-[var(--page-bg)]"
                      : "border border-[var(--panel-border)] bg-[var(--chip-bg)] text-[var(--text-muted)] hover:border-[var(--accent-primary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {CATEGORY_LABELS[category]}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run existing controls-bar tests**

Run: `npx vitest run src/components/timeline/controls-bar.test.tsx`

If tests fail due to changed markup, update the test selectors to match the new DOM structure. The key behaviors (search input, category toggle, preset buttons, theme toggle) are all still present.

- [ ] **Step 3: Commit**

```bash
git add src/components/timeline/controls-bar.tsx
git commit -m "feat: refine controls bar with segmented presets, filter popover, icon theme toggle"
```

---

### Task 13: Timeline grid, tooltip, and conference meta refinements

**Files:**
- Modify: `src/components/timeline/timeline-grid.tsx`
- Modify: `src/components/timeline/milestone-tooltip.tsx`
- Modify: `src/components/timeline/conference-meta-column.tsx`

- [ ] **Step 1: Update conference-meta-column.tsx**

Replace `src/components/timeline/conference-meta-column.tsx` with:

```typescript
import type { Conference } from "@/types/conference";

interface ConferenceMetaColumnProps {
  conference: Conference;
  compact?: boolean;
}

export function ConferenceMetaColumn({
  conference,
  compact = false,
}: ConferenceMetaColumnProps) {
  const rankingEntries = Object.entries(conference.rankings).filter(
    ([, value]) => value,
  );

  if (compact) {
    return (
      <div className="min-w-0">
        <span className="conference-trigger-title text-[11px] font-medium tracking-[0.02em] text-[var(--text-primary)]">
          {conference.shortName}
        </span>
        <span className="conference-trigger-year ml-1 text-[10px] text-[var(--text-muted)]">
          {conference.year}
        </span>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <a
        href={conference.website}
        target="_blank"
        rel="noreferrer noopener"
        className="cursor-pointer text-sm font-medium tracking-tight text-[var(--text-primary)] transition hover:text-[var(--text-muted)]"
      >
        {conference.shortName}
      </a>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        {conference.title}
      </p>
      {rankingEntries.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {rankingEntries.map(([key, value]) => (
            <span
              key={key}
              className="rounded border border-[var(--panel-border)] bg-[var(--chip-bg)] px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase text-[var(--text-muted)]"
            >
              {key} {value}
            </span>
          ))}
        </div>
      ) : null}
      <p className="mt-2 text-xs text-[var(--text-muted)]">
        {conference.location}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Update milestone-tooltip.tsx with backdrop blur and countdown**

Replace `src/components/timeline/milestone-tooltip.tsx` with:

```typescript
import { format, formatDistanceToNow, parseISO } from "date-fns";
import type { Conference, Milestone } from "@/types/conference";

interface MilestoneTooltipProps {
  conference: Conference;
  milestone: Milestone;
  left: number;
}

function formatDateLabel(milestone: Milestone) {
  const start = format(parseISO(milestone.dateStart), "MMM d, yyyy");

  if (!milestone.dateEnd) {
    return start;
  }

  const end = format(parseISO(milestone.dateEnd), "MMM d, yyyy");
  return `${start} – ${end}`;
}

function getCountdown(dateStr: string): string {
  const date = parseISO(dateStr);
  return formatDistanceToNow(date, { addSuffix: true });
}

export function MilestoneTooltip({
  conference,
  milestone,
  left,
}: MilestoneTooltipProps) {
  return (
    <div
      data-testid="milestone-tooltip"
      className="pointer-events-none absolute top-0 left-0 z-20 -translate-x-1/2 -translate-y-[calc(100%+10px)] rounded-lg border border-[var(--panel-border)] bg-[var(--tooltip-bg)] px-3.5 py-2.5 text-left shadow-md backdrop-blur-xl"
      style={{ left: `${left}%`, minWidth: "18rem" }}
      role="tooltip"
      aria-live="polite"
    >
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
        {conference.shortName}
      </p>
      <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
        {milestone.label}
      </p>
      <div className="mt-1 flex items-center gap-2">
        <span className="font-mono text-xs text-[var(--text-muted)]">
          {formatDateLabel(milestone)}
        </span>
        <span className="rounded border border-[var(--panel-border)] bg-[var(--chip-bg)] px-1 py-0.5 text-[9px] font-medium text-[var(--text-muted)]">
          {milestone.timezone}
        </span>
      </div>
      <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
        {getCountdown(milestone.dateStart)}
      </p>
      {milestone.note ? (
        <p className="mt-1 max-w-64 text-[11px] leading-4 text-[var(--text-muted)]">
          {milestone.note}
        </p>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 3: Update timeline-grid.tsx with refined markers and layout**

In `src/components/timeline/timeline-grid.tsx`, make these changes:

**3a.** Update the axis label to use Geist Mono. Change line 183:

From:
```typescript
                  <div className="timeline-axis-label text-[13px] font-medium text-[var(--text-muted)]">
```
To:
```typescript
                  <div className="timeline-axis-label font-mono text-[11px] font-medium text-[var(--text-muted)]">
```

**3b.** Update the venue column header. Change line 169:

From:
```typescript
        <div className="timeline-meta-head border-b border-[var(--panel-border)] px-4 py-3 text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--text-muted)]">
```
To:
```typescript
        <div className="timeline-meta-head border-b border-[var(--panel-border)] px-4 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
```

**3c.** Update the primary path track thickness. Change line 252:

From:
```typescript
                          className="absolute top-[28px] h-[8px] rounded-full bg-[var(--path-track)]"
```
To:
```typescript
                          className="absolute top-[30px] h-[4px] rounded-full bg-[var(--path-track)]"
```

**3d.** Update the range segment height. Change line 286:

From:
```typescript
                            className={`absolute top-[28px] h-[8px] rounded-full ${getToneClass(segment.tone, "range")}`}
```
To:
```typescript
                            className={`absolute top-[30px] h-[4px] rounded-full ${getToneClass(segment.tone, "range")}`}
```

**3e.** Update the baseline. Change line 245:

From:
```typescript
                      <div className="absolute top-[31px] left-0 right-0 h-[2px] bg-[var(--path-baseline)]" />
```
To:
```typescript
                      <div className="absolute top-[31px] left-0 right-0 h-px bg-[var(--path-baseline)]" />
```

**3f.** Update primary milestone marker size. Change the marker class (line 328-333):

From:
```typescript
                            className={`timeline-marker absolute -translate-x-1/2 rounded-full border border-[var(--panel-border)] bg-[var(--surface-bg)] ${
                              isPrimaryPath
                                ? "top-[20px] h-6 w-6"
                                : "top-[24px] h-4 w-4 opacity-70"
                            }`}
```
To:
```typescript
                            className={`timeline-marker absolute rounded-full border border-[var(--panel-border)] bg-[var(--surface-bg)] ${
                              isPrimaryPath
                                ? "top-[22px] h-5 w-5 -translate-x-1/2"
                                : "top-[25px] h-3.5 w-3.5 -translate-x-1/2 opacity-50"
                            }`}
```

**3g.** Update inner dot size. Change the inner span (line 336-338):

From:
```typescript
                            <span
                              className={`absolute rounded-full ${getToneClass(tone, "marker")} ${
                                isPrimaryPath ? "inset-[4px]" : "inset-[3px]"
                              }`}
                            />
```
To:
```typescript
                            <span
                              className={`absolute rounded-full ${getToneClass(tone, "marker")} ${
                                isPrimaryPath ? "inset-[3px]" : "inset-[2px]"
                              }`}
                            />
```

**3h.** Update the today line to be dashed. Change line 362:

From:
```typescript
              className="absolute inset-y-0 w-px bg-[var(--accent-secondary)]/70"
```
To:
```typescript
              className="absolute inset-y-0 w-px"
              style={{
                backgroundImage: `repeating-linear-gradient(to bottom, var(--accent-secondary) 0, var(--accent-secondary) 4px, transparent 4px, transparent 8px)`,
                opacity: 0.5,
              }}
```

**3i.** Update the conference detail card. Change line 237-238:

From:
```typescript
                          className="conference-detail-card absolute top-1/2 left-3 z-30 w-80 rounded-xl border border-[var(--panel-border)] bg-[var(--tooltip-bg)] p-4 shadow-lg"
```
To:
```typescript
                          className="conference-detail-card absolute top-1/2 left-3 z-30 w-72 rounded-lg border border-[var(--panel-border)] bg-[var(--tooltip-bg)] p-3.5 shadow-md backdrop-blur-xl"
```

- [ ] **Step 4: Run all component tests**

Run: `npx vitest run src/components/`
Expected: PASS (or update selectors if needed due to class name changes)

- [ ] **Step 5: Commit**

```bash
git add src/components/timeline/timeline-grid.tsx src/components/timeline/milestone-tooltip.tsx src/components/timeline/conference-meta-column.tsx
git commit -m "feat: refine timeline grid, tooltip, and meta column for Linear aesthetic"
```

---

### Task 14: Header typography and empty state

**Files:**
- Modify: `src/components/timeline/timeline-browser.tsx`

- [ ] **Step 1: Update header and empty state in timeline-browser.tsx**

In `src/components/timeline/timeline-browser.tsx`, update the header section (lines 155-185) and empty state (lines 199-214).

Replace the `<section>` block (lines 155-215) with:

```typescript
      <section className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
        <div className="mb-5">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--text-muted)]">
            {visibleConferenceCount} venue{visibleConferenceCount !== 1 ? "s" : ""}
            {" · "}
            {format(visibleRange.start, "MMM yyyy")}
            {" – "}
            {format(visibleRange.end, "MMM yyyy")}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em] md:text-3xl">
            Conference Timeline
          </h1>
          <p className="mt-1 max-w-xl text-xs leading-5 text-[var(--text-muted)]">
            Deadlines, rebuttals, and decisions at a glance.
          </p>
          <div
            data-testid="timeline-legend"
            className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[var(--text-muted)]"
          >
            {LEGEND_ITEMS.map((item) => (
              <span key={item.label} className="flex items-center gap-1.5">
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: `var(${item.variable})` }}
                />
                {item.label}
              </span>
            ))}
          </div>
        </div>
        <div
          data-testid="timeline-surface"
          className="timeline-shell overflow-x-auto rounded-xl border border-[var(--panel-border)]"
        >
          <TimelineGrid
            sections={[
              { id: "active", label: "Active", conferences: sections.active },
              { id: "past", label: "Past", conferences: sections.past },
            ]}
            visibleRange={visibleRange}
            now={now}
          />
        </div>
        {visibleConferenceCount === 0 ? (
          <div className="mt-6 flex flex-col items-center py-12">
            <div className="mb-4 flex flex-col items-center gap-1.5 text-[var(--text-muted)] opacity-30">
              <div className="h-px w-32 bg-current" />
              <div className="h-px w-24 bg-current" />
              <div className="h-px w-16 bg-current" />
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              No conferences match the current filters.
            </p>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearAllFilters}
                className="mt-3 cursor-pointer rounded-lg border border-[var(--panel-border)] bg-[var(--chip-bg)] px-4 py-1.5 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--accent-primary)]"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        ) : null}
      </section>
```

- [ ] **Step 2: Run all tests**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 3: Verify visually**

Run: `npm run dev` and check:
- Header typography (2xl semibold, tight tracking)
- Stats line in mono font
- Legend dots smaller
- Empty state with geometric lines and ghost button
- Timeline surface border radius (rounded-xl)

- [ ] **Step 4: Commit**

```bash
git add src/components/timeline/timeline-browser.tsx
git commit -m "feat: refine header typography and empty state"
```

- [ ] **Step 5: Run build to verify everything compiles**

Run: `npm run build`
Expected: Build completes without errors.

- [ ] **Step 6: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: resolve build issues"
```
