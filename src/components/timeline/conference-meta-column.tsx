import type { Conference } from "@/types/conference";

interface ConferenceMetaColumnProps {
  conference: Conference;
  compact?: boolean;
  expanded?: boolean;
}

export function ConferenceMetaColumn({
  conference,
  compact = false,
  expanded = false,
}: ConferenceMetaColumnProps) {
  const rankingEntries = Object.entries(conference.rankings).filter(
    ([, value]) => value,
  );

  if (compact) {
    return (
      <div className="flex w-full items-center justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-2 whitespace-nowrap">
          <p className="conference-trigger-title text-[19px] leading-none font-semibold tracking-tight text-[var(--text-primary)]">
            {conference.shortName}
          </p>
          <p className="conference-trigger-year font-mono text-[12px] font-medium tracking-[0.04em] text-[var(--text-muted)]">
            {conference.year}
          </p>
        </div>
        <span
          aria-hidden="true"
          className={`conference-trigger-chevron inline-flex shrink-0 items-center justify-center text-[var(--text-muted)] transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        >
          <svg
            viewBox="0 0 16 16"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m3.5 6 4.5 4.5L12.5 6" />
          </svg>
        </span>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <a
        href={conference.website}
        target="_blank"
        rel="noreferrer noopener"
        className="cursor-pointer text-base font-semibold tracking-tight text-[var(--text-primary)] transition hover:text-[var(--accent-primary)]"
      >
        {conference.shortName}
      </a>
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        {conference.title}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {rankingEntries.map(([key, value]) => (
          <span
            key={key}
            className="rounded-full border border-[var(--panel-border)] bg-[var(--chip-bg)] px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]"
          >
            {key} {value}
          </span>
        ))}
      </div>
      <p className="mt-3 text-sm text-[var(--text-muted)]">
        {conference.location}
      </p>
    </div>
  );
}
