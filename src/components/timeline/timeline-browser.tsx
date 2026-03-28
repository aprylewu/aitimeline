"use client";

import { useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { addMonths, format, parseISO, subMonths } from "date-fns";
import { ControlsBar, type RangePreset } from "./controls-bar";
import { TimelineGrid } from "./timeline-grid";
import {
  alignVisibleRangeToMonthBounds,
  getDefaultVisibleRange,
} from "@/lib/timeline/date-range";
import { organizeConferenceSections } from "@/lib/timeline/sections";
import type {
  Conference,
  ConferenceCategory,
  MilestoneType,
} from "@/types/conference";

interface TimelineBrowserProps {
  conferences: Conference[];
  now: Date;
}

interface SurfaceDragState {
  pointerId: number;
  startScrollLeft: number;
  startX: number;
}

const DEFAULT_VISIBLE_MILESTONE_TYPES: MilestoneType[] = [
  "fullPaper",
  "rebuttalStart",
  "rebuttalEnd",
  "notification",
  "cameraReady",
  "conferenceStart",
  "conferenceEnd",
];

const LEGEND_ITEMS = [
  { label: "Submission", variable: "--timeline-full-paper" },
  { label: "Rebuttal", variable: "--timeline-rebuttal" },
  { label: "Decision", variable: "--timeline-notification" },
  { label: "Conference", variable: "--timeline-conference" },
] as const;
const PRESET_OPTIONS = ["3M", "6M", "12M"] as const;

function rangesMatch(
  left: { start: Date; end: Date },
  right: { start: Date; end: Date },
) {
  return (
    left.start.getTime() === right.start.getTime() &&
    left.end.getTime() === right.end.getTime()
  );
}

function getPresetRange(now: Date, preset: Exclude<RangePreset, "All">) {
  const months = Number.parseInt(preset, 10);
  const monthsBack = Math.max(1, Math.floor(months / 3));

  return alignVisibleRangeToMonthBounds({
    start: subMonths(now, monthsBack),
    end: addMonths(now, months - monthsBack),
  });
}

function toggleSetValue<T>(current: Set<T>, value: T) {
  const next = new Set(current);

  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }

  return next;
}

function getAllRange(conferences: Conference[]) {
  const points = conferences
    .flatMap((conference) =>
      conference.milestones.flatMap((milestone) => [
        parseISO(milestone.dateStart),
        parseISO(milestone.dateEnd ?? milestone.dateStart),
      ]),
    )
    .filter((point) => Number.isFinite(point.getTime()));

  if (points.length === 0) {
    return null;
  }

  return alignVisibleRangeToMonthBounds({
    start: new Date(Math.min(...points.map((point) => point.getTime()))),
    end: new Date(Math.max(...points.map((point) => point.getTime()))),
  });
}

export function TimelineBrowser({ conferences, now }: TimelineBrowserProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [query, setQuery] = useState("");
  const [isDraggingSurface, setIsDraggingSurface] = useState(false);
  const [categories, setCategories] = useState<Set<ConferenceCategory>>(
    () => new Set(),
  );
  const [visibleRange, setVisibleRange] = useState(() =>
    getDefaultVisibleRange(now),
  );
  const [visibleMilestoneTypes, setVisibleMilestoneTypes] = useState(
    () => new Set<MilestoneType>(DEFAULT_VISIBLE_MILESTONE_TYPES),
  );
  const surfaceDragStateRef = useRef<SurfaceDragState | null>(null);
  const defaultVisibleRange = useMemo(() => getDefaultVisibleRange(now), [now]);
  const presetRanges = useMemo(
    () =>
      Object.fromEntries(
        PRESET_OPTIONS.map((preset) => [preset, getPresetRange(now, preset)]),
      ) as Record<(typeof PRESET_OPTIONS)[number], { start: Date; end: Date }>,
    [now],
  );
  const allRange = useMemo(() => getAllRange(conferences), [conferences]);
  const availableCategories = useMemo(
    () =>
      Array.from(
        new Set(conferences.map((conference) => conference.category)),
      ).sort(),
    [conferences],
  );
  const availableMilestoneTypes = useMemo(
    () =>
      DEFAULT_VISIBLE_MILESTONE_TYPES.filter((type) =>
        conferences.some((conference) =>
          conference.milestones.some((milestone) => milestone.type === type),
        ),
      ),
    [conferences],
  );

  function handlePresetSelect(preset: "3M" | "6M" | "12M" | "All") {
    if (preset === "All") {
      setVisibleRange(allRange ?? defaultVisibleRange);
      return;
    }

    setVisibleRange(presetRanges[preset]);
  }

  function clearAllFilters() {
    setQuery("");
    setCategories(new Set());
    setVisibleMilestoneTypes(new Set(DEFAULT_VISIBLE_MILESTONE_TYPES));
    setVisibleRange(defaultVisibleRange);
  }

  function endSurfaceDrag(
    currentTarget: HTMLDivElement,
    pointerId: number,
  ) {
    if (
      !surfaceDragStateRef.current ||
      surfaceDragStateRef.current.pointerId !== pointerId
    ) {
      return;
    }

    surfaceDragStateRef.current = null;
    setIsDraggingSurface(false);

    try {
      currentTarget.releasePointerCapture?.(pointerId);
    } catch {
      // Ignore browsers/test environments that do not track pointer capture.
    }
  }

  function handleSurfacePointerDown(
    event: ReactPointerEvent<HTMLDivElement>,
  ) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    const target = event.target as HTMLElement;

    if (target.closest("button, input, a")) {
      return;
    }

    if (event.currentTarget.scrollWidth <= event.currentTarget.clientWidth) {
      return;
    }

    surfaceDragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: event.currentTarget.scrollLeft,
    };
    setIsDraggingSurface(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }

  function handleSurfacePointerMove(
    event: ReactPointerEvent<HTMLDivElement>,
  ) {
    if (
      !surfaceDragStateRef.current ||
      surfaceDragStateRef.current.pointerId !== event.pointerId
    ) {
      return;
    }

    const deltaX = event.clientX - surfaceDragStateRef.current.startX;
    event.currentTarget.scrollLeft =
      surfaceDragStateRef.current.startScrollLeft - deltaX;
    event.preventDefault();
  }

  const sections = useMemo(
    () =>
      organizeConferenceSections({
        conferences,
        query,
        categories,
        visibleMilestoneTypes,
        visibleRange,
        now,
      }),
    [categories, conferences, now, query, visibleMilestoneTypes, visibleRange],
  );
  const timelineSections = useMemo(
    () => [
      { id: "active", label: "Active", conferences: sections.active },
      { id: "past", label: "Past", conferences: sections.past },
    ],
    [sections],
  );
  const visibleConferenceCount = sections.active.length + sections.past.length;
  const hasConferenceData = useMemo(
    () => conferences.some((conference) => conference.milestones.length > 0),
    [conferences],
  );
  const milestoneFilterCount = useMemo(
    () =>
      availableMilestoneTypes.filter((type) => !visibleMilestoneTypes.has(type))
        .length,
    [availableMilestoneTypes, visibleMilestoneTypes],
  );
  const hasMilestoneFilter = milestoneFilterCount > 0;
  const hasVisibleRangeFilter =
    visibleRange.start.getTime() !== defaultVisibleRange.start.getTime() ||
    visibleRange.end.getTime() !== defaultVisibleRange.end.getTime();
  const trimmedQuery = query.trim();
  const activeFilterCount =
    milestoneFilterCount +
    categories.size +
    (trimmedQuery.length > 0 ? 1 : 0) +
    (hasVisibleRangeFilter ? 1 : 0);
  const hasActiveFilters =
    trimmedQuery.length > 0 ||
    categories.size > 0 ||
    hasMilestoneFilter ||
    hasVisibleRangeFilter;
  const activePreset = useMemo(
    () =>
      PRESET_OPTIONS.find((preset) =>
        rangesMatch(visibleRange, presetRanges[preset]),
      ) ?? (allRange && rangesMatch(visibleRange, allRange) ? "All" : null),
    [allRange, presetRanges, visibleRange],
  );

  return (
    <main
      data-testid="timeline-browser"
      data-theme={theme}
      className="timeline-browser min-h-screen bg-[var(--page-bg)] text-[var(--text-primary)]"
    >
      <ControlsBar
        query={query}
        onQueryChange={setQuery}
        activePreset={activePreset}
        activeFilterCount={activeFilterCount}
        availableCategories={availableCategories}
        categories={categories}
        onCategoryToggle={(value) =>
          setCategories((current) => toggleSetValue(current, value))
        }
        availableMilestoneTypes={availableMilestoneTypes}
        visibleMilestoneTypes={visibleMilestoneTypes}
        onMilestoneToggle={(value) =>
          setVisibleMilestoneTypes((current) => toggleSetValue(current, value))
        }
        onPresetSelect={handlePresetSelect}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearAllFilters}
        theme={theme}
        onThemeToggle={() =>
          setTheme((current) => (current === "light" ? "dark" : "light"))
        }
      />
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
            Track submission windows, rebuttals, decisions, and event dates in
            one continuous view.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
            <div
              data-testid="timeline-legend"
              className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-muted)]"
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
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--text-muted)]">
              Drag the surface to scan dense stretches.
            </p>
          </div>
        </div>
        <div
          data-testid="timeline-surface"
          role="region"
          aria-label="Conference timeline"
          onPointerDown={handleSurfacePointerDown}
          onPointerMove={handleSurfacePointerMove}
          onPointerUp={(event) =>
            endSurfaceDrag(event.currentTarget, event.pointerId)
          }
          onPointerCancel={(event) =>
            endSurfaceDrag(event.currentTarget, event.pointerId)
          }
          className={`timeline-shell timeline-shell-draggable overflow-x-auto rounded-xl border border-[var(--panel-border)] ${
            isDraggingSurface ? "timeline-shell-dragging" : ""
          }`}
        >
          <TimelineGrid sections={timelineSections} visibleRange={visibleRange} now={now} />
        </div>
        {visibleConferenceCount === 0 ? (
          <div className="mt-6 flex flex-col items-center py-12">
            <div className="mb-4 flex flex-col items-center gap-1.5 text-[var(--text-muted)] opacity-30">
              <div className="h-px w-32 bg-current" />
              <div className="h-px w-24 bg-current" />
              <div className="h-px w-16 bg-current" />
            </div>
            <p className="text-center text-sm text-[var(--text-muted)]">
              {hasConferenceData
                ? "No conferences match the current filters."
                : "No conference data is available right now."}
            </p>
            {!hasConferenceData ? (
              <p className="mt-2 max-w-sm text-center text-xs leading-5 text-[var(--text-muted)]">
                Try again later or refresh after the data sources recover.
              </p>
            ) : null}
            {hasConferenceData && hasActiveFilters ? (
              <button
                type="button"
                onClick={clearAllFilters}
                className="timeline-control mt-3 cursor-pointer rounded-lg border border-[var(--panel-border)] bg-[var(--chip-bg)] px-4 py-1.5 text-sm font-medium text-[var(--text-primary)] hover:border-[var(--text-primary)]"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        ) : null}
      </section>
    </main>
  );
}
