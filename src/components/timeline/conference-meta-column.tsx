import type { Conference } from "@/types/conference";

interface ConferenceMetaColumnProps {
  conference: Conference;
  compact?: boolean;
}

export function ConferenceMetaColumn({
  conference,
  compact = false,
}: ConferenceMetaColumnProps) {
  const rankingEntries = Object.entries(conference.rankings).filter(
    ([, value]) => value,
  );

  if (compact) {
    return (
      <div className="min-w-0">
        <p className="conference-trigger-title text-[11px] font-semibold tracking-[0.04em] text-[var(--text-primary)]">
          {conference.shortName}
        </p>
        <p className="conference-trigger-year mt-1 text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
          {conference.year}
        </p>
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
