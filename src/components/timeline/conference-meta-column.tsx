import type { Conference } from "@/types/conference";

interface ConferenceMetaColumnProps {
  conference: Conference;
  compact?: boolean;
  expanded?: boolean;
  hovered?: boolean;
}

function getCompactTitleSizeClass(shortName: string) {
  if (shortName.length <= 4) {
    return "text-[24px]";
  }

  if (shortName.length <= 6) {
    return "text-[20px]";
  }

  return "text-[18px]";
}

export function ConferenceMetaColumn({
  conference,
  compact = false,
  expanded = false,
  hovered = false,
}: ConferenceMetaColumnProps) {
  const rankingEntries = Object.entries(conference.rankings).filter(
    ([, value]) => value,
  );

  if (compact) {
    return (
      <div className="flex w-full items-center justify-center">
        <div className="flex items-center justify-center gap-2.5 text-center">
          <div className="flex min-w-0 items-baseline justify-center gap-2 whitespace-nowrap">
            <p
              className={`conference-trigger-title ${getCompactTitleSizeClass(conference.shortName)} leading-none font-semibold tracking-tight transition-colors duration-150 ${hovered ? "text-[var(--accent-primary)]" : "text-[var(--text-primary)]"}`}
            >
              {conference.shortName}
            </p>
            <p
              className={`conference-trigger-year font-mono text-[14px] leading-none font-medium transition-[color,letter-spacing] duration-150 ${hovered ? "tracking-[0.14em] text-[var(--text-primary)]" : "tracking-[0.06em] text-[var(--text-muted)]"}`}
            >
              {conference.year}
            </p>
          </div>
          <span
            aria-hidden="true"
            className={`conference-trigger-chevron inline-flex shrink-0 items-center justify-center transition-[color,transform] duration-200 ${hovered ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)]"} ${expanded ? "rotate-180" : ""}`}
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
