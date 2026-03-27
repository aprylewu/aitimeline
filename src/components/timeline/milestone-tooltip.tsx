import { useEffect, useState } from "react";
import type { Conference, Milestone } from "@/types/conference";
import {
  formatCountdown,
  formatMilestoneDateLabel,
  getMilestoneInstant,
} from "@/lib/timeline/milestone-time";

interface MilestoneTooltipProps {
  conference: Conference;
  milestone: Milestone;
  left: number;
  now: Date;
  viewerTimeZone?: string;
}

export function MilestoneTooltip({
  conference,
  milestone,
  left,
  now,
  viewerTimeZone,
}: MilestoneTooltipProps) {
  const [currentNow, setCurrentNow] = useState(now);
  const milestoneInstant = getMilestoneInstant(milestone, viewerTimeZone);
  const countdown = formatCountdown(milestoneInstant, currentNow);

  useEffect(() => {
    setCurrentNow(now);
  }, [now]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentNow(new Date());
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <div
      data-testid="milestone-tooltip"
      className="pointer-events-none absolute top-0 left-0 z-40 -translate-x-1/2 -translate-y-[calc(100%+12px)] rounded-2xl border border-[var(--panel-border)] bg-[var(--tooltip-bg-solid)] px-4 py-3 text-left shadow-lg"
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
        {formatMilestoneDateLabel(milestone, viewerTimeZone)}
      </p>
      <p className="mt-1 text-xs font-semibold text-[var(--accent-secondary)]">
        {countdown}
      </p>
      {milestone.note ? (
        <p className="mt-1 max-w-72 text-xs leading-5 text-[var(--text-muted)]">
          {milestone.note}
        </p>
      ) : null}
    </div>
  );
}
