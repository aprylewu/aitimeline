import {
  addMonths,
  endOfMonth,
  startOfMonth,
  subMonths,
} from "date-fns";

interface VisibleRange {
  start: Date;
  end: Date;
}

export function alignVisibleRangeToMonthBounds(range: VisibleRange) {
  return {
    start: startOfMonth(range.start),
    end: endOfMonth(range.end),
  };
}

export function getDefaultVisibleRange(now: Date) {
  return alignVisibleRangeToMonthBounds({
    start: subMonths(now, 2),
    end: addMonths(now, 4),
  });
}
