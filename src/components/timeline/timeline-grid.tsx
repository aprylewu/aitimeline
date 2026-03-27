"use client";

import { Fragment, useState } from "react";
import {
  eachMonthOfInterval,
  format,
  isAfter,
  isBefore,
  parseISO,
  startOfMonth,
} from "date-fns";
import { ConferenceMetaColumn } from "./conference-meta-column";
import { MilestoneTooltip } from "./milestone-tooltip";
import { getPrimaryPathTypes } from "@/lib/timeline/key-path";
import { getPositionPercent } from "@/lib/timeline/positioning";
import type { Conference, Milestone, MilestoneType } from "@/types/conference";

interface TimelineGridProps {
  sections: Array<{
    conferences: Conference[];
    id: string;
    label: string;
  }>;
  visibleRange: {
    start: Date;
    end: Date;
  };
  now: Date;
}

interface HoveredMilestone {
  conferenceId: string;
  milestone: Milestone;
}

interface RangeSegment {
  end: string;
  key: string;
  start: string;
  tone: TimelineTone;
}

type TimelineTone =
  | "conference"
  | "fullPaper"
  | "neutral"
  | "notification"
  | "rebuttal";

function findMilestone(
  milestones: Milestone[],
  type: MilestoneType,
): Milestone | undefined {
  return milestones.find((milestone) => milestone.type === type);
}

function getPrimaryPathMilestones(milestones: Milestone[]) {
  return getPrimaryPathTypes(milestones)
    .map((type) => findMilestone(milestones, type))
    .filter(Boolean) as Milestone[];
}

function getRangeSegments(milestones: Milestone[]): RangeSegment[] {
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
          tone: "rebuttal" as TimelineTone,
        }
      : null,
    conferenceStart && conferenceEnd
      ? {
          key: "conference",
          start: conferenceStart.dateStart,
          end: conferenceEnd.dateStart,
          tone: "conference" as TimelineTone,
        }
      : null,
  ].filter(Boolean) as RangeSegment[];
}

function getTickDates(range: { start: Date; end: Date }) {
  return eachMonthOfInterval({
    start: startOfMonth(range.start),
    end: range.end,
  });
}

function getMilestoneTone(type: MilestoneType): TimelineTone {
  if (type === "fullPaper") {
    return "fullPaper";
  }

  if (type === "rebuttalStart" || type === "rebuttalEnd") {
    return "rebuttal";
  }

  if (type === "notification") {
    return "notification";
  }

  if (type === "conferenceStart" || type === "conferenceEnd") {
    return "conference";
  }

  return "neutral";
}

function getToneClass(tone: TimelineTone, variant: "marker" | "range") {
  if (variant === "range") {
    if (tone === "rebuttal") {
      return "bg-[var(--timeline-rebuttal-soft)]";
    }

    if (tone === "conference") {
      return "bg-[var(--timeline-conference-soft)]";
    }

    return "bg-[var(--timeline-neutral-soft)]";
  }

  if (tone === "fullPaper") {
    return "border-[var(--timeline-full-paper)] bg-[var(--timeline-full-paper)]";
  }

  if (tone === "notification") {
    return "border-[var(--timeline-notification)] bg-[var(--timeline-notification)]";
  }

  if (tone === "rebuttal") {
    return "border-[var(--timeline-rebuttal)] bg-[var(--timeline-rebuttal)]";
  }

  if (tone === "conference") {
    return "border-[var(--timeline-conference)] bg-[var(--timeline-conference)]";
  }

  return "border-[var(--timeline-neutral)] bg-[var(--timeline-neutral)]";
}

function isWithinVisibleRange(value: Date, range: { start: Date; end: Date }) {
  return !isBefore(value, range.start) && !isAfter(value, range.end);
}

export function TimelineGrid({
  sections,
  visibleRange,
  now,
}: TimelineGridProps) {
  const [hoveredMilestone, setHoveredMilestone] =
    useState<HoveredMilestone | null>(null);
  const [hoveredConferenceId, setHoveredConferenceId] = useState<string | null>(
    null,
  );
  const ticks = getTickDates(visibleRange);
  const todayVisible = isWithinVisibleRange(now, visibleRange);
  const todayLeft = getPositionPercent(now, visibleRange);

  return (
    <div className="relative min-w-[980px]">
      <div className="grid grid-cols-[180px_minmax(0,1fr)]">
        <div className="timeline-meta-head border-b border-[var(--panel-border)] px-4 py-3 text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--text-muted)]">
          Venue
        </div>
        <div className="timeline-axis border-b border-[var(--panel-border)] px-4 py-3">
          <div className="timeline-axis-track">
            {ticks.map((tick) => {
              const left = getPositionPercent(tick, visibleRange);

              return (
                <div
                  key={tick.toISOString()}
                  className="timeline-axis-tick"
                  style={{ left: `${left}%` }}
                >
                  <div className="timeline-axis-label text-[13px] font-medium text-[var(--text-muted)]">
                    {format(tick, "MMM")}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {sections.map((section) => {
          if (section.conferences.length === 0) {
            return null;
          }

          return (
            <Fragment key={section.id}>
              <div
                className="timeline-section-label border-b border-[var(--panel-border)] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]"
              >
                {section.label}
              </div>
              <div className="timeline-section-divider border-b border-[var(--panel-border)]" />
              {section.conferences.map((conference) => {
                const primaryPathMilestones = getPrimaryPathMilestones(
                  conference.milestones,
                );
                const primaryPathTypes = new Set(
                  primaryPathMilestones.map((milestone) => milestone.type),
                );
                const firstPrimaryMilestone = primaryPathMilestones[0];
                const lastPrimaryMilestone =
                  primaryPathMilestones[primaryPathMilestones.length - 1];
                const rangeSegments = getRangeSegments(conference.milestones);
                const showConferenceDetails =
                  hoveredConferenceId === conference.id;

                return (
                  <Fragment key={conference.id}>
                    <div
                      className="timeline-meta-cell relative border-b border-[var(--panel-border)] px-4 py-2"
                      onMouseEnter={() => setHoveredConferenceId(conference.id)}
                      onMouseLeave={() => setHoveredConferenceId(null)}
                    >
                      <button
                        type="button"
                        data-testid={`conference-trigger-${conference.id}`}
                        onFocus={() => setHoveredConferenceId(conference.id)}
                        onBlur={() => setHoveredConferenceId(null)}
                        className="conference-trigger cursor-pointer text-left outline-none"
                      >
                        <ConferenceMetaColumn conference={conference} compact />
                      </button>
                      {showConferenceDetails ? (
                        <div
                          data-testid={`conference-detail-card-${conference.id}`}
                          className="conference-detail-card absolute top-1/2 left-3 z-30 w-80 rounded-xl border border-[var(--panel-border)] bg-[var(--tooltip-bg)] p-4 shadow-lg"
                        >
                          <ConferenceMetaColumn conference={conference} />
                        </div>
                      ) : null}
                    </div>
                    <div className="timeline-row border-b border-[var(--panel-border)] px-4">
                      <div className="timeline-row-grid pointer-events-none absolute inset-0" />
                      <div className="absolute top-[31px] left-0 right-0 h-[2px] bg-[var(--path-baseline)]" />
                      {firstPrimaryMilestone && lastPrimaryMilestone ? (
                        <div
                          data-testid={`primary-path-${conference.id}`}
                          data-path-start={firstPrimaryMilestone.type}
                          data-path-end={lastPrimaryMilestone.type}
                          className="absolute top-[28px] h-[8px] rounded-full bg-[var(--path-track)]"
                          style={{
                            left: `${getPositionPercent(
                              parseISO(firstPrimaryMilestone.dateStart),
                              visibleRange,
                            )}%`,
                            width: `${Math.max(
                              2,
                              getPositionPercent(
                                parseISO(lastPrimaryMilestone.dateStart),
                                visibleRange,
                              ) -
                                getPositionPercent(
                                  parseISO(firstPrimaryMilestone.dateStart),
                                  visibleRange,
                                ),
                            )}%`,
                          }}
                        />
                      ) : null}
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
                            data-testid={`range-${conference.id}-${segment.key}`}
                            data-tone={segment.tone}
                            key={`${conference.id}-${segment.key}`}
                            className={`absolute top-[28px] h-[8px] rounded-full ${getToneClass(segment.tone, "range")}`}
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
                        const tone = getMilestoneTone(milestone.type);
                        const isPrimaryPath = primaryPathTypes.has(
                          milestone.type,
                        );
                        const isHovered =
                          hoveredMilestone?.conferenceId === conference.id &&
                          hoveredMilestone.milestone.id === milestone.id;

                        return (
                          <button
                            key={milestone.id}
                            type="button"
                            aria-label={milestone.label}
                            data-primary-path={String(isPrimaryPath)}
                            data-tone={tone}
                            onMouseEnter={() =>
                              setHoveredMilestone({
                                conferenceId: conference.id,
                                milestone,
                              })
                            }
                            onMouseLeave={() => setHoveredMilestone(null)}
                            onFocus={() =>
                              setHoveredMilestone({
                                conferenceId: conference.id,
                                milestone,
                              })
                            }
                            onBlur={() => setHoveredMilestone(null)}
                            className={`timeline-marker absolute -translate-x-1/2 rounded-full border border-[var(--panel-border)] bg-[var(--surface-bg)] ${
                              isPrimaryPath
                                ? "top-[20px] h-6 w-6"
                                : "top-[24px] h-4 w-4 opacity-70"
                            }`}
                            style={{ left: `${left}%` }}
                          >
                            <span
                              className={`absolute rounded-full ${getToneClass(tone, "marker")} ${
                                isPrimaryPath ? "inset-[4px]" : "inset-[3px]"
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
                  </Fragment>
                );
              })}
            </Fragment>
          );
        })}
      </div>
      {todayVisible ? (
        <div className="pointer-events-none absolute inset-y-0 left-[180px] right-0 z-10">
          <div className="relative mx-4 h-full">
            <div
              data-testid="today-line"
              className="absolute inset-y-0 w-px bg-[var(--accent-secondary)]/70"
              style={{ left: `${todayLeft}%` }}
            />
            <span
              data-testid="today-label"
              className="timeline-today-label"
              style={{ left: `${todayLeft}%` }}
            >
              Today
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
