# Restore Timeline Interactions Design

## Goal

Restore the timeline interaction and time-handling behaviors that were present before the merged UI overhaul, while preserving the current visual design, layout language, and controls styling from `origin/main`.

## Restored Behaviors

1. The timeline keeps a wide browsable range, while the default visible window stays focused on the recent horizon.
2. Milestones and range bars are clipped to the planned timeline extent and do not leak outside the intended render surface.
3. Viewer timezone logic once again drives milestone filtering, sorting, labels, and past/active section placement.
4. Clicking a conference title expands a stable detail panel without breaking horizontal timeline browsing.
5. Hover interactions remain stable even when tooltip positioning or marker transforms would otherwise cause hover loss.

## Design Principles

1. Keep the merged UI, typography, spacing, controls bar, and general visual polish from the collaborator PR.
2. Restore behavior by reintroducing proven timeline logic from earlier commits rather than inventing new interaction models.
3. Use one consistent time model across filtering, ordering, rendering, and labels.
4. Treat rendering bounds as first-class: every dot, bar, and tooltip anchor must respect the same visible window and full timeline range.

## Architecture

### 1. Dual range model in `TimelineBrowser`

The merged UI currently drives rendering from a single `visibleRange`. The restored model will separate:

- `timelineRange`: the full horizontal range the user can browse
- `focusRange`: the current viewport-sized portion that should be on screen by default

The current UI shell and preset controls remain, but the internal timeline state will once again compute scroll width and initial scroll position from `focusRange` relative to `timelineRange`.

### 2. Unified milestone time handling

The restored implementation will reuse the older milestone-time pipeline so all of these use the same logic:

- `AoE`, `UTC`, and explicit IANA timezone support
- visible range filtering
- timeline clipping
- tooltip labels
- active vs. past section classification

The merged PR already still contains portions of this stack in `src/lib/timeline/milestone-time.ts`; the recovery work will reconnect consumers that now bypass it.

### 3. Grid rendering and clipping

`TimelineGrid` will keep the current visuals but restore the older clipping behavior:

- markers render only when their instant is inside the current visible window
- path bars and range bars clip against the visible render window
- tick positions, today markers, and tooltip anchors use the same coordinate system

This avoids the current regressions where milestones and bars can appear outside the planned timeline extent.

### 4. Detail expansion and sticky behavior

The conference detail interaction will keep the newer UI styling but restore the stronger interaction behavior from the previous implementation:

- click conference title to expand details
- keep the left column fixed
- keep the detail panel visually fixed while the right timeline remains horizontally scrollable
- keep hover and expansion state stable during animation and scrolling

### 5. Hover stability

The restored implementation will continue to use lightweight transforms and tooltip positioning, but interaction ownership must stay on the marker row rather than being lost when the tooltip or marker shifts position.

## File Scope

Primary implementation files:

- `src/components/timeline/timeline-browser.tsx`
- `src/components/timeline/timeline-grid.tsx`
- `src/components/timeline/controls-bar.tsx`
- `src/lib/timeline/date-range.ts`
- `src/lib/timeline/milestone-time.ts`
- `src/lib/timeline/sections.ts`
- `src/lib/timeline/filtering.ts`

Primary regression coverage:

- `src/components/timeline/timeline-browser.test.tsx`
- `src/components/timeline/timeline-grid.test.tsx`
- `src/lib/timeline/milestone-time.test.ts`
- `src/lib/timeline/sections.test.ts`
- `src/lib/timeline/filtering.test.ts`

## Verification Strategy

1. Add regression tests before implementation for:
   - default focused horizon with wider browsable timeline range
   - clipped milestone and range rendering
   - stable detail expansion
   - stable hover behavior
   - timezone-aware filtering and sorting
2. Restore behavior in small slices, keeping the merged UI intact.
3. Run full project verification: tests, lint, build.
4. Perform a manual browser check for the restored timeline interactions on the local dev server.
