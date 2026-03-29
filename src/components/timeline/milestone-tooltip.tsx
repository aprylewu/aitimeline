import { createPortal } from "react-dom";
import {
  formatCountdown,
  formatMilestoneDateLabel,
  formatMilestoneSourceDateLabel,
  getMilestoneInstant,
} from "@/lib/timeline/milestone-time";
import type { Conference, Milestone } from "@/types/conference";

interface MilestoneTooltipProps {
  anchorRect: {
    left: number;
    top: number;
    width: number;
  };
  conference: Conference;
  milestone: Milestone;
  now?: Date;
  viewerTimeZone?: string;
}

export function MilestoneTooltip({
  anchorRect,
  conference,
  milestone,
  now = new Date(),
  viewerTimeZone,
}: MilestoneTooltipProps) {
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      data-testid="milestone-tooltip"
      className="timeline-floating-surface pointer-events-none fixed z-[80] max-w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-[calc(100%+10px)] rounded-lg border border-[var(--panel-border)] px-3.5 py-2.5 text-left shadow-lg"
      style={{
        left: anchorRect.left + anchorRect.width / 2,
        minWidth: "min(18rem, calc(100vw - 2rem))",
        top: anchorRect.top,
      }}
      role="tooltip"
    >
      <p className="break-words text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
        {conference.shortName}
      </p>
      <p className="mt-1 break-words text-sm font-medium text-[var(--text-primary)]">
        {milestone.label}
      </p>
      <div className="mt-1 flex flex-col gap-1">
        <p className="break-words font-mono text-[11px] leading-4 text-[var(--text-muted)]">
          {formatMilestoneSourceDateLabel(milestone, viewerTimeZone)}
        </p>
        <p className="break-words font-mono text-[11px] leading-4 text-[var(--text-muted)]">
          {formatMilestoneDateLabel(milestone, viewerTimeZone)}
        </p>
      </div>
      <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
        {formatCountdown(
          getMilestoneInstant(milestone, viewerTimeZone),
          now,
        )}
      </p>
      {milestone.note ? (
        <p className="mt-1 max-w-64 break-words text-[11px] leading-4 text-[var(--text-muted)]">
          {milestone.note}
        </p>
      ) : null}
    </div>,
    document.body,
  );
}
