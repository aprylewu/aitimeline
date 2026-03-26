import { addMonths, subMonths } from "date-fns";

interface ControlsBarProps {
  query: string;
  onQueryChange: (value: string) => void;
  visibleRange: { start: Date; end: Date };
  onRangeChange: (value: { start: Date; end: Date }) => void;
}

const PRESETS = ["3M", "6M", "12M", "All"] as const;

export function ControlsBar({
  query,
  onQueryChange,
  visibleRange,
  onRangeChange,
}: ControlsBarProps) {
  function handlePresetClick(preset: (typeof PRESETS)[number]) {
    if (preset === "All") {
      onRangeChange({
        start: new Date("2025-01-01T00:00:00Z"),
        end: new Date("2026-12-31T00:00:00Z"),
      });
      return;
    }

    const months = Number.parseInt(preset, 10);
    const center = visibleRange.start;

    onRangeChange({
      start: subMonths(center, Math.floor(months / 3)),
      end: addMonths(center, months),
    });
  }

  return (
    <div className="sticky top-0 z-10 border-b border-black/10 bg-white/90 px-6 py-4 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search conferences"
          className="min-w-72 flex-1 rounded-full border border-black/10 px-4 py-2 text-sm outline-none transition focus:border-black/30"
        />
        <div className="flex items-center gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handlePresetClick(preset)}
              className="rounded-full border border-black/10 px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:border-black/20 hover:text-black"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
