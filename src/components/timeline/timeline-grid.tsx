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
import { getPositionPercent } from "@/lib/timeline/positioning";
import type { Conference, Milestone, MilestoneType } from "@/types/conference";

interface TimelineSection {
  conferences: Conference[];
  id: string;
  label: string;
}

interface TimelineGridProps {
  sections: TimelineSection[];
  visibleRange: {
    start: Date;
    end: Date;
  };
  now: Date;
}

interface PositionedMilestone {
  isPrimaryPath: boolean;
  left: number;
  milestone: Milestone;
  markerStyle: CSSProperties;
  tone: TimelineTone;
}

interface PositionedRangeSegment {
  key: string;
  left: number;
  tone: TimelineTone;
  width: number;
}

interface PreparedConferenceLayout {
  markers: PositionedMilestone[];
  primaryPath: {
    endType: MilestoneType;
    left: number;
    startType: MilestoneType;
    width: number;
  } | null;
  rangeSegments: PositionedRangeSegment[];
}

type TimelineTone =
  | "conference"
  | "fullPaper"
  | "neutral"
  | "notification"
  | "rebuttal";

const RANGE_SEGMENT_CONFIGS = [
  {
    endType: "rebuttalEnd",
    key: "rebuttal",
    startType: "rebuttalStart",
    tone: "rebuttal",
  },
  {
    endType: "conferenceEnd",
    key: "conference",
    startType: "conferenceStart",
    tone: "conference",
  },
] as const;

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

function prepareConferenceLayout(
  conference: Conference,
  visibleRange: { start: Date; end: Date },
): PreparedConferenceLayout {
  const primaryPathTypes = new Set(getPrimaryPathTypes(conference.milestones));
  const markers = conference.milestones.map((milestone) => {
    const left = getPositionPercent(parseISO(milestone.dateStart), visibleRange);
    const tone = getMilestoneTone(milestone.type);

    return {
      isPrimaryPath: primaryPathTypes.has(milestone.type),
      left,
      milestone,
      markerStyle: {
        left: `${left}%`,
        "--marker-glow": getMarkerGlow(tone),
      } as CSSProperties,
      tone,
    };
  });
  const markersByType = new Map(
    markers.map((marker) => [marker.milestone.type, marker] as const),
  );
  const primaryMarkers = markers.filter((marker) => marker.isPrimaryPath);
  const firstPrimaryMilestone = primaryMarkers[0];
  const lastPrimaryMilestone = primaryMarkers[primaryMarkers.length - 1];
  const primaryPath =
    firstPrimaryMilestone && lastPrimaryMilestone
      ? {
          endType: lastPrimaryMilestone.milestone.type,
          left: firstPrimaryMilestone.left,
          startType: firstPrimaryMilestone.milestone.type,
          width: Math.max(2, lastPrimaryMilestone.left - firstPrimaryMilestone.left),
        }
      : null;
  const rangeSegments = RANGE_SEGMENT_CONFIGS.flatMap((config) => {
    const startMarker = markersByType.get(config.startType);
    const endMarker = markersByType.get(config.endType);

    if (!startMarker || !endMarker) {
      return [];
    }

    return [
      {
        key: config.key,
        left: startMarker.left,
        tone: config.tone,
        width: Math.max(1.5, endMarker.left - startMarker.left),
      },
    ];
  });

  return { markers, primaryPath, rangeSegments };
}

interface TimelineMarkerProps {
  conference: Conference;
  marker: PositionedMilestone;
}

const TimelineMarker = memo(function TimelineMarker({
  conference,
  marker,
}: TimelineMarkerProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipAnchor, setTooltipAnchor] = useState<{
    left: number;
    top: number;
    width: number;
  } | null>(null);
  const markerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isHovered) {
      return;
    }

    function syncTooltipAnchor() {
      const rect = markerRef.current?.getBoundingClientRect();

      if (!rect) {
        return;
      }

      setTooltipAnchor({
        left: rect.left,
        top: rect.top,
        width: rect.width,
      });
    }

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
      aria-label={marker.milestone.label}
      data-primary-path={String(marker.isPrimaryPath)}
      data-tone={marker.tone}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      className={`timeline-marker absolute rounded-full border border-[var(--panel-border)] bg-[var(--surface-bg)] ${
        isHovered ? "z-30" : ""
      } ${
        marker.isPrimaryPath
          ? "top-[22px] h-5 w-5 -translate-x-1/2"
          : "top-[25px] h-3.5 w-3.5 -translate-x-1/2"
      }`}
      style={marker.markerStyle}
    >
      <span
        className={`absolute rounded-full ${getToneClass(marker.tone, "marker")} ${
          marker.isPrimaryPath ? "inset-[3px]" : "inset-[2px] opacity-50"
        }`}
      />
      {isHovered && tooltipAnchor ? (
        <MilestoneTooltip
          anchorRect={tooltipAnchor}
          conference={conference}
          milestone={marker.milestone}
        />
      ) : null}
    </button>
  );
});

interface TimelineConferenceRowProps {
  conference: Conference;
  visibleRange: {
    start: Date;
    end: Date;
  };
}

const TimelineConferenceRow = memo(function TimelineConferenceRow({
  conference,
  visibleRange,
}: TimelineConferenceRowProps) {
  const [showConferenceDetails, setShowConferenceDetails] = useState(false);
  const detailCardId = `${conference.id}-detail-card`;
  const layout = useMemo(
    () => prepareConferenceLayout(conference, visibleRange),
    [conference, visibleRange],
  );

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
          aria-controls={detailCardId}
          aria-expanded={showConferenceDetails}
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
      <div className="timeline-row border-b border-[var(--panel-border)] px-4">
        <div className="timeline-row-grid pointer-events-none absolute inset-0" />
        <div className="absolute top-[31px] left-0 right-0 h-px bg-[var(--path-baseline)]" />
        {layout.primaryPath ? (
          <div
            data-testid={`primary-path-${conference.id}`}
            data-path-start={layout.primaryPath.startType}
            data-path-end={layout.primaryPath.endType}
            className="absolute top-[30px] h-[4px] rounded-full bg-[var(--path-track)]"
            style={{
              left: `${layout.primaryPath.left}%`,
              width: `${layout.primaryPath.width}%`,
            }}
          />
        ) : null}
        {layout.rangeSegments.map((segment) => (
          <div
            data-testid={`range-${conference.id}-${segment.key}`}
            data-tone={segment.tone}
            key={`${conference.id}-${segment.key}`}
            className={`absolute top-[30px] h-[4px] rounded-full ${getToneClass(segment.tone, "range")}`}
            style={{
              left: `${segment.left}%`,
              width: `${segment.width}%`,
            }}
          />
        ))}
        {layout.markers.map((marker) => (
          <TimelineMarker
            key={marker.milestone.id}
            conference={conference}
            marker={marker}
          />
        ))}
      </div>
    </Fragment>
  );
});

export const TimelineGrid = memo(function TimelineGrid({
  sections,
  visibleRange,
  now,
}: TimelineGridProps) {
  const ticks = useMemo(() => getTickDates(visibleRange), [visibleRange]);
  const tickPositions = useMemo(
    () => ticks.map((tick) => getPositionPercent(tick, visibleRange)),
    [ticks, visibleRange],
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
    <div className="relative min-w-[980px]">
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
                  visibleRange={visibleRange}
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
