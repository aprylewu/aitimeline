"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { addMonths, format, subMonths } from "date-fns";
import { ControlsBar, type RangePreset } from "./controls-bar";
import { TimelineGrid } from "./timeline-grid";
import {
  alignVisibleRangeToMonthBounds,
  getDefaultVisibleRange,
} from "@/lib/timeline/date-range";
import {
  getMilestoneRange,
  resolveViewerTimeZone,
  shiftDateByMonthsInTimeZone,
} from "@/lib/timeline/milestone-time";
import { organizeConferenceSections } from "@/lib/timeline/sections";
import type {
  Conference,
  ConferenceCategory,
  MilestoneType,
} from "@/types/conference";

interface TimelineBrowserProps {
  conferences: Conference[];
  now: Date;
  syncNowWithDevice?: boolean;
  viewerTimeZone?: string;
}

interface SurfaceDragState {
  pointerId: number;
  startScrollLeft: number;
  startX: number;
}

const DEFAULT_VISIBLE_MILESTONE_TYPES: MilestoneType[] = [
  "abstract",
  "fullPaper",
  "rebuttalStart",
  "rebuttalEnd",
  "notification",
  "cameraReady",
  "conferenceStart",
  "conferenceEnd",
];

const LEGEND_ITEMS = [
  { label: "Abstract", variable: "--timeline-neutral" },
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

function getPresetRange(
  now: Date,
  preset: Exclude<RangePreset, "All">,
  viewerTimeZone?: string,
) {
  const months = Number.parseInt(preset, 10);
  const monthsBack = Math.max(1, Math.floor(months / 3));

  if (viewerTimeZone) {
    const resolvedViewerTimeZone = resolveViewerTimeZone(viewerTimeZone);

    return alignVisibleRangeToMonthBounds(
      {
        start: shiftDateByMonthsInTimeZone(
          now,
          -monthsBack,
          resolvedViewerTimeZone,
        ),
        end: shiftDateByMonthsInTimeZone(
          now,
          months - monthsBack,
          resolvedViewerTimeZone,
        ),
      },
      resolvedViewerTimeZone,
    );
  }

  return alignVisibleRangeToMonthBounds(
    {
      start: subMonths(now, monthsBack),
      end: addMonths(now, months - monthsBack),
    },
    viewerTimeZone,
  );
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

function getAllRange(conferences: Conference[], viewerTimeZone?: string) {
  const points = conferences
    .flatMap((conference) =>
      conference.milestones.flatMap((milestone) => [
        getMilestoneRange(milestone, viewerTimeZone).start,
        getMilestoneRange(milestone, viewerTimeZone).end,
      ]),
    )
    .filter((point) => Number.isFinite(point.getTime()));

  if (points.length === 0) {
    return null;
  }

  return alignVisibleRangeToMonthBounds(
    {
      start: new Date(Math.min(...points.map((point) => point.getTime()))),
      end: new Date(Math.max(...points.map((point) => point.getTime()))),
    },
    viewerTimeZone,
  );
}

function clampFocusRangeToTimeline(
  focusRange: { start: Date; end: Date },
  timelineRange: { start: Date; end: Date },
) {
  const focusDuration = focusRange.end.getTime() - focusRange.start.getTime();
  const timelineDuration =
    timelineRange.end.getTime() - timelineRange.start.getTime();

  if (focusDuration >= timelineDuration) {
    return timelineRange;
  }

  if (focusRange.start.getTime() < timelineRange.start.getTime()) {
    return {
      start: timelineRange.start,
      end: new Date(timelineRange.start.getTime() + focusDuration),
    };
  }

  if (focusRange.end.getTime() > timelineRange.end.getTime()) {
    return {
      start: new Date(timelineRange.end.getTime() - focusDuration),
      end: timelineRange.end,
    };
  }

  return focusRange;
}

function getTimelineContentWidth(args: {
  focusRange: { start: Date; end: Date };
  timelineRange: { start: Date; end: Date };
  viewportWidth: number;
}) {
  const { focusRange, timelineRange, viewportWidth } = args;

  if (viewportWidth <= 0) {
    return 980;
  }

  const timelineDuration =
    timelineRange.end.getTime() - timelineRange.start.getTime();
  const focusDuration = Math.max(
    1,
    focusRange.end.getTime() - focusRange.start.getTime(),
  );

  if (timelineDuration <= 0 || focusDuration >= timelineDuration) {
    return Math.max(980, viewportWidth);
  }

  return Math.max(
    980,
    Math.ceil(viewportWidth * (timelineDuration / focusDuration)),
  );
}

function getFocusScrollLeft(args: {
  contentWidth: number;
  focusRange: { start: Date; end: Date };
  timelineRange: { start: Date; end: Date };
  viewportWidth: number;
}) {
  const { contentWidth, focusRange, timelineRange, viewportWidth } = args;

  if (contentWidth <= viewportWidth) {
    return 0;
  }

  const timelineDuration =
    timelineRange.end.getTime() - timelineRange.start.getTime();

  if (timelineDuration <= 0) {
    return 0;
  }

  const offset = Math.max(
    0,
    focusRange.start.getTime() - timelineRange.start.getTime(),
  );
  const rawScrollLeft = (offset / timelineDuration) * contentWidth;

  return Math.min(contentWidth - viewportWidth, rawScrollLeft);
}

export function TimelineBrowser({
  conferences,
  now,
  syncNowWithDevice = false,
  viewerTimeZone,
}: TimelineBrowserProps) {
  const resolvedViewerTimeZone = useMemo(
    () => resolveViewerTimeZone(viewerTimeZone),
    [viewerTimeZone],
  );
  const [currentNow, setCurrentNow] = useState(() => new Date(now));
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [query, setQuery] = useState("");
  const [isDraggingSurface, setIsDraggingSurface] = useState(false);
  const [categories, setCategories] = useState<Set<ConferenceCategory>>(
    () => new Set(),
  );
  const [visibleRange, setVisibleRange] = useState(() =>
    getDefaultVisibleRange(new Date(now), resolvedViewerTimeZone),
  );
  const [visibleMilestoneTypes, setVisibleMilestoneTypes] = useState(
    () => new Set<MilestoneType>(DEFAULT_VISIBLE_MILESTONE_TYPES),
  );
  const surfaceDragStateRef = useRef<SurfaceDragState | null>(null);
  const timelineSurfaceRef = useRef<HTMLDivElement | null>(null);
  const previousDefaultVisibleRangeRef = useRef(visibleRange);
  const [timelineSurfaceWidth, setTimelineSurfaceWidth] = useState(0);
  const defaultVisibleRange = useMemo(
    () => getDefaultVisibleRange(currentNow, resolvedViewerTimeZone),
    [currentNow, resolvedViewerTimeZone],
  );
  const presetRanges = useMemo(
    () =>
      Object.fromEntries(
        PRESET_OPTIONS.map((preset) => [
          preset,
          getPresetRange(currentNow, preset, resolvedViewerTimeZone),
        ]),
      ) as Record<(typeof PRESET_OPTIONS)[number], { start: Date; end: Date }>,
    [currentNow, resolvedViewerTimeZone],
  );
  const allRange = useMemo(
    () => getAllRange(conferences, resolvedViewerTimeZone),
    [conferences, resolvedViewerTimeZone],
  );
  const timelineRange = allRange ?? defaultVisibleRange;
  const scrollFocusRange = useMemo(
    () => clampFocusRangeToTimeline(visibleRange, timelineRange),
    [timelineRange, visibleRange],
  );
  const timelineContentWidth = useMemo(
    () =>
      getTimelineContentWidth({
        focusRange: scrollFocusRange,
        timelineRange,
        viewportWidth: timelineSurfaceWidth,
      }),
    [scrollFocusRange, timelineRange, timelineSurfaceWidth],
  );
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
        viewerTimeZone: resolvedViewerTimeZone,
        now: currentNow,
      }),
    [
      categories,
      conferences,
      currentNow,
      query,
      resolvedViewerTimeZone,
      visibleRange,
      visibleMilestoneTypes,
    ],
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

  useEffect(() => {
    if (!syncNowWithDevice) {
      return undefined;
    }

    let minuteIntervalId: number | undefined;
    const minuteTimeoutId = window.setTimeout(() => {
      syncCurrentNow();
      scheduleMinuteUpdates();
    }, 60_000 - (Date.now() % 60_000));

    const syncCurrentNow = () => {
      setCurrentNow(new Date());
    };

    syncCurrentNow();

    const scheduleMinuteUpdates = () => {
      minuteIntervalId = window.setInterval(syncCurrentNow, 60_000);
    };

    return () => {
      window.clearTimeout(minuteTimeoutId);

      if (minuteIntervalId !== undefined) {
        window.clearInterval(minuteIntervalId);
      }
    };
  }, [syncNowWithDevice]);

  useEffect(() => {
    setVisibleRange((currentVisibleRange) => {
      if (
        !rangesMatch(
          currentVisibleRange,
          previousDefaultVisibleRangeRef.current,
        ) ||
        rangesMatch(currentVisibleRange, defaultVisibleRange)
      ) {
        return currentVisibleRange;
      }

      return defaultVisibleRange;
    });
    previousDefaultVisibleRangeRef.current = defaultVisibleRange;
  }, [defaultVisibleRange]);

  useEffect(() => {
    const surface = timelineSurfaceRef.current;

    if (!surface) {
      return undefined;
    }

    const updateWidth = () => {
      setTimelineSurfaceWidth(surface.clientWidth);
    };

    updateWidth();

    if (typeof ResizeObserver === "undefined") {
      return undefined;
    }

    const resizeObserver = new ResizeObserver(() => {
      updateWidth();
    });

    resizeObserver.observe(surface);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useLayoutEffect(() => {
    const surface = timelineSurfaceRef.current;

    if (!surface || timelineSurfaceWidth <= 0) {
      return;
    }

    surface.scrollLeft = getFocusScrollLeft({
      contentWidth: timelineContentWidth,
      focusRange: scrollFocusRange,
      timelineRange,
      viewportWidth: timelineSurfaceWidth,
    });
  }, [
    scrollFocusRange,
    timelineContentWidth,
    timelineRange,
    timelineSurfaceWidth,
  ]);

  useEffect(() => {
    const rootElement = document.documentElement;
    const bodyElement = document.body;
    const previousRootTheme = rootElement.getAttribute("data-theme");
    const previousBodyTheme = bodyElement.getAttribute("data-theme");
    const previousRootColorScheme = rootElement.style.colorScheme;
    const previousBodyColorScheme = bodyElement.style.colorScheme;

    rootElement.setAttribute("data-theme", theme);
    bodyElement.setAttribute("data-theme", theme);
    rootElement.style.colorScheme = theme;
    bodyElement.style.colorScheme = theme;

    return () => {
      if (previousRootTheme) {
        rootElement.setAttribute("data-theme", previousRootTheme);
      } else {
        rootElement.removeAttribute("data-theme");
      }

      if (previousBodyTheme) {
        bodyElement.setAttribute("data-theme", previousBodyTheme);
      } else {
        bodyElement.removeAttribute("data-theme");
      }

      rootElement.style.colorScheme = previousRootColorScheme;
      bodyElement.style.colorScheme = previousBodyColorScheme;
    };
  }, [theme]);

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
          ref={timelineSurfaceRef}
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
          className={`timeline-shell timeline-shell-draggable overflow-x-auto overflow-y-hidden rounded-xl border border-[var(--panel-border)] ${
            isDraggingSurface ? "timeline-shell-dragging" : ""
          }`}
        >
          <TimelineGrid
            sections={timelineSections}
            visibleMilestoneTypes={visibleMilestoneTypes}
            visibleRange={timelineRange}
            width={timelineContentWidth}
            now={currentNow}
            viewerTimeZone={resolvedViewerTimeZone}
          />
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
