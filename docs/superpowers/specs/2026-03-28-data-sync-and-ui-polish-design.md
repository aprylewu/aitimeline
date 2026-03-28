# Conference Data Sync + UI/UX Polish — Design Spec

## Goal

Transform the timeline browser from a 10-conference static demo into a 300+ conference production tool by auto-syncing data from two open-source sources, while overhauling the visual design toward a Linear/Vercel aesthetic — cool, monochrome-forward, extremely elegant.

## Scope

Two workstreams that share no code dependencies and can be built independently:

1. **Data sync pipeline** — build-time fetch + merge from ccfddl and huggingface/ai-deadlines
2. **UI/UX aesthetic overhaul** — color system, typography, controls, timeline grid refinements

---

## 1. Data Sync Pipeline

### Sources

| Source | Repo | Coverage | Milestone depth | Categories | Rankings |
|--------|------|----------|----------------|------------|----------|
| ccfddl | `ccfddl/ccf-deadlines` | 339 conferences, all 10 CS categories | Submission deadline only (`abstract_deadline`, `deadline`) | Structured `sub` field (AI, CG, CT, DB, DS, HI, MX, NW, SC, SE) | Structured `rank.ccf`, `rank.core`, `rank.thcpl` |
| HF AI Deadlines | `huggingface/ai-deadlines` | ~63 conferences, AI/ML-focused | Full chain: abstract, paper, supplementary, rebuttal_start, rebuttal_end, notification, camera_ready | Tags array (unstructured) | Free-form string `"CCF: A, CORE: A*"` |

### Merge strategy

1. Fetch all YAML files from both repos via GitHub raw content URLs (enumerate via Trees API).
2. Normalize slugs: lowercase, strip year suffix, collapse hyphens (e.g., `aaai26` → `aaai`, `icml-2026` → `icml`).
3. For each ccfddl conference entry:
   - Look for a matching HF entry by normalized slug + year.
   - If matched: use HF milestones (richer) + ccfddl category/rankings (structured).
   - If unmatched: use ccfddl submission deadline + conference date range only.
4. For HF entries with no ccfddl match: include them, derive category from tags if possible, parse rankings string into structured object.
5. Output: `Conference[]` matching the existing type contract exactly.

### Milestone type mapping

| HF deadline `type` | App `MilestoneType` |
|---------------------|---------------------|
| `abstract` | `abstract` |
| `paper` / `submission` | `fullPaper` |
| `supplementary` | `supplementary` |
| `rebuttal_start` | `rebuttalStart` |
| `rebuttal_end` | `rebuttalEnd` |
| `notification` | `notification` |
| `camera_ready` | `cameraReady` |
| `review_release` | Ignore (no equivalent) |
| `commitment` | Ignore |

Conference start/end dates from both sources map to `conferenceStart` / `conferenceEnd` milestones.

### Category inference for HF-only entries

Map HF `tags` to `ConferenceCategory`:

| Tags containing | Category |
|-----------------|----------|
| `machine-learning`, `deep-learning` | `AI` |
| `computer-vision` | `MX` |
| `natural-language-processing`, `speech` | `AI` |
| `data-mining`, `information-retrieval` | `DS` |
| `computer-graphics`, `visualization` | `CG` |
| `human-computer-interaction` | `HI` |
| `databases` | `DB` |
| `security`, `cryptography` | `SC` |
| `networking`, `distributed-systems` | `NW` |
| `software-engineering`, `programming-languages` | `SE` |
| `theory`, `algorithms` | `CT` |
| (no match) | `AI` (default, since HF is AI-focused) |

### Rankings string parsing for HF-only entries

Parse `"CCF: A, CORE: A*, THCPL: A"` with a simple regex into `{ ccf: "A", core: "A*", thcpl: "A" }`.

### Build-time execution

```
app/page.tsx (server component)
  → getConferences() from src/lib/data/get-conferences.ts
    → fetchCcfddl() + fetchHfDeadlines() in parallel
    → mergeSources(ccfddl, hf)
    → on failure: read src/lib/data/cache.json
    → return Conference[]
```

ISR revalidation: `export const revalidate = 86400` (24 hours).

### Fallback cache

- `src/lib/data/cache.json` — committed snapshot of the merged Conference array.
- `scripts/update-cache.ts` — CLI script to regenerate the cache. Run manually or in CI before deploy.
- The cache ensures the app builds and renders even when GitHub is down or rate-limited.

### New files

| File | Responsibility |
|------|---------------|
| `src/lib/data/fetch-ccfddl.ts` | Fetch + parse all ccfddl YAML files into intermediate type |
| `src/lib/data/fetch-hf.ts` | Fetch + parse all HF YAML files into intermediate type |
| `src/lib/data/merge-sources.ts` | Slug matching, milestone merging, type normalization |
| `src/lib/data/get-conferences.ts` | Orchestrator: parallel fetch, merge, fallback |
| `src/lib/data/slug.ts` | Slug normalization utility |
| `src/lib/data/types.ts` | Intermediate types for raw source data |
| `src/lib/data/cache.json` | Committed fallback snapshot |
| `scripts/update-cache.ts` | Cache regeneration script |

### Modified files

| File | Change |
|------|--------|
| `app/page.tsx` | Replace static `conferences` import with `await getConferences()` |
| `next.config.ts` | (If needed) Allow GitHub raw content domain for fetch |
| `package.json` | Add `js-yaml` + `@types/js-yaml` |

### What does NOT change

- `src/types/conference.ts` — the output type contract stays identical.
- All pure utility functions in `src/lib/timeline/` — they consume `Conference[]` and are unaffected.
- All existing component logic — `TimelineBrowser` receives `Conference[]` props as before.

---

## 2. UI/UX Aesthetic Overhaul

### Design direction

Linear/Vercel: monochrome-forward, developer-tool feel. Cool neutrals, sharp geometry, subtle borders, minimal shadows. The interface should feel like a precision instrument.

### Color system

**Light theme:**

| Variable | Current | New |
|----------|---------|-----|
| `--page-bg` | `#f6f3ed` (warm cream) | `#fafafa` (cool neutral) |
| `--surface-bg` | `rgba(255, 252, 247, 0.88)` | `rgba(255, 255, 255, 0.8)` |
| `--surface-elevated` | `rgba(255, 255, 255, 0.92)` | `rgba(255, 255, 255, 0.95)` |
| `--controls-bg` | `#f6f3ed` | `#fafafa` |
| `--input-bg` | `rgba(255, 255, 255, 0.72)` | `rgba(255, 255, 255, 0.6)` |
| `--panel-border` | `rgba(15, 23, 42, 0.1)` | `rgba(0, 0, 0, 0.08)` |
| `--text-primary` | `#172033` | `#171717` |
| `--text-muted` | `#66758a` | `#737373` |
| `--accent-primary` | `#0f766e` (teal) | `#171717` (monochrome, used for active states) |

**Dark theme:**

| Variable | Current | New |
|----------|---------|-----|
| `--page-bg` | `#070b14` | `#0a0a0a` |
| `--surface-bg` | `rgba(12, 18, 31, 0.88)` | `rgba(20, 20, 20, 0.88)` |
| `--controls-bg` | `#0a0f1a` | `#0a0a0a` |
| `--panel-border` | `rgba(148, 163, 184, 0.18)` | `rgba(255, 255, 255, 0.08)` |
| `--text-primary` | `#ebf1fb` | `#ededed` |
| `--text-muted` | `#94a3b8` | `#a3a3a3` |
| `--accent-primary` | `#2dd4bf` (cyan) | `#ededed` (monochrome) |

**Timeline semantic colors stay** (green/orange/red/blue for submission/rebuttal/notification/conference) but desaturated ~15% in light mode for a more muted palette.

### Typography

| Element | Current | New |
|---------|---------|-----|
| Body font | Atkinson Hyperlegible | Geist Sans |
| Monospace (dates, axis) | (none) | Geist Mono |
| Page title | 3xl/4xl bold | 2xl semibold, tighter tracking (-0.02em) |
| Subtitle | sm, text-muted | xs, text-muted, uppercase tracking |
| Axis labels | 13px medium | 11px Geist Mono, medium |
| Venue column header | 11px bold uppercase | 10px Geist Mono, medium uppercase |

### Controls bar

| Element | Current | New |
|---------|---------|-----|
| Search input | Standard input with border | Taller (40px), `⌘K` ghost badge on right, rounded-lg |
| Category chips | Separate rounded-md buttons | Compact pills, 1px border, muted fill on active (not full accent color) |
| Milestone toggles | Inline chip row always visible | Collapsed behind a "Filters" button that reveals a popover (positioned below, dismissed on click-outside). Reduces visual noise. |
| Range presets | Separate buttons | Segmented control (connected, shared border, single rounded container) |
| Theme toggle | Text button ("Dark mode") | Icon-only button (sun/moon SVG), 32px square |
| Layout | Two rows stacked | Single row: search | presets | filters-button | theme-toggle. Category chips on second row only. |

### Timeline grid

| Element | Current | New |
|---------|---------|-----|
| Row height | 64px | 72px (more breathing room at scale) |
| Grid lines | `rgba(148, 163, 184, 0.14)` | `rgba(0, 0, 0, 0.03)` in light, `rgba(255, 255, 255, 0.03)` in dark |
| Section headers | Uppercase label + divider | Micro-label (10px) with faint rule, less visual weight |
| Primary path track | 8px rounded | 4px rounded, more transparent |
| Milestone markers (primary) | 24px circle-in-circle | 20px, thinner border, on hover: `scale(1.15)` + faint colored ring glow |
| Milestone markers (secondary) | 16px, 70% opacity | 14px, 50% opacity |
| Today line | Solid 1px blue | Dashed 1px, muted blue, smaller floating badge |
| Conference name | Bold text + year | Medium weight, year as muted suffix |
| Conference detail card | Positioned div with shadow | Backdrop-blur, 1px border, micro shadow, 100ms fade+translateY(2px) |

### Tooltip

- Backdrop blur (`backdrop-filter: blur(12px)`)
- 1px border in `--panel-border`
- Content: milestone label, date in Geist Mono, relative countdown ("in 14 days" / "3 days ago"), timezone badge
- Enter: 100ms `opacity 0→1` + `translateY(4px→0)`

### Empty state

Centered in the grid area. Subtle geometric line illustration (a few horizontal lines suggesting an empty timeline). "No conferences match" in muted text. "Clear filters" as a ghost button with 1px border.

### Motion

- All transitions: 120-160ms, `cubic-bezier(0.2, 0.8, 0.2, 1)`
- Hover effects: opacity + subtle scale, no color flash
- Card enter: `opacity 0→1` + `translateY(4px→0)` over 120ms
- `prefers-reduced-motion: reduce` removes all motion

### Responsive

- Below 900px: meta column shrinks to 140px, font sizes reduce by 1 step
- Below 640px: controls stack vertically, search goes full-width
- Horizontal scroll on the timeline grid remains (this is intentional, not a bug)

---

## 3. Three-Tier Data Rendering

Conferences render differently based on available milestone data:

| Tier | Data available | Visual treatment |
|------|---------------|-----------------|
| **Full** | fullPaper + rebuttal + notification (+ more) | Primary path track + all markers + range bars. The complete gantt. |
| **Partial** | Submission deadline + conference dates | Submission marker + conference date range bar. No primary path track. |
| **Minimal** | Submission deadline only | Single marker dot. Clean, not broken-looking. |

No visual "downgrade" indicators. Conferences with richer data naturally look richer. The existing `hasRenderablePrimaryPath` function in `sections.ts` already handles this — it only renders the primary path when fullPaper + rebuttalStart + notification exist.

---

## 4. New Dependencies

| Package | Purpose | Size |
|---------|---------|------|
| `js-yaml` | Parse YAML from both data sources | ~50KB |
| `@types/js-yaml` | TypeScript types | dev only |
| `geist` | Geist Sans + Geist Mono font | ~200KB (font files) |

---

## 5. Out of Scope

- Virtual scrolling (YAGNI — 300 rows is fine)
- User accounts / personalization / "watched" conferences
- Runtime data fetching (client-side) — everything is build-time/ISR
- Mobile-specific gestures or layouts beyond basic responsive
- Conference submission / contribution features
- Notifications or alerts for upcoming deadlines
