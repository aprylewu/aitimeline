import type { Conference } from "@/types/conference";

interface ConferenceMetaColumnProps {
  conference: Conference;
}

export function ConferenceMetaColumn({
  conference,
}: ConferenceMetaColumnProps) {
  const rankingEntries = Object.entries(conference.rankings).filter(
    ([, value]) => value,
  );

  return (
    <div className="min-w-0">
      <a
        href={conference.website}
        target="_blank"
        rel="noreferrer noopener"
        className="text-base font-semibold tracking-tight text-neutral-950 transition hover:text-black"
      >
        {conference.shortName}
      </a>
      <p className="mt-1 text-sm text-neutral-600">{conference.title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {rankingEntries.map(([key, value]) => (
          <span
            key={key}
            className="rounded-full border border-black/10 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-neutral-600"
          >
            {key} {value}
          </span>
        ))}
      </div>
      <p className="mt-3 text-sm text-neutral-500">{conference.location}</p>
    </div>
  );
}
