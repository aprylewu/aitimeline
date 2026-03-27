"use client";

import { useEffect, useMemo, useState } from "react";
import { ControlsBar } from "./controls-bar";
import { TimelineGrid } from "./timeline-grid";
import { getDefaultVisibleRange, getPresetVisibleRange } from "@/lib/timeline/date-range";
import { getMilestoneRange, resolveViewerTimeZone } from "@/lib/timeline/milestone-time";
import { organizeConferenceSections } from "@/lib/timeline/sections";
import type {
  Conference,
  ConferenceCategory,
  MilestoneType,
} from "@/types/conference";

interface TimelineBrowserProps {
  conferences: Conference[];
  now: Date;
  viewerTimeZone?: string;
}

const DESKTOP_BREAKPOINT = 1024;
const MOBILE_MENU_COMPACT_SCROLL_Y = 96;
const MOBILE_MENU_RESET_SCROLL_Y = 24;
const DESKTOP_MENU_STORAGE_KEY = "timeline.desktopMenuCollapsed";
const THEME_COLORS = {
  dark: "#070b14",
  light: "#f6f3ed",
} as const;

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
  {
    key: "fullPaper",
    label: "Full paper",
    markerClass: "bg-[#16a34a]",
    type: "dot" as const,
  },
  {
    key: "rebuttal",
    label: "Rebuttal",
    markerClass: "bg-[var(--timeline-rebuttal)]",
    type: "dot" as const,
  },
  {
    key: "notification",
    label: "Final decision",
    markerClass: "bg-[#dc2626]",
    type: "dot" as const,
  },
  {
    key: "conference",
    label: "Conference",
    markerClass: "bg-[var(--timeline-conference)]",
    type: "dot" as const,
  },
  {
    key: "today",
    label: "Today",
    markerClass: "bg-[var(--accent-secondary)]",
    type: "line" as const,
  },
] as const;

function getIsMobileViewport() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.innerWidth < DESKTOP_BREAKPOINT;
}

function getStoredDesktopMenuCollapsed() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(DESKTOP_MENU_STORAGE_KEY) === "true";
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

function getAllRange(
  conferences: Conference[],
  viewerTimeZone?: string,
) {
  const points = conferences.flatMap((conference) =>
    conference.milestones.flatMap((milestone) => [
      getMilestoneRange(milestone, viewerTimeZone).start,
      getMilestoneRange(milestone, viewerTimeZone).end,
    ]),
  );

  return {
    start: new Date(Math.min(...points.map((point) => point.getTime()))),
    end: new Date(Math.max(...points.map((point) => point.getTime()))),
  };
}

function TimelineLegend() {
  return (
    <div
      data-testid="timeline-legend"
      className="mb-4 flex flex-wrap items-center gap-2.5 rounded-[22px] border border-[var(--panel-border)] bg-[var(--surface-bg)] px-3 py-2.5"
    >
      <span className="mr-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
        Legend
      </span>
      {LEGEND_ITEMS.map((item) => (
        <span
          key={item.key}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--chip-bg)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-muted)]"
        >
          <span
            aria-hidden="true"
            className={
              item.type === "line"
                ? `block h-3 w-[3px] rounded-full ${item.markerClass}`
                : `block h-2.5 w-2.5 rounded-full ${item.markerClass}`
            }
          />
          {item.label}
        </span>
      ))}
      <span className="text-[11px] text-[var(--text-muted)]">
        Dots are milestones; soft bars mark ranges.
      </span>
    </div>
  );
}

export function TimelineBrowser({
  conferences,
  now,
  viewerTimeZone,
}: TimelineBrowserProps) {
  const initialViewerTimeZone = resolveViewerTimeZone(viewerTimeZone);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [query, setQuery] = useState("");
  const [timelineNow, setTimelineNow] = useState(now);
  const [resolvedViewerTimeZone, setResolvedViewerTimeZone] = useState(
    initialViewerTimeZone,
  );
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [isMobileMenuCompact, setIsMobileMenuCompact] = useState(false);
  const [isDesktopMenuCollapsed, setIsDesktopMenuCollapsed] = useState(false);
  const [hasRestoredDesktopMenuPreference, setHasRestoredDesktopMenuPreference] =
    useState(false);
  const [categories, setCategories] = useState<Set<ConferenceCategory>>(
    () => new Set(),
  );
  const [manualVisibleRange, setManualVisibleRange] = useState<{
    end: Date;
    start: Date;
  } | null>(null);
  const visibleRange = useMemo(
    () =>
      manualVisibleRange ??
      getDefaultVisibleRange(timelineNow, resolvedViewerTimeZone),
    [manualVisibleRange, resolvedViewerTimeZone, timelineNow],
  );
  const [visibleMilestoneTypes, setVisibleMilestoneTypes] = useState(
    () => new Set<MilestoneType>(DEFAULT_VISIBLE_MILESTONE_TYPES),
  );

  const availableCategories = Array.from(
    new Set(conferences.map((conference) => conference.category)),
  ).sort();

  const availableMilestoneTypes = DEFAULT_VISIBLE_MILESTONE_TYPES.filter((type) =>
    conferences.some((conference) =>
      conference.milestones.some((milestone) => milestone.type === type),
    ),
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const syncFrame = window.requestAnimationFrame(() => {
      setTimelineNow(new Date());
      setResolvedViewerTimeZone(resolveViewerTimeZone());
    });

    return () => {
      window.cancelAnimationFrame(syncFrame);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const restorePreferenceFrame = window.requestAnimationFrame(() => {
      setIsDesktopMenuCollapsed(getStoredDesktopMenuCollapsed());
      setHasRestoredDesktopMenuPreference(true);
    });

    return () => {
      window.cancelAnimationFrame(restorePreferenceFrame);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    function handleResize() {
      const mobile = getIsMobileViewport();

      setIsMobileViewport(mobile);

      if (!mobile) {
        setIsMobileMenuCompact(false);
        return;
      }

      if (window.scrollY <= MOBILE_MENU_RESET_SCROLL_Y) {
        setIsMobileMenuCompact(false);
        return;
      }

      setIsMobileMenuCompact(window.scrollY > MOBILE_MENU_COMPACT_SCROLL_Y);
    }

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !isMobileViewport) {
      return undefined;
    }

    function handleScroll() {
      if (window.scrollY <= MOBILE_MENU_RESET_SCROLL_Y) {
        setIsMobileMenuCompact(false);
        return;
      }

      if (window.scrollY > MOBILE_MENU_COMPACT_SCROLL_Y) {
        setIsMobileMenuCompact(true);
      }
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isMobileViewport]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !hasRestoredDesktopMenuPreference
    ) {
      return;
    }

    window.localStorage.setItem(
      DESKTOP_MENU_STORAGE_KEY,
      String(isDesktopMenuCollapsed),
    );
  }, [hasRestoredDesktopMenuPreference, isDesktopMenuCollapsed]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.documentElement.setAttribute("data-theme", theme);
    document.body.setAttribute("data-theme", theme);

    let themeColorMeta = document.querySelector("meta[name='theme-color']");

    if (!themeColorMeta) {
      themeColorMeta = document.createElement("meta");
      themeColorMeta.setAttribute("name", "theme-color");
      document.head.appendChild(themeColorMeta);
    }

    themeColorMeta.setAttribute("content", THEME_COLORS[theme]);
  }, [theme]);

  function handlePresetSelect(preset: "3M" | "6M" | "12M" | "All") {
    if (preset === "All") {
      setManualVisibleRange(getAllRange(conferences, resolvedViewerTimeZone));
      return;
    }

    const months = Number.parseInt(preset, 10);
    setManualVisibleRange(
      getPresetVisibleRange(timelineNow, resolvedViewerTimeZone, months),
    );
  }

  const sections = organizeConferenceSections({
    conferences,
    query,
    categories,
    visibleMilestoneTypes,
    visibleRange,
    viewerTimeZone: resolvedViewerTimeZone,
    now: timelineNow,
  });
  const visibleConferenceCount = sections.active.length + sections.past.length;

  return (
    <main
      data-testid="timeline-browser"
      data-theme={theme}
      className="timeline-browser min-h-screen bg-[var(--page-bg)] text-[var(--text-primary)]"
    >
      <div
        className={`relative flex flex-col lg:grid lg:min-h-screen lg:transition-[grid-template-columns] lg:duration-200 lg:ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isDesktopMenuCollapsed
            ? "lg:[grid-template-columns:78px_minmax(0,1fr)]"
            : "lg:[grid-template-columns:336px_minmax(0,1fr)]"
        }`}
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
            setVisibleMilestoneTypes((current) =>
              toggleSetValue(current, value),
            )
          }
          onPresetSelect={handlePresetSelect}
          theme={theme}
          onThemeToggle={() =>
            setTheme((current) => (current === "light" ? "dark" : "light"))
          }
          isMobileViewport={isMobileViewport}
          isMobileCompact={isMobileMenuCompact}
          onMobileMenuExpand={() => setIsMobileMenuCompact(false)}
          isDesktopCollapsed={isDesktopMenuCollapsed}
          onDesktopMenuToggle={() =>
            setIsDesktopMenuCollapsed((current) => !current)
          }
        />

        <section className="min-w-0">
          <div className="mx-auto max-w-[1480px] px-4 py-4 md:px-6 md:py-6 xl:px-8">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                Focus on the submission to decision chain
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
                2026 Conference Timeline
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
                Shared gantt view for submission, rebuttal visibility, and final
                decisions across active venues.
              </p>
            </div>
            <TimelineLegend />
            <div
              data-testid="timeline-surface"
              className="timeline-shell overflow-x-auto rounded-[28px] border border-[var(--panel-border)]"
            >
              <TimelineGrid
                sections={[
                  { id: "active", label: "Active", conferences: sections.active },
                  { id: "past", label: "Past", conferences: sections.past },
                ]}
                visibleRange={visibleRange}
                now={timelineNow}
                viewerTimeZone={resolvedViewerTimeZone}
              />
            </div>
            {visibleConferenceCount === 0 ? (
              <div className="mt-4 rounded-2xl border border-[var(--panel-border)] bg-[var(--surface-bg)] px-4 py-3 text-sm text-[var(--text-muted)]">
                No conferences match the current filters.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
