"use client";

import { Fragment, memo, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { format, isAfter, isBefore, parseISO } from "date-fns";
import { ConferenceMetaColumn } from "./conference-meta-column";
import { MilestoneTooltip } from "./milestone-tooltip";
import { getPrimaryPathTypes } from "@/lib/timeline/key-path";
import {
  addMonthsInTimeZone,
  formatCurrentTimeLabel,
  getMonthKey,
  getMilestoneInstant,
  getMilestoneRange,
  getZonedMonthStart,
  resolveViewerTimeZone,
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

function getTickDates(
  range: { start: Date; end: Date },
  viewerTimeZone?: string,
) {
  const resolvedViewerTimeZone = resolveViewerTimeZone(viewerTimeZone);
  const ticks: Date[] = [];
  const lastTick = getZonedMonthStart(range.end, resolvedViewerTimeZone);
  let currentTick = getZonedMonthStart(range.start, resolvedViewerTimeZone);

  while (currentTick.getTime() <= lastTick.getTime()) {
    ticks.push(currentTick);

    if (
      getMonthKey(currentTick, resolvedViewerTimeZone) ===
      getMonthKey(lastTick, resolvedViewerTimeZone)
    ) {
      break;
    }

    currentTick = addMonthsInTimeZone(
      currentTick,
      1,
      resolvedViewerTimeZone,
    );
  }

  return ticks;
}

function formatTickLabel(date: Date, viewerTimeZone?: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: resolveViewerTimeZone(viewerTimeZone),
    month: "short",
    year: "numeric",
  }).format(date);
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

function getVisibleTickIndices(tickCount: number, axisWidth: number) {
  if (tickCount <= 0) {
    return [];
  }

  const safeAxisWidth = Math.max(980, axisWidth);
  const minLabelSpacing = 104;
  const maxVisibleTicks = Math.max(
    2,
    Math.floor(safeAxisWidth / minLabelSpacing),
  );
  const step = Math.max(1, Math.ceil(tickCount / maxVisibleTicks));
  const visibleIndices: number[] = [];

  for (let index = 0; index < tickCount; index += step) {
    visibleIndices.push(index);
  }

  const lastTickIndex = tickCount - 1;
  const previousVisibleIndex = visibleIndices[visibleIndices.length - 1];

  if (previousVisibleIndex !== lastTickIndex) {
    if (
      visibleIndices.length > 1 &&
      lastTickIndex - previousVisibleIndex < step
    ) {
      visibleIndices[visibleIndices.length - 1] = lastTickIndex;
    } else {
      visibleIndices.push(lastTickIndex);
    }
  }

  return visibleIndices;
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
  expanded,
}: {
  conference: Conference;
  viewerTimeZone?: string;
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
            {getConferenceSummary(conference, viewerTimeZone)}
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
      {conference.detailNote ? (
        <p
          data-testid={`conference-detail-note-${conference.id}`}
          className="rounded-2xl border border-[var(--panel-border)] bg-[var(--chip-bg)] px-3 py-2 text-[11px] leading-5 text-[var(--text-muted)]"
        >
          {conference.detailNote}
        </p>
      ) : null}
    </div>
  );
}

function getDetailRowStateClass(isExpanded: boolean) {
  return isExpanded
    ? "border-[var(--panel-border)] bg-[var(--surface-bg)]/60"
    : "pointer-events-none border-transparent bg-transparent";
}

function getDetailPanelClass(isExpanded: boolean) {
  return isExpanded ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0";
}

function getDetailMetaCellClass(isExpanded: boolean) {
  return isExpanded
    ? "border-[var(--panel-border)] bg-[var(--surface-bg)]/60 opacity-100"
    : "pointer-events-none border-transparent bg-transparent opacity-0";
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
  const detailRowRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const hasInitializedHeightRef = useRef(false);

  useEffect(() => {
    const detailRowNode = detailRowRef.current;
    const contentNode = contentRef.current;

    if (!detailRowNode || !contentNode) {
      return;
    }

    const measuredHeight = contentNode.scrollHeight;

    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (expanded) {
      animationFrameRef.current = window.requestAnimationFrame(() => {
        detailRowNode.style.height = `${contentNode.scrollHeight}px`;
        animationFrameRef.current = null;
      });

      return;
    }

    detailRowNode.style.height = `${measuredHeight}px`;
    animationFrameRef.current = window.requestAnimationFrame(() => {
      detailRowNode.style.height = "0px";
      animationFrameRef.current = null;
    });

    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [expanded]);

  useEffect(() => {
    if (!expanded) {
      return;
    }

    const detailRowNode = detailRowRef.current;
    const contentNode = contentRef.current;

    if (!detailRowNode || !contentNode) {
      return;
    }

    const updateHeight = () => {
      detailRowNode.style.height = `${contentNode.scrollHeight}px`;
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
  }, [expanded]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <>
      <div
        data-testid={`conference-detail-meta-${conference.id}`}
        aria-hidden={!expanded}
        className={`timeline-meta-cell sticky left-0 z-10 border-b transition-[opacity,background-color,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${getDetailMetaCellClass(expanded)}`}
      />
      <div
        id={`conference-detail-row-${conference.id}`}
        data-testid={`conference-detail-row-${conference.id}`}
        data-expanded={String(expanded)}
        aria-hidden={!expanded}
        ref={(node) => {
          detailRowRef.current = node;

          if (node && !hasInitializedHeightRef.current && !expanded) {
            node.style.height = "0px";
            hasInitializedHeightRef.current = true;
          }
        }}
        className={`conference-inline-row relative z-20 border-b transition-[height,background-color,border-color] duration-280 ease-[cubic-bezier(0.22,1,0.36,1)] ${getDetailRowStateClass(expanded)}`}
      >
        <div
          ref={contentRef}
          data-testid={`conference-detail-content-${conference.id}`}
          className="px-4 py-2.5"
        >
          <div
            data-testid={`conference-detail-panel-${conference.id}`}
            className={`conference-inline-row-inner sticky left-[196px] z-20 max-w-[44rem] transition-[opacity,transform] duration-220 ease-[cubic-bezier(0.22,1,0.36,1)] ${getDetailPanelClass(expanded)}`}
          >
            <ConferenceDetailStrip
              conference={conference}
              viewerTimeZone={viewerTimeZone}
              expanded={expanded}
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
  now: Date;
  tone: TimelineTone;
  viewerTimeZone?: string;
}

const TimelineMarker = memo(function TimelineMarker({
  conference,
  isPrimaryPath,
  left,
  milestone,
  now,
  tone,
  viewerTimeZone,
}: TimelineMarkerProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipAnchor, setTooltipAnchor] = useState<{
    left: number;
    top: number;
    width: number;
  } | null>(null);
  const markerRef = useRef<HTMLButtonElement>(null);
  const markerSurfaceRef = useRef<HTMLSpanElement>(null);
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
      const rect = markerSurfaceRef.current?.getBoundingClientRect();

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
      className={`timeline-marker absolute top-[16px] flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full ${
        isHovered ? "z-30" : ""
      }`}
      style={markerStyle}
    >
      <span
        ref={markerSurfaceRef}
        className={`timeline-marker-surface absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--panel-border)] bg-[var(--surface-bg)] ${
          isPrimaryPath ? "h-5 w-5" : "h-3.5 w-3.5"
        }`}
      >
        <span
          className={`timeline-marker-dot absolute rounded-full ${getToneClass(
            tone,
            "marker",
          )} ${
            isPrimaryPath ? "inset-[3px]" : "inset-[2px] opacity-50"
          } ${isHovered ? "scale-110" : "scale-100"}`}
        />
      </span>
      {isHovered && tooltipAnchor ? (
        <MilestoneTooltip
          anchorRect={tooltipAnchor}
          conference={conference}
          milestone={milestone}
          now={now}
          viewerTimeZone={viewerTimeZone}
        />
      ) : null}
    </button>
  );
});

interface TimelineConferenceRowProps {
  conference: Conference;
  now: Date;
  visibleMilestoneTypes: Set<MilestoneType>;
  visibleRange: {
    start: Date;
    end: Date;
  };
  viewerTimeZone?: string;
}

const TimelineConferenceRow = memo(function TimelineConferenceRow({
  conference,
  now,
  visibleMilestoneTypes,
  visibleRange,
  viewerTimeZone,
}: TimelineConferenceRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTriggerHovered, setIsTriggerHovered] = useState(false);
  const [hoverCooldown, setHoverCooldown] = useState(false);
  const hoverRestoreTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const triggerRef = useRef<HTMLButtonElement | null>(null);
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

  useEffect(() => {
    return () => {
      if (hoverRestoreTimeoutRef.current) {
        clearTimeout(hoverRestoreTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Fragment>
      <div
        className="timeline-meta-cell relative sticky left-0 z-10 border-b border-[var(--panel-border)] bg-[var(--surface-elevated)] px-2.5 py-2 md:px-3.5"
      >
        <button
          ref={triggerRef}
          type="button"
          data-testid={`conference-trigger-${conference.id}`}
          aria-controls={`conference-detail-row-${conference.id}`}
          aria-expanded={isExpanded}
          onMouseEnter={() => {
            if (!hoverCooldown) {
              setIsTriggerHovered(true);
            }
          }}
          onMouseLeave={() => {
            setIsTriggerHovered(false);
          }}
          onFocus={() => {
            if (!hoverCooldown) {
              setIsTriggerHovered(true);
            }
          }}
          onBlur={() => {
            setIsTriggerHovered(false);
          }}
          onClick={() => {
            setIsExpanded((current) => !current);
            setIsTriggerHovered(false);
            setHoverCooldown(true);

            if (hoverRestoreTimeoutRef.current) {
              clearTimeout(hoverRestoreTimeoutRef.current);
            }

            hoverRestoreTimeoutRef.current = setTimeout(() => {
              setHoverCooldown(false);

              if (triggerRef.current?.matches(":hover")) {
                setIsTriggerHovered(true);
              }

              hoverRestoreTimeoutRef.current = null;
            }, 180);
          }}
          className={`conference-trigger ${
            isExpanded
              ? "conference-trigger--expanded"
              : "conference-trigger--collapsed"
          } ${
            hoverCooldown ? "conference-trigger--hover-cooldown" : ""
          } ${
            isTriggerHovered ? "conference-trigger--hovered" : ""
          } -mx-2 flex min-h-11 w-[calc(100%+1rem)] cursor-pointer items-center rounded-lg border border-transparent px-2 py-1.5 text-left outline-none transition-[border-color,background-color,box-shadow,color] duration-150`}
        >
          <ConferenceMetaColumn
            conference={conference}
            compact
            expanded={isExpanded}
            hovered={isTriggerHovered}
          />
        </button>
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
              now={now}
              tone={getMilestoneTone(milestone.type)}
              viewerTimeZone={viewerTimeZone}
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
  const ticks = useMemo(
    () => getTickDates(visibleRange, viewerTimeZone),
    [viewerTimeZone, visibleRange],
  );
  const tickPositions = useMemo(
    () => ticks.map((tick) => getPositionPercent(tick, visibleRange)),
    [ticks, visibleRange],
  );
  const visibleTickIndices = useMemo(
    () => getVisibleTickIndices(ticks.length, width ?? 980),
    [ticks.length, width],
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
  const todayLabel = useMemo(
    () => formatCurrentTimeLabel(now, viewerTimeZone),
    [now, viewerTimeZone],
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
            {visibleTickIndices.map((index) => {
              const tick = ticks[index]!;

              return (
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
                  {formatTickLabel(tick, viewerTimeZone)}
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
              <div className="timeline-section-label sticky left-0 z-10 border-b border-[var(--panel-border)] bg-[var(--surface-elevated)] px-3 py-2 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)] md:px-4">
                {section.label}
              </div>
              <div className="timeline-section-divider border-b border-[var(--panel-border)]" />
              {section.conferences.map((conference) => (
                <TimelineConferenceRow
                  key={conference.id}
                  conference={conference}
                  now={now}
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
              {todayLabel}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
});
