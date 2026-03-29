import { memo } from "react";
import type { Conference } from "@/types/conference";

interface ConferenceMetaColumnProps {
  conference: Conference;
  compact?: boolean;
  expanded?: boolean;
  hovered?: boolean;
}

function getCompactRankingLabel(conference: Conference) {
  if (conference.rankings.ccf) {
    return `CCF ${conference.rankings.ccf}`;
  }

  if (conference.rankings.core) {
    return `CORE ${conference.rankings.core}`;
  }

  if (conference.rankings.thcpl) {
    return `THCPL ${conference.rankings.thcpl}`;
  }

  return null;
}

export const ConferenceMetaColumn = memo(function ConferenceMetaColumn({
  conference,
  compact = false,
  expanded = false,
  hovered = false,
}: ConferenceMetaColumnProps) {
  const rankingEntries = Object.entries(conference.rankings).filter(
    ([, value]) => value,
  );
  const compactMeta = [conference.category, getCompactRankingLabel(conference)]
    .filter(Boolean)
    .join(" · ");

  if (compact) {
    return (
      <div className="flex w-full items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="flex items-baseline gap-1.5">
            <span
              title={conference.shortName}
              className="conference-trigger-title block min-w-0 flex-1 truncate text-[11px] font-medium tracking-[0.01em] text-[var(--text-primary)] md:text-[12px]"
            >
              {conference.shortName}
            </span>
            <span className="conference-trigger-year flex-none text-[9px] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
              {conference.year}
            </span>
          </p>
          {compactMeta ? (
            <p className="mt-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
              {compactMeta}
            </p>
          ) : null}
        </div>
        <span
          data-testid={`conference-trigger-arrow-${conference.id}`}
          aria-hidden="true"
          className={`flex h-5 w-5 flex-none origin-center items-center justify-center text-[var(--text-muted)] transition-[transform,color,opacity] duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform ${
            expanded
              ? "rotate-90 scale-105 text-[var(--accent-secondary)] opacity-100"
              : hovered
                ? "rotate-0 scale-100 text-[var(--accent-secondary)] opacity-100"
                : "rotate-0 scale-95 opacity-55"
          }`}
        >
          <svg
            viewBox="0 0 16 16"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 3.5 10.5 8 6 12.5" />
          </svg>
        </span>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <p className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
        {conference.year}
        {" · "}
        {conference.category}
      </p>
      <a
        href={conference.website}
        target="_blank"
        rel="noreferrer noopener"
        className="conference-detail-link mt-1 inline-block cursor-pointer break-words rounded-sm text-sm font-medium tracking-tight text-[var(--text-primary)] hover:text-[var(--text-muted)]"
      >
        {conference.shortName}
      </a>
      <p className="mt-1 break-words text-xs text-[var(--text-muted)]">
        {conference.title}
      </p>
      {rankingEntries.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {rankingEntries.map(([key, value]) => (
            <span
              key={key}
              className="rounded-full border border-[var(--panel-border)] bg-[var(--chip-bg)] px-2 py-0.5 font-mono text-[10px] font-medium uppercase text-[var(--text-primary)]"
            >
              {key} {value}
            </span>
          ))}
        </div>
      ) : null}
      <p className="mt-2 break-words text-xs text-[var(--text-muted)]">
        {conference.location}
      </p>
    </div>
  );
});
