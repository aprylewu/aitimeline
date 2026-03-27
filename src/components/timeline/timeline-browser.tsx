"use client";

import { useState } from "react";
import { addMonths, format, parseISO, subMonths } from "date-fns";
import { ControlsBar } from "./controls-bar";
import { TimelineGrid } from "./timeline-grid";
import { getDefaultVisibleRange } from "@/lib/timeline/date-range";
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
  const points = conferences.flatMap((conference) =>
    conference.milestones.flatMap((milestone) => [
      parseISO(milestone.dateStart),
      parseISO(milestone.dateEnd ?? milestone.dateStart),
    ]),
  );

  return {
    start: new Date(Math.min(...points.map((point) => point.getTime()))),
    end: new Date(Math.max(...points.map((point) => point.getTime()))),
  };
}

export function TimelineBrowser({ conferences, now }: TimelineBrowserProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<Set<ConferenceCategory>>(
    () => new Set(),
  );
  const [visibleRange, setVisibleRange] = useState(() =>
    getDefaultVisibleRange(now),
  );
  const [visibleMilestoneTypes, setVisibleMilestoneTypes] = useState(
    () => new Set<MilestoneType>(DEFAULT_VISIBLE_MILESTONE_TYPES),
  );
  const defaultVisibleRange = getDefaultVisibleRange(now);

  const availableCategories = Array.from(
    new Set(conferences.map((conference) => conference.category)),
  ).sort();

  const availableMilestoneTypes = DEFAULT_VISIBLE_MILESTONE_TYPES.filter((type) =>
    conferences.some((conference) =>
      conference.milestones.some((milestone) => milestone.type === type),
    ),
  );

  function handlePresetSelect(preset: "3M" | "6M" | "12M" | "All") {
    if (preset === "All") {
      setVisibleRange(getAllRange(conferences));
      return;
    }

    const months = Number.parseInt(preset, 10);
    const monthsBack = Math.max(1, Math.floor(months / 3));

    setVisibleRange({
      start: subMonths(now, monthsBack),
      end: addMonths(now, months - monthsBack),
    });
  }

  function clearAllFilters() {
    setQuery("");
    setCategories(new Set());
    setVisibleMilestoneTypes(new Set(DEFAULT_VISIBLE_MILESTONE_TYPES));
    setVisibleRange(defaultVisibleRange);
  }

  const sections = organizeConferenceSections({
    conferences,
    query,
    categories,
    visibleMilestoneTypes,
    visibleRange,
    now,
  });
  const visibleConferenceCount = sections.active.length + sections.past.length;
  const hasMilestoneFilter = availableMilestoneTypes.some(
    (type) => !visibleMilestoneTypes.has(type),
  );
  const hasVisibleRangeFilter =
    visibleRange.start.getTime() !== defaultVisibleRange.start.getTime() ||
    visibleRange.end.getTime() !== defaultVisibleRange.end.getTime();
  const hasActiveFilters =
    query.trim().length > 0 ||
    categories.size > 0 ||
    hasMilestoneFilter ||
    hasVisibleRangeFilter;

  return (
    <main
      data-testid="timeline-browser"
      data-theme={theme}
      className="timeline-browser min-h-screen bg-[var(--page-bg)] text-[var(--text-primary)]"
    >
      <ControlsBar
        query={query}
        onQueryChange={setQuery}
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
        theme={theme}
        onThemeToggle={() =>
          setTheme((current) => (current === "light" ? "dark" : "light"))
        }
      />
      <section className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
        <div className="mb-5">
          <p className="text-xs font-medium text-[var(--text-muted)]">
            {visibleConferenceCount} venue{visibleConferenceCount !== 1 ? "s" : ""}
            {" · "}
            {format(visibleRange.start, "MMM yyyy")}
            {" – "}
            {format(visibleRange.end, "MMM yyyy")}
          </p>
          <h1 className="mt-1.5 text-3xl font-bold tracking-tight md:text-4xl">
            2026 Conference Timeline
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
            Deadlines, rebuttals, and decisions at a glance across active
            venues.
          </p>
          <div
            data-testid="timeline-legend"
            className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-[var(--text-muted)]"
          >
            {LEGEND_ITEMS.map((item) => (
              <span key={item.label} className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: `var(${item.variable})` }}
                />
                {item.label}
              </span>
            ))}
          </div>
        </div>
        <div
          data-testid="timeline-surface"
          className="timeline-shell overflow-x-auto rounded-2xl border border-[var(--panel-border)]"
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
          <div className="mt-4 rounded-lg border border-[var(--panel-border)] bg-[var(--surface-bg)] px-5 py-4">
            <p className="text-sm text-[var(--text-muted)]">
              No conferences match the current filters.
            </p>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearAllFilters}
                className="mt-2 cursor-pointer text-sm font-medium text-[var(--accent-primary)] transition hover:underline"
              >
                Clear all filters
              </button>
            ) : null}
          </div>
        ) : null}
      </section>
    </main>
  );
}
