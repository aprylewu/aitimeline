# Conference Timeline Left Sidebar Design

**Date:** 2026-03-27

## Goal

Move the settings and filter `Menu` from the current top control bar into a desktop left sidebar while keeping the experience compact and elegant on mobile.

## Approved Direction

The approved layout is a split-shell interface:

- Desktop uses a ChatGPT-like left sidebar that stays visible and can collapse into a narrow rail.
- Mobile keeps the menu at the top of the page, but the full control stack compresses into a compact sticky bar after the user scrolls down.
- The compact mobile bar keeps a visible `Filters` entry point instead of hiding controls entirely.

## Desktop Experience

### Sidebar Shell

- The controls move into a left-side `aside` with a fixed width in the main page layout.
- The sidebar stays `sticky` so filters remain reachable while the timeline scrolls.
- The expanded state shows the full search, theme toggle, range presets, category chips, and milestone chips.

### Collapsed Rail

- The sidebar can collapse into a narrow rail similar to ChatGPT's desktop shell.
- The rail remains visible at all times and keeps a clear expand button.
- The collapsed state should not show the full filter groups, but it should still feel intentional instead of looking hidden or broken.
- The collapsed state should persist in `localStorage` so the preference survives reloads.

## Mobile Experience

### Expanded Top Menu

- On initial load and near the top of the page, mobile keeps the current stacked menu behavior.
- The search field and filter groups remain in a sticky top card above the timeline.

### Compact Sticky Bar

- After the user scrolls down past a threshold, the expanded mobile menu collapses into a slim sticky bar.
- The compact bar keeps:
  - a `Filters` button to reopen the full mobile controls
  - a short summary of current filters
  - the theme toggle if space allows
- The compact bar stays visible while scrolling so the filter entry point is never lost.
- Returning near the top of the page should restore the expanded menu automatically.

## Interaction Rules

- Desktop collapse and expand affect layout width only; filtering behavior does not change.
- Mobile compact mode is a presentation change only; all filter state remains intact.
- Clicking the mobile `Filters` button from compact mode restores the expanded menu immediately.
- Search, category toggles, milestone toggles, presets, and theme switching must continue to behave exactly as they do now.

## Visual Direction

- Preserve the current restrained palette and calm, Apple-adjacent tone.
- Keep the sidebar surface softly elevated with the existing translucent material treatment.
- Avoid heavy shadows or dashboard-like density.
- Use short `transform` and `opacity` transitions only.
- The collapsed rail and compact mobile bar should look deliberate, not like partial leftovers of the expanded layout.

## Component Changes

- `src/components/timeline/timeline-browser.tsx`
  - own the desktop collapsed state
  - own the mobile compact and expanded state
  - switch from a single top-stack layout to a desktop two-column shell
- `src/components/timeline/controls-bar.tsx`
  - become a reusable controls surface that can render as desktop sidebar, mobile expanded bar, and mobile compact bar
- `app/globals.css`
  - add sidebar shell, rail, and compact mobile bar styling

## Testing Strategy

UI tests should cover:

- desktop menu renders in a left sidebar shell
- desktop sidebar can collapse and expand
- collapsed desktop preference persists after rerender
- mobile menu enters compact mode after scroll
- mobile `Filters` action restores expanded controls
- existing search and filtering interactions still work

## Constraints

- The timeline grid layout itself should stay intact.
- The redesign should avoid introducing a new drawer system or a multi-step mobile flow.
- The mobile compact behavior must not make filters impossible to discover.
