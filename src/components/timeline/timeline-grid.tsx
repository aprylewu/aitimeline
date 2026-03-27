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

  const startDate = parseISO(conferenceStart!.dateStart);
  const endDate = parseISO(conferenceEnd!.dateStart);

  if (format(startDate, "yyyy-MM-dd") === format(endDate, "yyyy-MM-dd")) {
    return format(startDate, "MMM d, yyyy");
  }

  if (format(startDate, "yyyy") === format(endDate, "yyyy")) {
    if (format(startDate, "MMM") === format(endDate, "MMM")) {
      return `${format(startDate, "MMM d")}-${format(endDate, "d, yyyy")}`;
    }

    return `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`;
  }

  const startLabel = format(startDate, "MMM d, yyyy");
  const endLabel = format(endDate, "MMM d, yyyy");

  return startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`;
}

function getConferenceSummary(conference: Conference) {
  const dateLabel = formatConferenceDateRange(conference.milestones);

  return dateLabel === "TBA"
    ? `Dates TBA, ${conference.location}`
    : `${dateLabel}, ${conference.location}`;
}

function getRankingEntries(conference: Conference) {
  return Object.entries(conference.rankings).filter(
    ([, value]) => value,
  );
}

function ConferenceDetailStrip({
  conference,
  expanded,
}: {
  conference: Conference;
  expanded: boolean;
}) {
  const rankingEntries = getRankingEntries(conference);

  return (
    <div className="conference-inline-strip flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="min-w-0 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span
            data-testid={`conference-detail-title-${conference.id}`}
            className="text-[13px] font-medium leading-5 text-[var(--text-primary)]"
          >
            {conference.title}
          </span>
          <span
            data-testid={`conference-detail-summary-${conference.id}`}
            className="text-[12px] leading-5 text-[var(--text-muted)]"
          >
            {getConferenceSummary(conference)}
          </span>
        </div>
        {conference.cfpUrl ? (
          <a
            href={conference.cfpUrl}
            target="_blank"
            rel="noreferrer noopener"
            tabIndex={expanded ? 0 : -1}
            className="inline-flex shrink-0 items-center justify-center rounded-full border border-[var(--panel-border)] bg-[var(--surface-elevated)] px-5 py-2 text-[11px] font-semibold tracking-[0.01em] text-[var(--accent-primary)] shadow-sm transition hover:border-[var(--accent-primary)] hover:bg-[var(--chip-bg)] hover:text-[var(--text-primary)]"
          >
            Call For Papers
          </a>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] leading-5 text-[var(--text-muted)]">
        {rankingEntries.length > 0 ? (
          rankingEntries.map(([key, value]) => (
            <span
              key={`${conference.id}-${key}`}
              className="font-medium text-[var(--text-primary)]"
            >
              <span className="uppercase tracking-[0.08em] text-[var(--text-muted)]">
                {key}
              </span>{" "}
              {value}
            </span>
          ))
        ) : (
          <span className="font-medium text-[var(--text-muted)]">Unranked</span>
        )}
        <span className="font-medium uppercase tracking-[0.08em]">
          {conference.category}
        </span>
      </div>
    </div>
  );
}

function getDetailRowStateClass(isExpanded: boolean) {
  return isExpanded
    ? "grid-rows-[1fr] border-[var(--panel-border)] bg-[var(--surface-bg)]/60 px-4 py-2.5 opacity-100"
    : "grid-rows-[0fr] border-transparent bg-transparent px-4 py-0 opacity-0";
}

function getDetailRowInnerClass(isExpanded: boolean) {
  return isExpanded ? "translate-y-0" : "-translate-y-2";
}

function ConferenceDetailRow({
  conference,
  expanded,
}: {
  conference: Conference;
  expanded: boolean;
}) {
  return (
    <div
      id={`conference-detail-row-${conference.id}`}
      data-testid={`conference-detail-row-${conference.id}`}
      data-expanded={String(expanded)}
      aria-hidden={!expanded}
      className={`conference-inline-row col-span-2 grid overflow-hidden border-b transition-[grid-template-rows,opacity,padding,background-color,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${getDetailRowStateClass(expanded)}`}
    >
      <div
        className={`conference-inline-row-inner min-h-0 overflow-hidden transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${getDetailRowInnerClass(expanded)}`}
      >
        <ConferenceDetailStrip conference={conference} expanded={expanded} />
      </div>
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
                    <div className="timeline-meta-cell relative flex min-h-[56px] items-center justify-center border-b border-[var(--panel-border)] px-3 py-1.5">
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
                        className={`conference-trigger ${showConferenceDetails ? "conference-trigger--expanded" : "conference-trigger--collapsed"} flex h-full w-full items-center justify-center text-center outline-none`}
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
                    <ConferenceDetailRow
                      conference={conference}
                      expanded={showConferenceDetails}
                    />
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
