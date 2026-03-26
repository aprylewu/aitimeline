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
    <div className="sticky top-0 z-20 border-b border-[var(--panel-border)] bg-[var(--controls-bg)] px-4 py-3 backdrop-blur-xl md:px-6">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search conferences"
            className="min-w-64 flex-1 rounded-full border border-[var(--panel-border)] bg-[var(--input-bg)] px-4 py-2 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)]"
          />
          <button
            type="button"
            onClick={onThemeToggle}
            className="cursor-pointer rounded-full border border-[var(--panel-border)] bg-[var(--chip-bg)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
          >
            {theme === "light" ? "Dark mode" : "Light mode"}
          </button>
        </div>
        <div
          className="flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Range presets"
        >
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onPresetSelect(preset)}
              className="cursor-pointer rounded-full border border-[var(--panel-border)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm font-medium text-[var(--text-muted)] transition hover:border-[var(--accent-primary)] hover:text-[var(--text-primary)]"
            >
              {preset}
            </button>
          ))}
        </div>
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
      </div>
    </div>
  );
}
