# Conference Inline Details Design

## Goal

Replace the current hover-based conference detail card with an inline accordion
pattern that keeps the timeline readable. Clicking a conference in the left
metadata column should insert a detail row directly below that conference while
leaving the original conference label row and timeline row unchanged.

## User-Approved Interaction

- Conference details no longer appear in a floating hover card.
- The compact conference trigger stays in place and becomes click-driven.
- The trigger shows a disclosure arrow to the right of the conference short
  name. The arrow points down when collapsed and rotates upward when expanded.
- Expanding a conference inserts a new row directly below that conference.
- The inserted detail row spans both the metadata column and the timeline
  column.
- Multiple conferences may be expanded at the same time.
- Clicking an expanded conference collapses only that conference.
- Milestone hover tooltips remain unchanged.

## Layout

The timeline grid currently renders two columns: the fixed metadata column and
the scrollable timeline column. Each conference currently consumes two sibling
cells inside the same grid row. The new design keeps that row intact and adds a
third grid item immediately after it:

1. Metadata cell for the conference trigger
2. Timeline cell for the existing gantt content
3. Full-width detail row using `col-span-2`

This preserves the current scan experience for the main timeline while making
the extra information visible only when requested.

## Detail Content

Each expanded row shows:

- Conference rankings from `conference.rankings`
- Conference type from `conference.category`
- Conference date range derived from `conferenceStart` and `conferenceEnd`
- Conference location from `conference.location`
- Main page link from `conference.website`

If conference start/end milestones are missing, the date field should fall back
to a neutral "TBA" style value instead of failing.

## State and Behavior

The grid replaces the current single `hoveredConferenceId` state with a set of
expanded conference ids. Clicking a trigger toggles membership in that set.
Hover/focus handlers for conference details are removed because the detail row
is no longer overlay-driven.

Milestone hover state remains independent and should keep its current behavior.

## Visual Direction

The inline detail row should feel like an embedded expansion panel rather than a
tooltip:

- full-width panel nested inside the timeline shell
- moderate separation from the main row using borders, padding, and surface
  contrast
- arrow motion on toggle
- a short vertical reveal animation that does not cover other content

## Testing

Update timeline grid tests to verify:

- clicking a conference trigger inserts an inline detail row
- multiple conferences can remain expanded simultaneously
- clicking an expanded trigger collapses that detail row
- the old hover detail card behavior is removed

Milestone tooltip tests remain in place as regression coverage for unchanged
hover behavior.
