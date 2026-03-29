import {
  addMonths,
  endOfMonth,
  startOfMonth,
  subMonths,
} from "date-fns";
import {
  addMonthsInTimeZone,
  getZonedMonthStart,
  resolveViewerTimeZone,
  shiftDateByMonthsInTimeZone,
} from "./milestone-time";

interface VisibleRange {
  start: Date;
  end: Date;
}

export function alignVisibleRangeToMonthBounds(
  range: VisibleRange,
  viewerTimeZone?: string,
) {
  if (!viewerTimeZone) {
    return {
      start: startOfMonth(range.start),
      end: endOfMonth(range.end),
    };
  }

  const resolvedViewerTimeZone = resolveViewerTimeZone(viewerTimeZone);
  const start = getZonedMonthStart(range.start, resolvedViewerTimeZone);
  const endMonthStart = getZonedMonthStart(range.end, resolvedViewerTimeZone);
  const monthAfterEnd = addMonthsInTimeZone(
    endMonthStart,
    1,
    resolvedViewerTimeZone,
  );

  return {
    start,
    end: new Date(monthAfterEnd.getTime() - 1),
  };
}

export function getDefaultVisibleRange(now: Date, viewerTimeZone?: string) {
  if (!viewerTimeZone) {
    return alignVisibleRangeToMonthBounds({
      start: subMonths(now, 2),
      end: addMonths(now, 4),
    });
  }

  const resolvedViewerTimeZone = resolveViewerTimeZone(viewerTimeZone);

  return alignVisibleRangeToMonthBounds(
    {
      start: shiftDateByMonthsInTimeZone(now, -2, resolvedViewerTimeZone),
      end: shiftDateByMonthsInTimeZone(now, 4, resolvedViewerTimeZone),
    },
    resolvedViewerTimeZone,
  );
}
