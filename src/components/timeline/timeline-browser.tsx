"use client";

import { useEffect, useState } from "react";
import { addMonths, parseISO, subMonths } from "date-fns";
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

export function TimelineBrowser({
  conferences,
  now,
  viewerTimeZone,
}: TimelineBrowserProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [query, setQuery] = useState("");
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [isMobileMenuCompact, setIsMobileMenuCompact] = useState(false);
  const [isDesktopMenuCollapsed, setIsDesktopMenuCollapsed] = useState(false);
  const [hasRestoredDesktopMenuPreference, setHasRestoredDesktopMenuPreference] =
    useState(false);
  const [categories, setCategories] = useState<Set<ConferenceCategory>>(
    () => new Set(),
  );
  const [visibleRange, setVisibleRange] = useState(() =>
    getDefaultVisibleRange(now),
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

  const sections = organizeConferenceSections({
    conferences,
    query,
    categories,
    visibleMilestoneTypes,
    visibleRange,
    now,
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
                now={now}
                viewerTimeZone={viewerTimeZone}
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
