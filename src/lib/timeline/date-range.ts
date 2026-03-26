import { addMonths, subMonths } from "date-fns";

export function getDefaultVisibleRange(now: Date) {
  return {
    start: subMonths(now, 2),
    end: addMonths(now, 4),
  };
}
