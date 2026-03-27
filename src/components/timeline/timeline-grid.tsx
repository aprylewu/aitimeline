"use client";

import { Fragment, useState, type ReactNode } from "react";
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

interface DetailItem {
  label: string;
  value: ReactNode;
}

interface RangeSegment {
  end: string;
  key: string;
  start: string;
  tone: TimelineTone;
  top: string;
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
          tone: "rebuttal",
          top: "top-[22px]",
        }
      : null,
    conferenceStart && conferenceEnd
      ? {
          key: "conference",
          start: conferenceStart.dateStart,
          end: conferenceEnd.dateStart,
          tone: "conference",
          top: "top-[22px]",
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

function toggleExpandedConference(current: Set<string>, conferenceId: string) {
  const next = new Set(current);

  if (next.has(conferenceId)) {
    next.delete(conferenceId);
  } else {
    next.add(conferenceId);
  }

  return next;
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
    return "border-[#16a34a] bg-[#16a34a]";
  }

  if (tone === "notification") {
    return "border-[#dc2626] bg-[#dc2626]";
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

function formatConferenceDateRange(milestones: Milestone[]) {
  const conferenceStart = findMilestone(milestones, "conferenceStart");
  const conferenceEnd = findMilestone(milestones, "conferenceEnd");

  if (!conferenceStart && !conferenceEnd) {
    return "TBA";
  }

  if (conferenceStart && !conferenceEnd) {
    return format(parseISO(conferenceStart.dateStart), "MMM d, yyyy");
  }

  if (!conferenceStart && conferenceEnd) {
    return format(parseISO(conferenceEnd.dateStart), "MMM d, yyyy");
  }

  const startLabel = format(parseISO(conferenceStart!.dateStart), "MMM d, yyyy");
  const endLabel = format(parseISO(conferenceEnd!.dateStart), "MMM d, yyyy");

  return startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`;
}

function getRankingNodes(conference: Conference) {
  const rankingEntries = Object.entries(conference.rankings).filter(
    ([, value]) => value,
  );

  if (rankingEntries.length === 0) {
    return <span className="text-sm text-[var(--text-muted)]">Unranked</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {rankingEntries.map(([key, value]) => (
        <span
          key={`${conference.id}-${key}`}
          className="rounded-full border border-[var(--panel-border)] bg-[var(--chip-bg)] px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]"
        >
          {key} {value}
        </span>
      ))}
    </div>
  );
}

function renderDetailItem({ label, value }: DetailItem) {
  return (
    <div
      key={label}
      className="rounded-2xl border border-[var(--panel-border)] bg-[var(--surface-bg)] px-4 py-3"
    >
      <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
        {label}
      </dt>
      <dd className="mt-2 text-sm leading-6 text-[var(--text-primary)]">
        {value}
      </dd>
    </div>
  );
}

function ConferenceDetailPanel({ conference }: { conference: Conference }) {
  const detailItems: DetailItem[] = [
    {
      label: "Conference rankings",
      value: getRankingNodes(conference),
    },
    {
      label: "Conference type",
      value: conference.category,
    },
    {
      label: "Conference dates",
      value: formatConferenceDateRange(conference.milestones),
    },
    {
      label: "Location",
      value: conference.location,
    },
    {
      label: "Main page",
      value: (
        <a
          href={conference.website}
          target="_blank"
          rel="noreferrer noopener"
          className="font-medium text-[var(--accent-primary)] underline decoration-[color-mix(in_srgb,var(--accent-primary)_40%,transparent)] underline-offset-4"
        >
          Visit site
        </a>
      ),
    },
  ];

  return (
    <div className="conference-inline-panel rounded-[24px] border border-[var(--panel-border)] bg-[var(--tooltip-bg)] p-4 shadow-lg backdrop-blur md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
            Conference details
          </p>
          <h3 className="mt-2 text-lg font-semibold tracking-tight text-[var(--text-primary)]">
            {conference.shortName} {conference.year}
          </h3>
          <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
            {conference.title}
          </p>
        </div>
      </div>
      <dl className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {detailItems.map(renderDetailItem)}
      </dl>
    </div>
  );
}

export function TimelineGrid({
  sections,
  visibleRange,
  now,
}: TimelineGridProps) {
  const [hoveredMilestone, setHoveredMilestone] =
    useState<HoveredMilestone | null>(null);
  const [expandedConferenceIds, setExpandedConferenceIds] = useState<Set<string>>(
    () => new Set(),
  );
  const ticks = getTickDates(visibleRange);
  const todayVisible = isWithinVisibleRange(now, visibleRange);
  const todayLeft = getPositionPercent(now, visibleRange);

  return (
    <div className="relative min-w-[980px]">
      <div className="grid grid-cols-[180px_minmax(0,1fr)]">
        <div className="timeline-meta-head border-b border-[var(--panel-border)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
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
                className="timeline-section-label border-b border-[var(--panel-border)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]"
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
                const showConferenceDetails = expandedConferenceIds.has(
                  conference.id,
                );

                return (
                  <Fragment key={conference.id}>
                    <div className="timeline-meta-cell relative border-b border-[var(--panel-border)] px-4 py-2">
                      <button
                        type="button"
                        data-testid={`conference-trigger-${conference.id}`}
                        aria-expanded={showConferenceDetails}
                        aria-controls={`conference-detail-row-${conference.id}`}
                        onClick={() =>
                          setExpandedConferenceIds((current) =>
                            toggleExpandedConference(current, conference.id),
                          )
                        }
                        className="conference-trigger w-full cursor-pointer text-left outline-none"
                      >
                        <ConferenceMetaColumn
                          conference={conference}
                          compact
                          expanded={showConferenceDetails}
                        />
                      </button>
                    </div>
                    <div className="timeline-row border-b border-[var(--panel-border)] px-4">
                      <div className="timeline-row-grid pointer-events-none absolute inset-0" />
                      <div className="absolute top-[25px] left-0 right-0 h-[2px] bg-[var(--path-baseline)]" />
                      {firstPrimaryMilestone && lastPrimaryMilestone ? (
                        <div
                          data-testid={`primary-path-${conference.id}`}
                          data-path-start={firstPrimaryMilestone.type}
                          data-path-end={lastPrimaryMilestone.type}
                          className="absolute top-[22px] h-[8px] rounded-full bg-[var(--path-track)]"
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
                            className={`absolute h-[8px] rounded-full ${getToneClass(segment.tone, "range")} ${segment.top}`}
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
                            className="timeline-marker absolute top-[14px] h-6 w-6 -translate-x-1/2 rounded-full border border-[var(--panel-border)] bg-[var(--surface-bg)]"
                            style={{ left: `${left}%` }}
                          >
                            <span
                              className={`absolute inset-[4px] rounded-full ${getToneClass(tone, "marker")}`}
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
                    {showConferenceDetails ? (
                      <div
                        id={`conference-detail-row-${conference.id}`}
                        data-testid={`conference-detail-row-${conference.id}`}
                        className="col-span-2 border-b border-[var(--panel-border)] px-4 py-4"
                      >
                        <ConferenceDetailPanel conference={conference} />
                      </div>
                    ) : null}
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
