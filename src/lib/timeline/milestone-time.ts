import type { Milestone } from "@/types/conference";

const DEFAULT_VIEWER_TIME_ZONE = "UTC";
const AOE_OFFSET_SUFFIX = "-12:00";

function isValidTimeZone(value: string | null | undefined): value is string {
  if (!value) {
    return false;
  }

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

function parseDateParts(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);

  return { year, month, day };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const offsetLabel = parts.find((part) => part.type === "timeZoneName")?.value;

  if (!offsetLabel || offsetLabel === "GMT") {
    return 0;
  }

  const match = offsetLabel.match(/^GMT([+-])(\d{1,2})(?::?(\d{2}))?$/);

  if (!match) {
    return 0;
  }

  const sign = match[1] === "+" ? 1 : -1;
  const hours = Number.parseInt(match[2]!, 10);
  const minutes = Number.parseInt(match[3] ?? "0", 10);

  return sign * ((hours * 60 + minutes) * 60 * 1000);
}

function zonedEndOfDayToUtc(dateString: string, timeZone: string) {
  const { year, month, day } = parseDateParts(dateString);
  const utcGuess = new Date(
    Date.UTC(year, month - 1, day, 23, 59, 59, 999),
  );
  const offset = getTimeZoneOffsetMs(utcGuess, timeZone);

  return new Date(utcGuess.getTime() - offset);
}

export function resolveViewerTimeZone(viewerTimeZone?: string) {
  if (isValidTimeZone(viewerTimeZone)) {
    return viewerTimeZone;
  }

  const browserTimeZone =
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : undefined;

  return isValidTimeZone(browserTimeZone)
    ? browserTimeZone
    : DEFAULT_VIEWER_TIME_ZONE;
}

export function getMilestoneInstant(
  milestone: Pick<Milestone, "dateStart" | "dateEnd" | "timezone">,
  viewerTimeZone?: string,
) {
  const milestoneDate = milestone.dateEnd ?? milestone.dateStart;

  if (milestone.timezone === "AoE") {
    return new Date(`${milestoneDate}T23:59:59.999${AOE_OFFSET_SUFFIX}`);
  }

  if (milestone.timezone === "UTC") {
    return new Date(`${milestoneDate}T23:59:59.999Z`);
  }

  return zonedEndOfDayToUtc(
    milestoneDate,
    resolveViewerTimeZone(viewerTimeZone),
  );
}

export function formatMilestoneDateLabel(
  milestone: Pick<Milestone, "dateStart" | "dateEnd" | "timezone">,
  viewerTimeZone?: string,
) {
  const resolvedViewerTimeZone = resolveViewerTimeZone(viewerTimeZone);
  const milestoneInstant = getMilestoneInstant(milestone, resolvedViewerTimeZone);

  return `Your time · ${new Intl.DateTimeFormat("en-US", {
    timeZone: resolvedViewerTimeZone,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(milestoneInstant)}`;
}

export function formatCountdown(target: Date, now: Date) {
  const deltaMs = target.getTime() - now.getTime();
  const prefix = deltaMs >= 0 ? "T-" : "T+";
  let remainingMs = Math.abs(deltaMs);

  if (remainingMs < 60_000) {
    return `${prefix}0m`;
  }

  const days = Math.floor(remainingMs / 86_400_000);
  remainingMs -= days * 86_400_000;
  const hours = Math.floor(remainingMs / 3_600_000);
  remainingMs -= hours * 3_600_000;
  const minutes = Math.floor(remainingMs / 60_000);
  const parts: string[] = [];

  if (days > 0) {
    parts.push(`${days}d`);
  }

  if (hours > 0 && parts.length < 2) {
    parts.push(`${hours}h`);
  }

  if (
    parts.length === 0 ||
    (parts.length < 2 && days === 0 && (hours === 0 || minutes > 0))
  ) {
    parts.push(`${minutes}m`);
  }

  return `${prefix}${parts.join(" ")}`;
}
