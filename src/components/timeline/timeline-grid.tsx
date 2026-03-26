"use client";

import { useState } from "react";
import { parseISO } from "date-fns";
import { MilestoneTooltip } from "./milestone-tooltip";
import { getPrimaryPathTypes } from "@/lib/timeline/key-path";
import { getPositionPercent } from "@/lib/timeline/positioning";
import type { Conference, Milestone, MilestoneType } from "@/types/conference";

interface TimelineGridProps {
  conferences: Conference[];
  visibleRange: {
    start: Date;
    end: Date;
  };
}

interface HoveredMilestone {
  conferenceId: string;
  milestone: Milestone;
}

function findMilestone(
  milestones: Milestone[],
  type: MilestoneType,
): Milestone | undefined {
  return milestones.find((milestone) => milestone.type === type);
}

function getRangeSegments(milestones: Milestone[]) {
  const rebuttalStart = findMilestone(milestones, "rebuttalStart");
  const rebuttalEnd = findMilestone(milestones, "rebuttalEnd");
  const conferenceStart = findMilestone(milestones, "conferenceStart");
  const conferenceEnd = findMilestone(milestones, "conferenceEnd");

  return [
    rebuttalStart && rebuttalEnd
      ? {
          key: "rebuttal",
          start: rebuttalStart.dateStart,
          end: rebuttalEnd.dateStart,
          tone: "bg-sky-200/80",
        }
      : null,
    conferenceStart && conferenceEnd
      ? {
          key: "conference",
          start: conferenceStart.dateStart,
          end: conferenceEnd.dateStart,
          tone: "bg-stone-300/90",
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    start: string;
    end: string;
    tone: string;
  }>;
}

export function TimelineGrid({ conferences, visibleRange }: TimelineGridProps) {
  const [hoveredMilestone, setHoveredMilestone] =
    useState<HoveredMilestone | null>(null);

  return (
    <div className="timeline-surface relative overflow-hidden rounded-2xl border border-black/8 px-4 py-3">
      <div className="timeline-grid-bg pointer-events-none absolute inset-0" />
      <div className="relative space-y-4">
        {conferences.map((conference) => {
          const primaryPathTypes = new Set(
            getPrimaryPathTypes(conference.milestones),
          );
          const rangeSegments = getRangeSegments(conference.milestones);

          return (
            <div
              key={conference.id}
              className="relative h-20 overflow-visible rounded-xl"
            >
              <div className="absolute top-9 left-0 right-0 h-px bg-black/10" />
              {rangeSegments.map((segment) => {
                const left = getPositionPercent(
                  parseISO(segment.start),
                  visibleRange,
                );
                const right = getPositionPercent(
                  parseISO(segment.end),
                  visibleRange,
                );

                return (
                  <div
                    key={`${conference.id}-${segment.key}`}
                    className={`absolute top-7 h-4 rounded-full ${segment.tone}`}
                    style={{
                      left: `${left}%`,
                      width: `${Math.max(1.5, right - left)}%`,
                    }}
                  />
                );
              })}
              {conference.milestones.map((milestone) => {
                const left = getPositionPercent(
                  parseISO(milestone.dateStart),
                  visibleRange,
                );
                const isPrimaryPath = primaryPathTypes.has(milestone.type);
                const isHovered =
                  hoveredMilestone?.conferenceId === conference.id &&
                  hoveredMilestone.milestone.id === milestone.id;

                return (
                  <button
                    key={milestone.id}
                    type="button"
                    aria-label={milestone.label}
                    data-primary-path={String(isPrimaryPath)}
                    onMouseEnter={() =>
                      setHoveredMilestone({ conferenceId: conference.id, milestone })
                    }
                    onMouseLeave={() => setHoveredMilestone(null)}
                    onFocus={() =>
                      setHoveredMilestone({ conferenceId: conference.id, milestone })
                    }
                    onBlur={() => setHoveredMilestone(null)}
                    className={`timeline-marker absolute top-5 h-8 w-8 -translate-x-1/2 rounded-full border ${
                      isPrimaryPath
                        ? "border-sky-500 bg-sky-500/15"
                        : "border-black/10 bg-white/90"
                    }`}
                    style={{ left: `${left}%` }}
                  >
                    <span
                      className={`absolute inset-[9px] rounded-full ${
                        isPrimaryPath ? "bg-sky-500" : "bg-neutral-500"
                      }`}
                    />
                    {isHovered ? (
                      <MilestoneTooltip
                        conference={conference}
                        milestone={milestone}
                        left={left}
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
