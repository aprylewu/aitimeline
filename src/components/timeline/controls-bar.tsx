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
  return (
    <div className="sticky top-0 z-20 border-b border-[var(--panel-border)] bg-[var(--controls-bg)] px-4 py-3 md:px-6">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-2.5">
        <div className="flex flex-col gap-2.5 md:flex-row md:items-center">
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search conferences"
            className="min-w-48 flex-1 rounded-lg border border-[var(--panel-border)] bg-[var(--input-bg)] px-3.5 py-1.5 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)]"
          />
          <div
            className="flex items-center gap-1.5"
            role="group"
            aria-label="Range presets"
          >
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onPresetSelect(preset)}
                className="cursor-pointer rounded-md border border-[var(--panel-border)] bg-[var(--chip-bg)] px-2.5 py-1 text-sm font-medium text-[var(--text-muted)] transition hover:border-[var(--accent-primary)] hover:text-[var(--text-primary)]"
              >
                {preset}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onThemeToggle}
            className="cursor-pointer rounded-md border border-[var(--panel-border)] bg-[var(--chip-bg)] px-3 py-1 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
          >
            {theme === "light" ? "Dark mode" : "Light mode"}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
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
                  className={`cursor-pointer rounded-md px-2.5 py-1 text-sm font-medium transition ${
                    isActive
                      ? "bg-[var(--accent-primary)] text-white"
                      : "border border-[var(--panel-border)] bg-[var(--chip-bg)] text-[var(--text-muted)] hover:border-[var(--accent-primary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {CATEGORY_LABELS[category]}
                </button>
              );
            })}
          </div>
          <span className="mx-1 hidden h-4 w-px bg-[var(--panel-border)] md:inline-block" />
          <div
            className="flex flex-wrap items-center gap-1.5"
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
                  className={`cursor-pointer rounded-md px-2.5 py-1 text-sm font-medium transition ${
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
        </div>
      </div>
    </div>
  );
}
