import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type {
  ConferenceCategory,
  MilestoneType,
} from "@/types/conference";

interface ControlsBarProps {
  query: string;
  onQueryChange: (value: string) => void;
  activePreset: RangePreset | null;
  activeFilterCount: number;
  availableCategories: ConferenceCategory[];
  categories: Set<ConferenceCategory>;
  onCategoryToggle: (value: ConferenceCategory) => void;
  availableMilestoneTypes: MilestoneType[];
  visibleMilestoneTypes: Set<MilestoneType>;
  onMilestoneToggle: (value: MilestoneType) => void;
  onPresetSelect: (preset: "3M" | "6M" | "12M" | "All") => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  theme: "light" | "dark";
  onThemeToggle: () => void;
}

export const PRESETS = ["3M", "6M", "12M", "All"] as const;
export type RangePreset = (typeof PRESETS)[number];

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
  SE: "Systems",
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

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M2 3.5h10M2 7h10M2 10.5h10" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.73 0 8.34c0 3.69 2.29 6.82 5.47 7.93.4.08.55-.18.55-.4 0-.2-.01-.86-.01-1.56-2.01.45-2.53-.51-2.69-.98-.09-.24-.48-.98-.82-1.18-.28-.15-.68-.52-.01-.53.63-.01 1.08.59 1.23.84.72 1.28 1.87.92 2.33.7.07-.54.28-.92.5-1.13-1.78-.21-3.64-.92-3.64-4.09 0-.9.31-1.64.82-2.22-.08-.21-.36-1.06.08-2.2 0 0 .67-.22 2.2.85A7.3 7.3 0 0 1 8 4.46a7.3 7.3 0 0 1 2 .29c1.52-1.07 2.2-.85 2.2-.85.44 1.14.16 1.99.08 2.2.51.58.82 1.32.82 2.22 0 3.18-1.87 3.88-3.65 4.09.29.26.54.77.54 1.56 0 1.13-.01 2.04-.01 2.32 0 .22.14.49.55.4A8.35 8.35 0 0 0 16 8.34C16 3.73 12.42 0 8 0Z" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 6.5A6 6 0 0 1 8 2.5a6 6 0 0 1 5.5 3.7" />
      <path d="M2.5 6.5V3h3.5" />
    </svg>
  );
}

function getControlButtonClass(isActive: boolean) {
  return isActive
    ? "border-[var(--text-primary)] bg-[var(--chip-active-bg)] text-[var(--text-primary)]"
    : "border-[var(--panel-border)] bg-[var(--chip-bg)] text-[var(--text-muted)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]";
}

function getResetButtonClass(isEnabled: boolean) {
  return isEnabled
    ? "border-[var(--panel-border)] bg-[var(--chip-bg)] text-[var(--text-primary)] hover:border-[var(--text-primary)]"
    : "border-[var(--panel-border)] bg-[var(--chip-bg)] text-[var(--text-muted)] opacity-60";
}

function getMilestonePopoverPosition(anchorRect: DOMRect) {
  const width = 256;
  const viewportPadding = 16;

  return {
    left: Math.max(
      viewportPadding,
      Math.min(anchorRect.right - width, window.innerWidth - width - viewportPadding),
    ),
    top: anchorRect.bottom + 6,
    width,
  };
}

export function ControlsBar({
  query,
  onQueryChange,
  activePreset,
  activeFilterCount,
  availableCategories,
  categories,
  onCategoryToggle,
  availableMilestoneTypes,
  visibleMilestoneTypes,
  onMilestoneToggle,
  onPresetSelect,
  hasActiveFilters,
  onClearFilters,
  theme,
  onThemeToggle,
}: ControlsBarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const desktopFiltersButtonRef = useRef<HTMLButtonElement>(null);
  const mobileFiltersButtonRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverPanelRef = useRef<HTMLDivElement>(null);
  const milestonePopoverId = useId();
  const [popoverPosition, setPopoverPosition] = useState<{
    left: number;
    top: number;
    width: number;
  } | null>(null);

  useEffect(() => {
    function handleClickOutside(event: PointerEvent) {
      const target = event.target as Node;

      if (
        popoverPanelRef.current?.contains(target) ||
        desktopFiltersButtonRef.current?.contains(target) ||
        mobileFiltersButtonRef.current?.contains(target)
      ) {
        return;
      }

      setFiltersOpen(false);
    }

    if (filtersOpen) {
      document.addEventListener("pointerdown", handleClickOutside);
    }

    return () => document.removeEventListener("pointerdown", handleClickOutside);
  }, [filtersOpen]);

  useEffect(() => {
    function handleClickOutside(event: PointerEvent) {
      const target = event.target as Node;

      if (
        menuPanelRef.current?.contains(target) ||
        menuButtonRef.current?.contains(target)
      ) {
        return;
      }

      setMenuOpen(false);
    }

    if (menuOpen) {
      document.addEventListener("pointerdown", handleClickOutside);
    }

    return () => document.removeEventListener("pointerdown", handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    if (!filtersOpen) {
      return;
    }

    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      setFiltersOpen(false);
      (
        mobileFiltersButtonRef.current?.offsetParent !== null
          ? mobileFiltersButtonRef.current
          : desktopFiltersButtonRef.current
      )?.focus();
    }

    document.addEventListener("keydown", handleEscapeKey);
    return () => document.removeEventListener("keydown", handleEscapeKey);
  }, [filtersOpen]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      setMenuOpen(false);
      menuButtonRef.current?.focus();
    }

    document.addEventListener("keydown", handleEscapeKey);
    return () => document.removeEventListener("keydown", handleEscapeKey);
  }, [menuOpen]);

  useEffect(() => {
    if (!filtersOpen) {
      return;
    }

    function syncPopoverPosition() {
      const anchorButton =
        mobileFiltersButtonRef.current &&
        mobileFiltersButtonRef.current.offsetParent !== null
          ? mobileFiltersButtonRef.current
          : desktopFiltersButtonRef.current;
      const anchorRect = anchorButton?.getBoundingClientRect();

      if (!anchorRect) {
        return;
      }

      setPopoverPosition(getMilestonePopoverPosition(anchorRect));
    }

    syncPopoverPosition();
    window.addEventListener("resize", syncPopoverPosition);
    window.addEventListener("scroll", syncPopoverPosition, true);

    return () => {
      window.removeEventListener("resize", syncPopoverPosition);
      window.removeEventListener("scroll", syncPopoverPosition, true);
    };
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

  const activeMilestoneFilterCount = availableMilestoneTypes.filter(
    (type) => !visibleMilestoneTypes.has(type),
  ).length;

  return (
    <div className="sticky top-0 z-40 border-b border-[var(--panel-border)] bg-[var(--controls-bg)] px-4 py-3 md:px-6">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-2.5">
        <div className="flex items-center gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 sm:hidden">
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label="Open controls menu"
              className={`timeline-control flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border ${getControlButtonClass(
                menuOpen || hasActiveFilters || theme === "dark",
              )}`}
            >
              <MenuIcon />
            </button>
            {menuOpen ? (
              <div
                ref={menuPanelRef}
                role="menu"
                aria-label="Mobile controls menu"
                className="timeline-floating-surface absolute top-[66px] right-4 z-60 w-[min(320px,calc(100vw-2rem))] rounded-xl border border-[var(--panel-border)] p-3 shadow-lg"
              >
                <div
                  className="mb-3 flex items-center overflow-hidden rounded-lg border border-[var(--panel-border)]"
                  role="group"
                  aria-label="Range presets"
                >
                  {PRESETS.map((preset) => {
                    const isActive = activePreset === preset;

                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          onPresetSelect(preset);
                          setMenuOpen(false);
                        }}
                        aria-pressed={isActive}
                        className={`timeline-control relative h-10 flex-1 cursor-pointer border-r border-[var(--panel-border)] px-2 py-1.5 text-[11px] font-medium last:border-r-0 ${isActive ? "bg-[var(--surface-elevated)] text-[var(--text-primary)]" : "bg-[var(--chip-bg)] text-[var(--text-muted)] hover:bg-[var(--chip-active-bg)] hover:text-[var(--text-primary)]"}`}
                      >
                        {preset}
                      </button>
                    );
                  })}
                </div>
                <div
                  className="flex min-w-0 gap-1.5"
                  role="group"
                  aria-label="Quick actions"
                >
                  <button
                    ref={mobileFiltersButtonRef}
                    type="button"
                    onClick={() => {
                      setFiltersOpen((open) => !open);
                    }}
                    aria-controls={milestonePopoverId}
                    aria-expanded={filtersOpen}
                    aria-haspopup="dialog"
                    aria-label="Milestones"
                    className={`timeline-control relative flex min-h-0 min-w-0 flex-1 basis-0 cursor-pointer items-center justify-center rounded-lg border py-2 ${getControlButtonClass(
                      filtersOpen || activeMilestoneFilterCount > 0,
                    )}`}
                  >
                    <span className="relative inline-flex">
                      <FilterIcon />
                      {activeMilestoneFilterCount > 0 ? (
                        <span className="absolute -top-1.5 -right-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[var(--text-primary)] px-0.5 text-[9px] font-semibold leading-none text-[var(--page-bg)]">
                          {activeMilestoneFilterCount}
                        </span>
                      ) : null}
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={!hasActiveFilters}
                    onClick={() => {
                      onClearFilters();
                      setFiltersOpen(false);
                      setMenuOpen(false);
                    }}
                    aria-label="Reset filters"
                    className={`timeline-control flex min-h-0 min-w-0 flex-1 basis-0 items-center justify-center rounded-lg border py-2 ${getResetButtonClass(
                      hasActiveFilters,
                    )} ${hasActiveFilters ? "cursor-pointer" : "cursor-default"}`}
                  >
                    <ResetIcon />
                  </button>
                  <a
                    href="https://github.com/aprylewu/aitimeline#"
                    target="_blank"
                    rel="noopener noreferrer"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className={`timeline-control flex min-h-0 min-w-0 flex-1 basis-0 items-center justify-center rounded-lg border py-2 ${getControlButtonClass(false)}`}
                    aria-label="Open GitHub repository"
                  >
                    <GitHubIcon />
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      onThemeToggle();
                      setMenuOpen(false);
                    }}
                    aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
                    className={`timeline-control flex min-h-0 min-w-0 flex-1 basis-0 cursor-pointer items-center justify-center rounded-lg border py-2 ${getControlButtonClass(
                      theme === "dark",
                    )}`}
                  >
                    {theme === "light" ? <MoonIcon /> : <SunIcon />}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
          <div className="relative min-w-0 flex-1">
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              aria-label="Search conferences"
              placeholder="Search conferences..."
              className="timeline-control h-11 w-full rounded-lg border border-[var(--panel-border)] bg-[var(--input-bg)] px-3.5 pr-14 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            />
            {query ? (
              <button
                type="button"
                onClick={() => {
                  onQueryChange("");
                  inputRef.current?.focus();
                }}
                aria-label="Clear search"
                className="timeline-control absolute top-1/2 right-2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md border border-[var(--panel-border)] bg-[var(--chip-bg)]"
              >
                <CloseIcon />
              </button>
            ) : (
              <kbd className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded border border-[var(--panel-border)] bg-[var(--chip-bg)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)]">
                ⌘K
              </kbd>
            )}
          </div>
          <div className="hidden flex-wrap items-center gap-2 sm:flex sm:flex-nowrap">
            <div
              className="flex items-center overflow-hidden rounded-lg border border-[var(--panel-border)]"
              role="group"
              aria-label="Range presets"
            >
              {PRESETS.map((preset) => {
                const isActive = activePreset === preset;

                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => onPresetSelect(preset)}
                    aria-pressed={isActive}
                    className={`timeline-control relative h-11 cursor-pointer border-r border-[var(--panel-border)] px-3.5 py-1.5 text-[11px] font-medium last:border-r-0 focus-visible:z-10 ${isActive ? "bg-[var(--surface-elevated)] text-[var(--text-primary)]" : "bg-[var(--chip-bg)] text-[var(--text-muted)] hover:bg-[var(--chip-active-bg)] hover:text-[var(--text-primary)]"}`}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>
            <div className="relative">
              <button
                ref={desktopFiltersButtonRef}
                type="button"
                onClick={() => setFiltersOpen((open) => !open)}
                aria-controls={milestonePopoverId}
                aria-expanded={filtersOpen}
                aria-haspopup="dialog"
                className={`timeline-control flex h-11 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-[11px] font-medium ${getControlButtonClass(filtersOpen || activeMilestoneFilterCount > 0)}`}
              >
                <FilterIcon />
                Milestones
                {activeMilestoneFilterCount > 0 ? (
                  <span className="ml-0.5 rounded-full bg-[var(--text-primary)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--page-bg)]">
                    {activeMilestoneFilterCount}
                  </span>
                ) : null}
              </button>
              {filtersOpen && popoverPosition && typeof document !== "undefined"
                ? createPortal(
                    <div
                      ref={popoverPanelRef}
                      id={milestonePopoverId}
                      role="dialog"
                      aria-label="Milestone filter controls"
                      className="timeline-floating-surface fixed z-[70] rounded-xl border border-[var(--panel-border)] p-3 shadow-lg"
                      style={{
                        left: popoverPosition.left,
                        top: popoverPosition.top,
                        width: popoverPosition.width,
                      }}
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
                          Milestone types
                        </p>
                        {activeMilestoneFilterCount > 0 ? (
                          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
                            {activeMilestoneFilterCount} hidden
                          </span>
                        ) : null}
                      </div>
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
                              className={`timeline-control min-h-9 cursor-pointer rounded-full border px-3 py-1 text-xs font-medium ${getControlButtonClass(isActive)}`}
                            >
                              {MILESTONE_LABELS[milestoneType]}
                            </button>
                          );
                        })}
                      </div>
                    </div>,
                    document.body,
                  )
                : null}
            </div>
            <button
              type="button"
              disabled={!hasActiveFilters}
              onClick={() => {
                onClearFilters();
                setFiltersOpen(false);
              }}
              aria-label="Reset filters"
              className={`timeline-control flex h-11 min-w-[112px] items-center justify-center gap-1.5 rounded-lg border px-3 text-[11px] font-medium ${getResetButtonClass(
                hasActiveFilters,
              )} ${hasActiveFilters ? "cursor-pointer" : "cursor-default"}`}
            >
              Reset
              <span
                aria-hidden={!hasActiveFilters}
                className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] font-medium ${
                  hasActiveFilters
                    ? "bg-[var(--chip-active-bg)] text-[var(--text-muted)]"
                    : "invisible bg-transparent text-transparent"
                }`}
              >
                {activeFilterCount}
              </span>
            </button>
            <button
              type="button"
              onClick={onThemeToggle}
              aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              className={`timeline-control flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border ${getControlButtonClass(theme === "dark")}`}
            >
              {theme === "light" ? <MoonIcon /> : <SunIcon />}
            </button>
            <a
              href="https://github.com/aprylewu/aitimeline#"
              target="_blank"
              rel="noopener noreferrer"
              className={`timeline-control flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border ${getControlButtonClass(false)}`}
              aria-label="Open GitHub repository"
            >
              <GitHubIcon />
            </a>
          </div>
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
                  className={`timeline-control min-h-9 cursor-pointer rounded-full border px-3 py-1 text-xs font-medium ${getControlButtonClass(isActive)}`}
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
