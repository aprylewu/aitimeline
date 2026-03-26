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
}: ControlsBarProps) {
  return (
    <div className="sticky top-0 z-10 border-b border-black/10 bg-white/90 px-6 py-4 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3">
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search conferences"
          className="min-w-72 flex-1 rounded-full border border-black/10 px-4 py-2 text-sm outline-none transition focus:border-black/30"
        />
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
              className="rounded-full border border-black/10 px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:border-black/20 hover:text-black"
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
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-neutral-900 text-white"
                    : "border border-black/10 text-neutral-700 hover:border-black/20 hover:text-black"
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
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-stone-200 text-neutral-900"
                    : "border border-black/10 text-neutral-500 hover:border-black/20 hover:text-black"
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
