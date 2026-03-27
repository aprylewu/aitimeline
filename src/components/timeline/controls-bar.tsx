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
  isMobileViewport: boolean;
  isMobileCompact: boolean;
  onMobileMenuExpand: () => void;
  isDesktopCollapsed: boolean;
  onDesktopMenuToggle: () => void;
}

const PRESETS = ["3M", "6M", "12M", "All"] as const;
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

function MenuIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.7"
    >
      <path d="M4 5.5h12" />
      <path d="M4 10h12" />
      <path d="M4 14.5h12" />
    </svg>
  );
}

function CollapseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
    >
      <path d="M12.5 4.5 7 10l5.5 5.5" />
    </svg>
  );
}

function ThemeIcon({ theme }: { theme: "light" | "dark" }) {
  if (theme === "light") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        className="h-4.5 w-4.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      >
        <path d="M10 2.5v2" />
        <path d="M10 15.5v2" />
        <path d="M2.5 10h2" />
        <path d="M15.5 10h2" />
        <path d="m4.7 4.7 1.4 1.4" />
        <path d="m13.9 13.9 1.4 1.4" />
        <path d="m13.9 6.1 1.4-1.4" />
        <path d="m4.7 15.3 1.4-1.4" />
        <circle cx="10" cy="10" r="3.1" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-4.5 w-4.5"
      fill="currentColor"
    >
      <path d="M13.9 2.8c-3.9.6-6.8 4-6.8 8 0 3 1.7 5.7 4.4 7a7.1 7.1 0 1 1 2.4-15Z" />
    </svg>
  );
}

function getCompactSummary(
  query: string,
  categories: Set<ConferenceCategory>,
  visibleMilestoneTypes: Set<MilestoneType>,
  availableMilestoneTypes: MilestoneType[],
) {
  const parts: string[] = [];

  if (query.trim().length > 0) {
    parts.push(`Search: ${query.trim()}`);
  }

  parts.push(
    categories.size > 0 ? `${categories.size} categories` : "All categories",
  );

  if (visibleMilestoneTypes.size === availableMilestoneTypes.length) {
    parts.push("All milestones");
  } else {
    parts.push(`${visibleMilestoneTypes.size} milestones`);
  }

  return parts.join(" · ");
}

function renderSectionLabel(label: string) {
  return (
    <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
      {label}
    </p>
  );
}

function FilterSections({
  query,
  onQueryChange,
  availableCategories,
  categories,
  onCategoryToggle,
  availableMilestoneTypes,
  visibleMilestoneTypes,
  onMilestoneToggle,
  onPresetSelect,
}: Pick<
  ControlsBarProps,
  | "query"
  | "onQueryChange"
  | "availableCategories"
  | "categories"
  | "onCategoryToggle"
  | "availableMilestoneTypes"
  | "visibleMilestoneTypes"
  | "onMilestoneToggle"
  | "onPresetSelect"
>) {
  return (
    <div className="flex flex-col gap-5">
      <section className="space-y-2.5">
        {renderSectionLabel("Search")}
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search conferences"
          className="w-full rounded-[20px] border border-[var(--panel-border)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)]"
        />
      </section>

      <section className="space-y-2.5">
        {renderSectionLabel("Range")}
        <div
          className="grid grid-cols-4 gap-2"
          role="group"
          aria-label="Range presets"
        >
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onPresetSelect(preset)}
              className="cursor-pointer rounded-full border border-[var(--panel-border)] bg-[var(--chip-bg)] px-3 py-2 text-sm font-medium text-[var(--text-muted)] transition hover:border-[var(--accent-primary)] hover:text-[var(--text-primary)]"
            >
              {preset}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-2.5">
        {renderSectionLabel("Categories")}
        <div
          className="flex flex-wrap items-center gap-2"
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
                className={`cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-[var(--accent-primary)] text-white"
                    : "border border-[var(--panel-border)] bg-[var(--chip-bg)] text-[var(--text-muted)] hover:border-[var(--accent-primary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-2.5">
        {renderSectionLabel("Milestones")}
        <div
          className="flex flex-wrap items-center gap-2"
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
                className={`cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-[var(--chip-active-bg)] text-[var(--text-primary)]"
                    : "border border-[var(--panel-border)] bg-[var(--chip-bg)] text-[var(--text-muted)] hover:border-[var(--accent-primary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {MILESTONE_LABELS[milestoneType]}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function MobileExpandedControls(props: ControlsBarProps) {
  return (
    <aside
      data-testid="timeline-menu"
      data-layout="mobile"
      data-collapsed="false"
      data-compact="false"
      className="timeline-menu-shell timeline-menu-mobile sticky top-3 z-30"
    >
      <div className="timeline-menu-mobile-panel rounded-[30px] border border-[var(--panel-border)] px-4 py-4 backdrop-blur-xl">
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--text-muted)]">
            Filters
          </p>
          <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
            Refine the visible timeline
          </h2>
          <p className="max-w-[32ch] text-sm leading-6 text-[var(--text-muted)]">
            Focus the venues, milestones, and horizon without leaving the page.
          </p>
        </div>

        <div className="mt-5">
          <FilterSections {...props} />
        </div>

        <div className="mt-5 border-t border-[var(--panel-border)] pt-4">
          <button
            type="button"
            onClick={props.onThemeToggle}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-[var(--panel-border)] bg-[var(--chip-bg)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
          >
            <ThemeIcon theme={props.theme} />
            {props.theme === "light" ? "Dark mode" : "Light mode"}
          </button>
        </div>
      </div>
    </aside>
  );
}

function MobileCompactControls({
  query,
  categories,
  visibleMilestoneTypes,
  availableMilestoneTypes,
  onMobileMenuExpand,
  theme,
  onThemeToggle,
}: Pick<
  ControlsBarProps,
  | "query"
  | "categories"
  | "visibleMilestoneTypes"
  | "availableMilestoneTypes"
  | "onMobileMenuExpand"
  | "theme"
  | "onThemeToggle"
>) {
  const compactSummary = getCompactSummary(
    query,
    categories,
    visibleMilestoneTypes,
    availableMilestoneTypes,
  );

  return (
    <div
      data-testid="timeline-menu"
      data-layout="mobile"
      data-collapsed="false"
      data-compact="true"
      className="timeline-menu-shell timeline-menu-mobile sticky top-3 z-30"
    >
      <div className="timeline-menu-mobile-panel flex items-center gap-3 rounded-[24px] border border-[var(--panel-border)] px-3 py-3">
        <button
          type="button"
          onClick={onMobileMenuExpand}
          className="shrink-0 rounded-full border border-[var(--panel-border)] bg-[var(--surface-bg)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
        >
          Filters
        </button>
        <p className="timeline-menu-summary min-w-0 flex-1 truncate text-xs font-medium text-[var(--text-muted)]">
          {compactSummary}
        </p>
        <button
          type="button"
          onClick={onThemeToggle}
          aria-label={theme === "light" ? "Dark mode" : "Light mode"}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--panel-border)] bg-[var(--chip-bg)] text-[var(--text-primary)] transition hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
        >
          <ThemeIcon theme={theme} />
        </button>
      </div>
    </div>
  );
}

function DesktopControls(props: ControlsBarProps) {
  const { isDesktopCollapsed, onDesktopMenuToggle, onThemeToggle, theme } =
    props;

  return (
    <aside
      data-testid="timeline-menu"
      data-layout="desktop"
      data-collapsed={String(isDesktopCollapsed)}
      data-compact="false"
      className={`timeline-menu-shell timeline-menu-desktop sticky top-0 hidden h-screen overflow-hidden border-r border-[var(--panel-border)] bg-[var(--surface-bg)] lg:flex ${
        isDesktopCollapsed ? "w-[78px]" : "w-[336px]"
      }`}
    >
      <div className="timeline-menu-rail flex h-full w-[78px] shrink-0 flex-col items-center justify-between border-r border-[var(--panel-border)] bg-[color-mix(in_srgb,var(--surface-bg)_92%,transparent)] px-3 py-4">
        <button
          type="button"
          aria-label={isDesktopCollapsed ? "Expand menu" : "Collapse menu"}
          onClick={onDesktopMenuToggle}
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--panel-border)] bg-[var(--chip-bg)] text-[var(--text-primary)] transition hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
        >
          {isDesktopCollapsed ? <MenuIcon /> : <CollapseIcon />}
        </button>

        {isDesktopCollapsed ? (
          <button
            type="button"
            onClick={onThemeToggle}
            aria-label={theme === "light" ? "Dark mode" : "Light mode"}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--panel-border)] bg-[var(--chip-bg)] text-[var(--text-primary)] transition hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
          >
            <ThemeIcon theme={theme} />
          </button>
        ) : (
          <div className="h-11 w-11" aria-hidden="true" />
        )}
      </div>

      <div
        className={`timeline-menu-drawer flex min-w-0 flex-1 flex-col ${
          isDesktopCollapsed
            ? "pointer-events-none translate-x-3 opacity-0"
            : "translate-x-0 opacity-100"
        }`}
      >
        <div className="flex h-full flex-col px-6 py-5">
          <div className="space-y-2 pb-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--text-muted)]">
              Filters
            </p>
            <h2 className="text-[1.15rem] font-semibold tracking-tight text-[var(--text-primary)]">
              Refine the visible timeline
            </h2>
            <p className="max-w-[30ch] text-sm leading-6 text-[var(--text-muted)]">
              Focus the venues, milestones, and horizon without leaving the
              page.
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1 pb-5">
            <FilterSections {...props} />
          </div>

          <div className="border-t border-[var(--panel-border)] pt-4">
            <button
              type="button"
              onClick={onThemeToggle}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-[var(--panel-border)] bg-[var(--chip-bg)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
            >
              <ThemeIcon theme={theme} />
              {theme === "light" ? "Dark mode" : "Light mode"}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function ControlsBar(props: ControlsBarProps) {
  if (!props.isMobileViewport) {
    return <DesktopControls {...props} />;
  }

  if (props.isMobileCompact) {
    return <MobileCompactControls {...props} />;
  }

  return <MobileExpandedControls {...props} />;
}
