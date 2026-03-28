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
                <div
                  className="flex flex-wrap gap-1.5"
                  role="group"
                  aria-label="Milestone filters"
                >
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
