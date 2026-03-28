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
        <p className="conference-trigger-title truncate text-[12px] font-semibold tracking-[0.01em] text-[var(--text-primary)]">
          {conference.shortName}
        </p>
        <p className="conference-trigger-year mt-0.5 text-[10px] text-[var(--text-muted)]">
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
        className="cursor-pointer text-sm font-medium tracking-tight text-[var(--text-primary)] transition hover:text-[var(--text-muted)]"
      >
        {conference.shortName}
      </a>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        {conference.title}
      </p>
      {rankingEntries.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {rankingEntries.map(([key, value]) => (
            <span
              key={key}
              className="rounded border border-[var(--panel-border)] bg-[var(--chip-bg)] px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase text-[var(--text-muted)]"
            >
              {key} {value}
            </span>
          ))}
        </div>
      ) : null}
      <p className="mt-2 text-xs text-[var(--text-muted)]">
        {conference.location}
      </p>
    </div>
  );
}
