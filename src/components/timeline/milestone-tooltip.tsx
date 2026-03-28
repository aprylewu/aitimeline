import { format, formatDistanceToNow, parseISO } from "date-fns";
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
  return `${start} – ${end}`;
}

function getCountdown(dateStr: string): string {
  const date = parseISO(dateStr);
  return formatDistanceToNow(date, { addSuffix: true });
}

export function MilestoneTooltip({
  conference,
  milestone,
  left,
}: MilestoneTooltipProps) {
  return (
    <div
      data-testid="milestone-tooltip"
      className="pointer-events-none absolute top-0 left-0 z-20 -translate-x-1/2 -translate-y-[calc(100%+10px)] rounded-lg border border-[var(--panel-border)] bg-[var(--tooltip-bg)] px-3.5 py-2.5 text-left shadow-md backdrop-blur-xl"
      style={{ left: `${left}%`, minWidth: "18rem" }}
      role="tooltip"
      aria-live="polite"
    >
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
        {conference.shortName}
      </p>
      <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
        {milestone.label}
      </p>
      <div className="mt-1 flex items-center gap-2">
        <span className="font-mono text-xs text-[var(--text-muted)]">
          {formatDateLabel(milestone)}
        </span>
        <span className="rounded border border-[var(--panel-border)] bg-[var(--chip-bg)] px-1 py-0.5 text-[9px] font-medium text-[var(--text-muted)]">
          {milestone.timezone}
        </span>
      </div>
      <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
        {getCountdown(milestone.dateStart)}
      </p>
      {milestone.note ? (
        <p className="mt-1 max-w-64 text-[11px] leading-4 text-[var(--text-muted)]">
          {milestone.note}
        </p>
      ) : null}
    </div>
  );
}
