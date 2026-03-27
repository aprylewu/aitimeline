import { addMonthsInTimeZone, resolveViewerTimeZone, shiftDateByMonthsInTimeZone } from "./milestone-time";

export function getRelativeVisibleRange(
  now: Date,
  viewerTimeZone: string | undefined,
  startMonths: number,
  endMonths: number,
) {
  const resolvedViewerTimeZone = resolveViewerTimeZone(viewerTimeZone);

  return {
    start: shiftDateByMonthsInTimeZone(now, startMonths, resolvedViewerTimeZone),
    end: shiftDateByMonthsInTimeZone(now, endMonths, resolvedViewerTimeZone),
  };
}

export function getDefaultVisibleRange(
  now: Date,
  viewerTimeZone?: string,
) {
  return getRelativeVisibleRange(now, viewerTimeZone, -2, 4);
}

export function getPresetVisibleRange(
  now: Date,
  viewerTimeZone: string | undefined,
  months: number,
) {
  const monthsBack = Math.max(1, Math.floor(months / 3));

  return {
    start: shiftDateByMonthsInTimeZone(
      now,
      -monthsBack,
      resolveViewerTimeZone(viewerTimeZone),
    ),
    end: addMonthsInTimeZone(
      now,
      months - monthsBack,
      resolveViewerTimeZone(viewerTimeZone),
    ),
  };
}
