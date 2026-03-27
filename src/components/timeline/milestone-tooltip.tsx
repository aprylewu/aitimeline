import { format, parseISO } from "date-fns";
import type { Conference, Milestone } from "@/types/conference";

interface MilestoneTooltipProps {
  conference: Conference;
  milestone: Milestone;
  left: number;
}

function formatDateLabel(milestone: Milestone) {
  const start = format(parseISO(milestone.dateStart), "MMM d, yyyy");

  if (!milestone.dateEnd) {
    return start;
  }

  const end = format(parseISO(milestone.dateEnd), "MMM d, yyyy");
  return `${start} - ${end}`;
}

export function MilestoneTooltip({
  conference,
  milestone,
  left,
}: MilestoneTooltipProps) {
  return (
    <div
      data-testid="milestone-tooltip"
      className="pointer-events-none absolute top-0 left-0 z-20 -translate-x-1/2 -translate-y-[calc(100%+12px)] rounded-xl border border-[var(--panel-border)] bg-[var(--tooltip-bg)] px-4 py-3 text-left shadow-lg"
      style={{ left: `${left}%`, minWidth: "20rem" }}
      role="tooltip"
      aria-live="polite"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
        {conference.shortName}
      </p>
      <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
        {milestone.label}
      </p>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        {formatDateLabel(milestone)}
      </p>
      {milestone.note ? (
        <p className="mt-1 max-w-72 text-xs leading-5 text-[var(--text-muted)]">
          {milestone.note}
        </p>
      ) : null}
    </div>
  );
}
