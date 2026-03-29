"use client";

import { Fragment, memo, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, FocusEvent as ReactFocusEvent } from "react";
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
import {
  getMilestoneInstant,
  getMilestoneRange,
} from "@/lib/timeline/milestone-time";
import { getPositionPercent } from "@/lib/timeline/positioning";
import type { Conference, Milestone, MilestoneType } from "@/types/conference";

interface TimelineSection {
  conferences: Conference[];
  id: string;
  label: string;
}

interface TimelineGridProps {
  sections: TimelineSection[];
  visibleMilestoneTypes?: Set<MilestoneType>;
  visibleRange: {
    start: Date;
    end: Date;
  };
  width?: number;
  now: Date;
  viewerTimeZone?: string;
}

type TimelineTone =
  | "conference"
  | "fullPaper"
  | "neutral"
  | "notification"
  | "rebuttal";

interface TimelineSpanMilestones {
  end: Milestone;
  start: Milestone;
}

interface RangeSegment {
  end: Milestone;
  key: string;
  start: Milestone;
  tone: TimelineTone;
}

const DEFAULT_VISIBLE_MILESTONE_TYPES = [
  "abstract",
  "fullPaper",
  "supplementary",
  "rebuttalStart",
  "rebuttalEnd",
  "notification",
  "cameraReady",
  "conferenceStart",
  "conferenceEnd",
  "workshop",
] as const satisfies readonly MilestoneType[];

function findMilestone(
  milestones: Milestone[],
  type: MilestoneType,
): Milestone | undefined {
  return milestones.find((milestone) => milestone.type === type);
}

function getOverallConferenceBoundaryMilestones(
  milestones: Milestone[],
  viewerTimeZone?: string,
) {
  const conferenceStart = findMilestone(milestones, "conferenceStart");
  const conferenceEnd = findMilestone(milestones, "conferenceEnd");
  const workshop = findMilestone(milestones, "workshop");
  const startCandidates = [conferenceStart, workshop].filter(Boolean) as Milestone[];
  const endCandidates = [conferenceEnd, workshop].filter(Boolean) as Milestone[];

  const overallStart = startCandidates.reduce<Milestone | undefined>(
    (earliest, candidate) => {
      if (!earliest) {
        return candidate;
      }

      return getMilestoneRange(candidate, viewerTimeZone).start.getTime() <
        getMilestoneRange(earliest, viewerTimeZone).start.getTime()
        ? candidate
        : earliest;
    },
    undefined,
  );

  const overallEnd = endCandidates.reduce<Milestone | undefined>(
    (latest, candidate) => {
      if (!latest) {
        return candidate;
      }

      return getMilestoneRange(candidate, viewerTimeZone).end.getTime() >
        getMilestoneRange(latest, viewerTimeZone).end.getTime()
        ? candidate
        : latest;
    },
    undefined,
  );

  return {
    start: overallStart
      ? {
          ...overallStart,
          id: `${overallStart.id}-conference-start-display`,
          type: "conferenceStart" as const,
          label: conferenceStart?.label ?? "Conference starts",
          dateStart: overallStart.dateStart,
          dateEnd: undefined,
        }
      : undefined,
    end: overallEnd
      ? {
          ...overallEnd,
          id: `${overallEnd.id}-conference-end-display`,
          type: "conferenceEnd" as const,
          label: conferenceEnd?.label ?? "Conference ends",
          dateStart: overallEnd.dateEnd ?? overallEnd.dateStart,
          dateEnd: undefined,
        }
      : undefined,
  };
}

function getTimelineSpanMilestones(
  milestones: Milestone[],
  viewerTimeZone?: string,
): TimelineSpanMilestones | null {
  if (milestones.length === 0) {
    return null;
  }

  const conferenceBoundaryMilestones = getOverallConferenceBoundaryMilestones(
    milestones,
    viewerTimeZone,
  );

  return {
    start:
      findMilestone(milestones, "abstract") ??
      findMilestone(milestones, "fullPaper") ??
      milestones[0]!,
    end:
      conferenceBoundaryMilestones.end ??
      milestones[milestones.length - 1]!,
  };
}

function getRangeSegments(
  milestones: Milestone[],
  viewerTimeZone?: string,
): RangeSegment[] {
  const rebuttalStart = findMilestone(milestones, "rebuttalStart");
  const rebuttalEnd = findMilestone(milestones, "rebuttalEnd");
  const conferenceBoundaryMilestones = getOverallConferenceBoundaryMilestones(
    milestones,
    viewerTimeZone,
  );

  return [
    rebuttalStart && rebuttalEnd
      ? {
          key: "rebuttal",
          start: rebuttalStart,
          end: rebuttalEnd,
          tone: "rebuttal",
        }
      : null,
    conferenceBoundaryMilestones.start && conferenceBoundaryMilestones.end
      ? {
          key: "conference",
          start: conferenceBoundaryMilestones.start,
          end: conferenceBoundaryMilestones.end,
          tone: "conference",
        }
      : null,
  ].filter(Boolean) as RangeSegment[];
}

function areMilestonesEquivalent(
  left: Milestone,
  right: Milestone,
  viewerTimeZone?: string,
) {
  const leftRange = getMilestoneRange(left, viewerTimeZone);
  const rightRange = getMilestoneRange(right, viewerTimeZone);

  return (
    leftRange.start.getTime() === rightRange.start.getTime() &&
    leftRange.end.getTime() === rightRange.end.getTime()
  );
}

function getRenderedMilestones(args: {
  milestones: Milestone[];
  visibleMilestoneTypes: Set<MilestoneType>;
  viewerTimeZone?: string;
}) {
  const { milestones, visibleMilestoneTypes, viewerTimeZone } = args;
  const fullPaperMilestone = findMilestone(milestones, "fullPaper");
  const conferenceBoundaryMilestones = getOverallConferenceBoundaryMilestones(
    milestones,
    viewerTimeZone,
  );
  const renderedMilestones = milestones.filter((milestone) => {
    if (
      !visibleMilestoneTypes.has(milestone.type) ||
      milestone.type === "conferenceStart" ||
      milestone.type === "conferenceEnd" ||
      milestone.type === "workshop"
    ) {
      return false;
    }

    if (
      milestone.type === "abstract" &&
      fullPaperMilestone &&
      areMilestonesEquivalent(milestone, fullPaperMilestone, viewerTimeZone)
    ) {
      return false;
    }

    return true;
  });

  if (
    visibleMilestoneTypes.has("conferenceStart") &&
    conferenceBoundaryMilestones.start
  ) {
    renderedMilestones.push(conferenceBoundaryMilestones.start);
  }

  if (
    visibleMilestoneTypes.has("conferenceEnd") &&
    conferenceBoundaryMilestones.end
  ) {
    renderedMilestones.push(conferenceBoundaryMilestones.end);
  }

  return renderedMilestones.sort(
    (left, right) =>
      getMilestoneInstant(left, viewerTimeZone).getTime() -
      getMilestoneInstant(right, viewerTimeZone).getTime(),
  );
}

function getTickDates(range: { start: Date; end: Date }) {
  return eachMonthOfInterval({
    start: startOfMonth(range.start),
    end: range.end,
  });
}

function getTickLabelTransform(index: number, tickCount: number) {
  if (index === 0) {
    return "translateX(0%)";
  }

  if (index === tickCount - 1) {
    return "translateX(-100%)";
  }

  return "translateX(-50%)";
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

function getMarkerGlow(tone: TimelineTone) {
  if (tone === "fullPaper") {
    return "color-mix(in srgb, var(--timeline-full-paper) 20%, transparent)";
  }

  if (tone === "notification") {
    return "color-mix(in srgb, var(--timeline-notification) 20%, transparent)";
  }

  if (tone === "rebuttal") {
    return "color-mix(in srgb, var(--timeline-rebuttal) 20%, transparent)";
  }

  if (tone === "conference") {
    return "color-mix(in srgb, var(--timeline-conference) 20%, transparent)";
  }

  return "var(--grid-glow)";
}

function isWithinVisibleRange(value: Date, range: { start: Date; end: Date }) {
  return !isBefore(value, range.start) && !isAfter(value, range.end);
}

function isWithinRenderWindow(value: Date, range: { start: Date; end: Date }) {
  return (
    value.getTime() >= range.start.getTime() &&
    value.getTime() <= range.end.getTime()
  );
}

function clipTimelineSpan(
  start: Date,
  end: Date,
  range: { start: Date; end: Date },
) {
  const clippedStart = isBefore(start, range.start) ? range.start : start;
  const clippedEnd = isAfter(end, range.end) ? range.end : end;

  if (clippedEnd.getTime() <= clippedStart.getTime()) {
    return null;
  }

  return {
    start: clippedStart,
    end: clippedEnd,
  };
}

function formatConferenceDateRange(
  milestones: Milestone[],
  viewerTimeZone?: string,
) {
  const conferenceBoundaryMilestones = getOverallConferenceBoundaryMilestones(
    milestones,
    viewerTimeZone,
  );
  const startDateLabel = conferenceBoundaryMilestones.start?.dateStart;
  const endDateLabel = conferenceBoundaryMilestones.end?.dateStart;

  if (!startDateLabel && !endDateLabel) {
    return "TBA";
  }

  if (startDateLabel && !endDateLabel) {
    return format(parseISO(startDateLabel), "MMM d, yyyy");
  }

  if (!startDateLabel && endDateLabel) {
    return format(parseISO(endDateLabel), "MMM d, yyyy");
  }

  const startDate = parseISO(startDateLabel!);
  const endDate = parseISO(endDateLabel!);

  if (format(startDate, "yyyy-MM-dd") === format(endDate, "yyyy-MM-dd")) {
    return format(startDate, "MMM d, yyyy");
  }

  if (format(startDate, "yyyy") === format(endDate, "yyyy")) {
    if (format(startDate, "MMM") === format(endDate, "MMM")) {
      return `${format(startDate, "MMM d")}-${format(endDate, "d, yyyy")}`;
    }

    return `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`;
  }

  return `${format(startDate, "MMM d, yyyy")} - ${format(endDate, "MMM d, yyyy")}`;
}

function getConferenceSummary(
  conference: Conference,
  viewerTimeZone?: string,
) {
  const dateLabel = formatConferenceDateRange(
    conference.milestones,
    viewerTimeZone,
  );

  return dateLabel === "TBA"
    ? `Dates TBA, ${conference.location}`
    : `${dateLabel}, ${conference.location}`;
}

function getRankingEntries(conference: Conference) {
  return Object.entries(conference.rankings).filter(([, value]) => value);
}

function ConferenceDetailStrip({
  conference,
  viewerTimeZone,
}: {
  conference: Conference;
  viewerTimeZone?: string;
}) {
  const rankingEntries = getRankingEntries(conference);

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-[var(--panel-border)] bg-[var(--surface-bg)] px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
            {conference.title}
          </p>
          <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
            {getConferenceSummary(conference, viewerTimeZone)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={conference.website}
            target="_blank"
            rel="noreferrer noopener"
            className="rounded-full border border-[var(--panel-border)] bg-[var(--chip-bg)] px-3 py-1 text-[11px] font-medium text-[var(--text-primary)] hover:border-[var(--text-primary)]"
          >
            Website
          </a>
          {conference.cfpUrl ? (
            <a
              href={conference.cfpUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="rounded-full border border-[var(--panel-border)] bg-[var(--chip-bg)] px-3 py-1 text-[11px] font-medium text-[var(--text-primary)] hover:border-[var(--text-primary)]"
            >
              Call for papers
            </a>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-full border border-[var(--panel-border)] bg-[var(--chip-bg)] px-2 py-0.5 font-mono text-[10px] font-medium uppercase text-[var(--text-primary)]">
          {conference.category}
        </span>
        {rankingEntries.map(([key, value]) => (
          <span
            key={`${conference.id}-${key}`}
            className="rounded-full border border-[var(--panel-border)] bg-[var(--chip-bg)] px-2 py-0.5 font-mono text-[10px] font-medium uppercase text-[var(--text-primary)]"
          >
            {key} {value}
          </span>
        ))}
      </div>
      {conference.detailNote ? (
        <p className="text-xs leading-5 text-[var(--text-muted)]">
          {conference.detailNote}
        </p>
      ) : null}
    </div>
  );
}

function ConferenceDetailRow({
  conference,
  expanded,
  viewerTimeZone,
}: {
  conference: Conference;
  expanded: boolean;
  viewerTimeZone?: string;
}) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    const contentNode = contentRef.current;

    if (!contentNode) {
      return;
    }

    const updateHeight = () => {
      setContentHeight(contentNode.scrollHeight);
    };

    updateHeight();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateHeight);

      return () => {
        window.removeEventListener("resize", updateHeight);
      };
    }

    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });

    resizeObserver.observe(contentNode);

    return () => {
      resizeObserver.disconnect();
    };
  }, [conference.id, expanded]);

  return (
    <>
      <div
        data-testid={`conference-detail-meta-${conference.id}`}
        aria-hidden={!expanded}
        className={`timeline-meta-cell sticky left-0 z-20 transition-[opacity,background-color,border-color] duration-200 ${
          expanded
            ? "border-b border-[var(--panel-border)] bg-[var(--surface-elevated)] opacity-100"
            : "pointer-events-none h-0 border-b-0 bg-transparent p-0 opacity-0"
        }`}
      />
      <div
        id={`conference-detail-row-${conference.id}`}
        data-testid={`conference-detail-row-${conference.id}`}
        aria-hidden={!expanded}
        className={`conference-inline-row overflow-hidden transition-[max-height,opacity,background-color,border-color] duration-200 ${
          expanded
            ? "border-b border-[var(--panel-border)] bg-[var(--surface-bg)]/60 opacity-100"
            : "border-b-0 bg-transparent opacity-0"
        }`}
        style={{
          maxHeight: expanded ? `${Math.max(contentHeight, 320)}px` : "0px",
        }}
      >
        <div
          ref={contentRef}
          data-testid={`conference-detail-content-${conference.id}`}
          className="px-4 py-3"
        >
          <div
            data-testid={`conference-detail-panel-${conference.id}`}
            className="sticky max-w-[44rem]"
            style={{ left: "calc(var(--timeline-meta-width) + 1rem)" }}
          >
            <ConferenceDetailStrip
              conference={conference}
              viewerTimeZone={viewerTimeZone}
            />
          </div>
        </div>
      </div>
    </>
  );
}

interface TimelineMarkerProps {
  conference: Conference;
  isPrimaryPath: boolean;
  left: number;
  milestone: Milestone;
  tone: TimelineTone;
}

const TimelineMarker = memo(function TimelineMarker({
  conference,
  isPrimaryPath,
  left,
  milestone,
  tone,
}: TimelineMarkerProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipAnchor, setTooltipAnchor] = useState<{
    left: number;
    top: number;
    width: number;
  } | null>(null);
  const markerRef = useRef<HTMLButtonElement>(null);
  const markerStyle = useMemo(
    () =>
      ({
        left: `${left}%`,
        "--marker-glow": getMarkerGlow(tone),
      }) as CSSProperties,
    [left, tone],
  );

  useEffect(() => {
    if (!isHovered) {
      return;
    }

    const syncTooltipAnchor = () => {
      const rect = markerRef.current?.getBoundingClientRect();

      if (!rect) {
        return;
      }

      setTooltipAnchor({
        left: rect.left,
        top: rect.top,
        width: rect.width,
      });
    };

    syncTooltipAnchor();
    window.addEventListener("resize", syncTooltipAnchor);
    window.addEventListener("scroll", syncTooltipAnchor, true);

    return () => {
      window.removeEventListener("resize", syncTooltipAnchor);
      window.removeEventListener("scroll", syncTooltipAnchor, true);
    };
  }, [isHovered]);

  return (
    <button
      ref={markerRef}
      type="button"
      aria-label={milestone.label}
      data-primary-path={String(isPrimaryPath)}
      data-tone={tone}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      className={`timeline-marker absolute rounded-full border border-[var(--panel-border)] bg-[var(--surface-bg)] ${
        isHovered ? "z-30" : ""
      } ${
        isPrimaryPath
          ? "top-[22px] h-5 w-5 -translate-x-1/2"
          : "top-[25px] h-3.5 w-3.5 -translate-x-1/2"
      }`}
      style={markerStyle}
    >
      <span
        className={`absolute rounded-full ${getToneClass(tone, "marker")} ${
          isPrimaryPath ? "inset-[3px]" : "inset-[2px] opacity-50"
        }`}
      />
      {isHovered && tooltipAnchor ? (
        <MilestoneTooltip
          anchorRect={tooltipAnchor}
          conference={conference}
          milestone={milestone}
        />
      ) : null}
    </button>
  );
});

interface TimelineConferenceRowProps {
  conference: Conference;
  visibleMilestoneTypes: Set<MilestoneType>;
  visibleRange: {
    start: Date;
    end: Date;
  };
  viewerTimeZone?: string;
}

const TimelineConferenceRow = memo(function TimelineConferenceRow({
  conference,
  visibleMilestoneTypes,
  visibleRange,
  viewerTimeZone,
}: TimelineConferenceRowProps) {
  const [showConferenceDetails, setShowConferenceDetails] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const detailCardId = `${conference.id}-detail-card`;
  const primaryPathTypes = useMemo(
    () => new Set(getPrimaryPathTypes(conference.milestones)),
    [conference.milestones],
  );
  const timelineSpan = useMemo(
    () => getTimelineSpanMilestones(conference.milestones, viewerTimeZone),
    [conference.milestones, viewerTimeZone],
  );
  const rangeSegments = useMemo(
    () => getRangeSegments(conference.milestones, viewerTimeZone),
    [conference.milestones, viewerTimeZone],
  );
  const renderedMilestones = useMemo(
    () =>
      getRenderedMilestones({
        milestones: conference.milestones,
        visibleMilestoneTypes,
        viewerTimeZone,
      }),
    [conference.milestones, viewerTimeZone, visibleMilestoneTypes],
  );
  const clippedPrimaryPath = useMemo(() => {
    if (!timelineSpan) {
      return null;
    }

    const clippedSpan = clipTimelineSpan(
      getMilestoneInstant(timelineSpan.start, viewerTimeZone),
      getMilestoneInstant(timelineSpan.end, viewerTimeZone),
      visibleRange,
    );

    if (!clippedSpan) {
      return null;
    }

    const left = getPositionPercent(clippedSpan.start, visibleRange);
    const right = getPositionPercent(clippedSpan.end, visibleRange);

    if (right <= left) {
      return null;
    }

    return {
      endType: timelineSpan.end.type,
      left,
      startType: timelineSpan.start.type,
      width: Math.max(0.75, right - left),
    };
  }, [timelineSpan, viewerTimeZone, visibleRange]);

  function handleMetaBlur(event: ReactFocusEvent<HTMLDivElement>) {
    const nextTarget = event.relatedTarget;

    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
      return;
    }

    setShowConferenceDetails(false);
  }

  return (
    <Fragment>
      <div
        className={`timeline-meta-cell relative sticky left-0 border-b border-[var(--panel-border)] bg-[var(--surface-elevated)] px-2.5 py-2 md:px-3.5 ${
          showConferenceDetails ? "z-40" : "z-10"
        }`}
        onMouseEnter={() => setShowConferenceDetails(true)}
        onMouseLeave={() => setShowConferenceDetails(false)}
        onFocusCapture={() => setShowConferenceDetails(true)}
        onBlurCapture={handleMetaBlur}
      >
        <button
          type="button"
          data-testid={`conference-trigger-${conference.id}`}
          aria-controls={`conference-detail-row-${conference.id}`}
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((current) => !current)}
          className="conference-trigger -mx-2 flex min-h-11 w-[calc(100%+1rem)] cursor-pointer items-center rounded-lg px-2 py-1.5 text-left"
        >
          <ConferenceMetaColumn conference={conference} compact />
        </button>
        {showConferenceDetails ? (
          <div
            id={detailCardId}
            role="group"
            aria-label={`${conference.shortName} details`}
            data-testid={`conference-detail-card-${conference.id}`}
            className="conference-detail-card timeline-floating-surface absolute top-1/2 left-2 z-50 w-[min(20rem,calc(100vw-2.5rem))] rounded-xl border border-[var(--panel-border)] p-3.5 shadow-lg md:left-3"
          >
            <ConferenceMetaColumn conference={conference} />
          </div>
        ) : null}
      </div>
      <div className="timeline-row relative border-b border-[var(--panel-border)] px-4">
        <div className="timeline-row-grid pointer-events-none absolute inset-0" />
        <div className="absolute top-[31px] left-0 right-0 h-px bg-[var(--path-baseline)]" />
        {clippedPrimaryPath ? (
          <div
            data-testid={`primary-path-${conference.id}`}
            data-path-start={clippedPrimaryPath.startType}
            data-path-end={clippedPrimaryPath.endType}
            className="absolute top-[30px] h-[4px] rounded-full bg-[var(--path-track)]"
            style={{
              left: `${clippedPrimaryPath.left}%`,
              width: `${clippedPrimaryPath.width}%`,
            }}
          />
        ) : null}
        {rangeSegments.map((segment) => {
          if (
            !visibleMilestoneTypes.has(segment.start.type) ||
            !visibleMilestoneTypes.has(segment.end.type)
          ) {
            return null;
          }

          const clippedSegment = clipTimelineSpan(
            getMilestoneInstant(segment.start, viewerTimeZone),
            getMilestoneInstant(segment.end, viewerTimeZone),
            visibleRange,
          );

          if (!clippedSegment) {
            return null;
          }

          const left = getPositionPercent(clippedSegment.start, visibleRange);
          const right = getPositionPercent(clippedSegment.end, visibleRange);

          if (right <= left) {
            return null;
          }

          return (
            <div
              data-testid={`range-${conference.id}-${segment.key}`}
              data-tone={segment.tone}
              key={`${conference.id}-${segment.key}`}
              className={`absolute top-[30px] h-[4px] rounded-full ${getToneClass(segment.tone, "range")}`}
              style={{
                left: `${left}%`,
                width: `${right - left}%`,
              }}
            />
          );
        })}
        {renderedMilestones.map((milestone) => {
          const milestoneInstant = getMilestoneInstant(milestone, viewerTimeZone);

          if (!isWithinRenderWindow(milestoneInstant, visibleRange)) {
            return null;
          }

          return (
            <TimelineMarker
              key={milestone.id}
              conference={conference}
              isPrimaryPath={primaryPathTypes.has(milestone.type)}
              left={getPositionPercent(milestoneInstant, visibleRange)}
              milestone={milestone}
              tone={getMilestoneTone(milestone.type)}
            />
          );
        })}
      </div>
      <ConferenceDetailRow
        conference={conference}
        expanded={isExpanded}
        viewerTimeZone={viewerTimeZone}
      />
    </Fragment>
  );
});

export const TimelineGrid = memo(function TimelineGrid({
  sections,
  visibleMilestoneTypes,
  visibleRange,
  width,
  now,
  viewerTimeZone,
}: TimelineGridProps) {
  const ticks = useMemo(() => getTickDates(visibleRange), [visibleRange]);
  const tickPositions = useMemo(
    () => ticks.map((tick) => getPositionPercent(tick, visibleRange)),
    [ticks, visibleRange],
  );
  const renderedMilestoneTypes = useMemo(
    () =>
      visibleMilestoneTypes ??
      new Set<MilestoneType>(DEFAULT_VISIBLE_MILESTONE_TYPES),
    [visibleMilestoneTypes],
  );
  const todayVisible = useMemo(
    () => isWithinVisibleRange(now, visibleRange),
    [now, visibleRange],
  );
  const todayLeft = useMemo(
    () => getPositionPercent(now, visibleRange),
    [now, visibleRange],
  );

  return (
    <div
      data-testid="timeline-scroll-content"
      className="relative min-w-[980px]"
      style={width ? { width: `${width}px` } : undefined}
    >
      <div
        className="grid"
        style={{
          gridTemplateColumns: "var(--timeline-meta-width) minmax(0, 1fr)",
        }}
      >
        <div className="timeline-meta-head sticky left-0 z-10 border-b border-[var(--panel-border)] bg-[var(--surface-elevated)] px-3 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)] md:px-4">
          Venue
        </div>
        <div className="timeline-axis border-b border-[var(--panel-border)] px-4 py-3">
          <div className="timeline-axis-track">
            {ticks.map((tick, index) => (
              <div
                key={tick.toISOString()}
                className="timeline-axis-tick"
                style={{ left: `${tickPositions[index]}%` }}
              >
                <div
                  data-testid={`axis-label-${index}`}
                  className="timeline-axis-label font-mono text-[10px] font-medium text-[var(--text-muted)] md:text-[11px]"
                  style={{ transform: getTickLabelTransform(index, ticks.length) }}
                >
                  {format(tick, "MMM yyyy")}
                </div>
              </div>
            ))}
          </div>
        </div>
        {sections.map((section) => {
          if (section.conferences.length === 0) {
            return null;
          }

          return (
            <Fragment key={section.id}>
              <div className="timeline-section-label sticky left-0 z-10 border-b border-[var(--panel-border)] bg-[var(--surface-elevated)] px-3 py-2 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)] md:px-4">
                {section.label}
              </div>
              <div className="timeline-section-divider border-b border-[var(--panel-border)]" />
              {section.conferences.map((conference) => (
                <TimelineConferenceRow
                  key={conference.id}
                  conference={conference}
                  visibleMilestoneTypes={renderedMilestoneTypes}
                  visibleRange={visibleRange}
                  viewerTimeZone={viewerTimeZone}
                />
              ))}
            </Fragment>
          );
        })}
      </div>
      {todayVisible ? (
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10"
          style={{ left: "var(--timeline-meta-width)" }}
        >
          <div className="relative mx-4 h-full">
            <div
              data-testid="today-line"
              className="absolute inset-y-0 w-px"
              style={{
                left: `${todayLeft}%`,
                backgroundImage: `repeating-linear-gradient(to bottom, var(--accent-secondary) 0, var(--accent-secondary) 4px, transparent 4px, transparent 8px)`,
                opacity: 0.5,
              }}
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
});
