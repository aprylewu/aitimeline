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
      className="pointer-events-none absolute top-1 left-0 z-20 -translate-x-1/2 rounded-2xl border border-black/10 bg-white/95 px-3 py-2 text-left shadow-lg backdrop-blur"
      style={{ left: `${left}%` }}
      role="tooltip"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
        {conference.shortName}
      </p>
      <p className="mt-1 text-sm font-semibold text-neutral-900">
        {milestone.label}
      </p>
      <p className="mt-1 text-xs text-neutral-500">{formatDateLabel(milestone)}</p>
      {milestone.note ? (
        <p className="mt-1 max-w-56 text-xs leading-5 text-neutral-500">
          {milestone.note}
        </p>
      ) : null}
    </div>
  );
}
