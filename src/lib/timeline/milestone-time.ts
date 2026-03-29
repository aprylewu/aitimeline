import type { Milestone } from "@/types/conference";

const DEFAULT_VIEWER_TIME_ZONE = "UTC";
const AOE_TIME_ZONE = "Etc/GMT+12";
const DATE_TIME_PARTS_FORMATTER = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
} as const;

interface ZonedDateTimeParts {
  day: number;
  hour: number;
  minute: number;
  month: number;
  second: number;
  year: number;
}

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

function getDaysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function getZonedDateTimeParts(date: Date, timeZone: string): ZonedDateTimeParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    ...DATE_TIME_PARTS_FORMATTER,
    timeZone,
  }).formatToParts(date);

  function readPart(type: Intl.DateTimeFormatPartTypes) {
    return Number.parseInt(
      parts.find((part) => part.type === type)?.value ?? "0",
      10,
    );
  }

  return {
    year: readPart("year"),
    month: readPart("month"),
    day: readPart("day"),
    hour: readPart("hour"),
    minute: readPart("minute"),
    second: readPart("second"),
  };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    ...DATE_TIME_PARTS_FORMATTER,
    timeZone,
    timeZoneName: "shortOffset",
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

export function zonedDateTimeToUtc(
  dateTime: ZonedDateTimeParts & { millisecond?: number },
  timeZone: string,
) {
  const utcGuess = new Date(
    Date.UTC(
      dateTime.year,
      dateTime.month - 1,
      dateTime.day,
      dateTime.hour,
      dateTime.minute,
      dateTime.second,
      dateTime.millisecond ?? 0,
    ),
  );
  const offset = getTimeZoneOffsetMs(utcGuess, timeZone);

  return new Date(utcGuess.getTime() - offset);
}

function getMilestoneTimeZone(
  milestone: Pick<Milestone, "timezone">,
  viewerTimeZone?: string,
) {
  if (milestone.timezone === "AoE") {
    return AOE_TIME_ZONE;
  }

  if (milestone.timezone === "UTC") {
    return "UTC";
  }

  if (isValidTimeZone(milestone.timezone)) {
    return milestone.timezone;
  }

  return resolveViewerTimeZone(viewerTimeZone);
}

function getBoundaryInstant(
  dateString: string,
  timeZone: string,
  boundary: "start" | "end",
) {
  const { year, month, day } = parseDateParts(dateString);

  return zonedDateTimeToUtc(
    {
      year,
      month,
      day,
      hour: boundary === "start" ? 0 : 23,
      minute: boundary === "start" ? 0 : 59,
      second: boundary === "start" ? 0 : 59,
      millisecond: boundary === "start" ? 0 : 999,
    },
    timeZone,
  );
}

function formatWithTimeZone(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

export function formatCurrentTimeLabel(date: Date, viewerTimeZone?: string) {
  const resolvedViewerTimeZone = resolveViewerTimeZone(viewerTimeZone);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: resolvedViewerTimeZone,
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
    timeZoneName: "shortOffset",
  }).formatToParts(date);

  function readPart(type: Intl.DateTimeFormatPartTypes) {
    return parts.find((part) => part.type === type)?.value ?? "";
  }

  return `${readPart("month")} ${readPart("day")} ${readPart("hour")}:${readPart(
    "minute",
  )} ${readPart("timeZoneName")}`.trim();
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

export function shiftDateByMonthsInTimeZone(
  date: Date,
  amount: number,
  timeZone: string,
) {
  const localParts = getZonedDateTimeParts(date, timeZone);
  const monthIndex = localParts.year * 12 + (localParts.month - 1) + amount;
  const targetYear = Math.floor(monthIndex / 12);
  const targetMonth = ((monthIndex % 12) + 12) % 12 + 1;
  const targetDay = Math.min(
    localParts.day,
    getDaysInMonth(targetYear, targetMonth),
  );

  return zonedDateTimeToUtc(
    {
      ...localParts,
      year: targetYear,
      month: targetMonth,
      day: targetDay,
      millisecond: date.getUTCMilliseconds(),
    },
    timeZone,
  );
}

export function shiftDateByDaysInTimeZone(
  date: Date,
  amount: number,
  timeZone: string,
) {
  const localParts = getZonedDateTimeParts(date, timeZone);
  const normalizedLocalDate = new Date(
    Date.UTC(
      localParts.year,
      localParts.month - 1,
      localParts.day + amount,
      localParts.hour,
      localParts.minute,
      localParts.second,
      date.getUTCMilliseconds(),
    ),
  );

  return zonedDateTimeToUtc(
    {
      year: normalizedLocalDate.getUTCFullYear(),
      month: normalizedLocalDate.getUTCMonth() + 1,
      day: normalizedLocalDate.getUTCDate(),
      hour: normalizedLocalDate.getUTCHours(),
      minute: normalizedLocalDate.getUTCMinutes(),
      second: normalizedLocalDate.getUTCSeconds(),
      millisecond: normalizedLocalDate.getUTCMilliseconds(),
    },
    timeZone,
  );
}

export function getZonedMonthStart(date: Date, timeZone: string) {
  const localParts = getZonedDateTimeParts(date, timeZone);

  return zonedDateTimeToUtc(
    {
      year: localParts.year,
      month: localParts.month,
      day: 1,
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0,
    },
    timeZone,
  );
}

export function addMonthsInTimeZone(
  date: Date,
  amount: number,
  timeZone: string,
) {
  const localParts = getZonedDateTimeParts(date, timeZone);
  const monthIndex = localParts.year * 12 + (localParts.month - 1) + amount;
  const targetYear = Math.floor(monthIndex / 12);
  const targetMonth = ((monthIndex % 12) + 12) % 12 + 1;

  return zonedDateTimeToUtc(
    {
      year: targetYear,
      month: targetMonth,
      day: 1,
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0,
    },
    timeZone,
  );
}

export function getMonthKey(date: Date, timeZone: string) {
  const localParts = getZonedDateTimeParts(date, timeZone);

  return `${localParts.year}-${String(localParts.month).padStart(2, "0")}`;
}

export function getMonthLabel(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
  }).format(date);
}

export function formatCalendarDateInTimeZone(date: Date, timeZone?: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: resolveViewerTimeZone(timeZone),
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function getMilestoneInstant(
  milestone: Pick<Milestone, "dateStart" | "dateEnd" | "timezone">,
  viewerTimeZone?: string,
) {
  const milestoneDate = milestone.dateEnd ?? milestone.dateStart;

  return getBoundaryInstant(
    milestoneDate,
    getMilestoneTimeZone(milestone, viewerTimeZone),
    "end",
  );
}

export function getMilestoneRange(
  milestone: Pick<Milestone, "dateStart" | "dateEnd" | "timezone">,
  viewerTimeZone?: string,
) {
  const milestoneTimeZone = getMilestoneTimeZone(milestone, viewerTimeZone);
  const endDate = milestone.dateEnd ?? milestone.dateStart;

  return {
    start: getBoundaryInstant(milestone.dateStart, milestoneTimeZone, "start"),
    end: getBoundaryInstant(endDate, milestoneTimeZone, "end"),
  };
}

export function formatMilestoneDateLabel(
  milestone: Pick<Milestone, "dateStart" | "dateEnd" | "timezone">,
  viewerTimeZone?: string,
) {
  const resolvedViewerTimeZone = resolveViewerTimeZone(viewerTimeZone);
  const milestoneInstant = getMilestoneInstant(milestone, resolvedViewerTimeZone);

  return `${resolvedViewerTimeZone} · ${formatWithTimeZone(
    milestoneInstant,
    resolvedViewerTimeZone,
  )}`;
}

export function formatMilestoneSourceDateLabel(
  milestone: Pick<Milestone, "dateStart" | "dateEnd" | "timezone">,
  viewerTimeZone?: string,
) {
  const sourceTimeZone = getMilestoneTimeZone(milestone, viewerTimeZone);
  const milestoneInstant = getMilestoneInstant(milestone, viewerTimeZone);
  const sourceLabel =
    milestone.timezone === "AoE"
      ? "AoE"
      : milestone.timezone === "UTC"
        ? "UTC"
        : isValidTimeZone(milestone.timezone)
          ? milestone.timezone
        : "Local";

  const formatted = formatWithTimeZone(milestoneInstant, sourceTimeZone).replace(
    "GMT-12",
    "AoE",
  );

  return `${sourceLabel} · ${formatted}`;
}

export function formatCountdown(target: Date, now: Date) {
  const deltaMs = target.getTime() - now.getTime();
  const prefix = deltaMs >= 0 ? "T-" : "T+";
  const roundedHours = Math.ceil(Math.abs(deltaMs) / 3_600_000);
  const days = Math.floor(roundedHours / 24);
  const hours = roundedHours % 24;
  const parts: string[] = [];

  if (days > 0) {
    parts.push(`${days}d`);
  }

  if (hours > 0 || parts.length === 0) {
    parts.push(`${hours}h`);
  }

  return `${prefix}${parts.join(" ")}`;
}
