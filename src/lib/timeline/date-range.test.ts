import { format } from "date-fns";
import { describe, expect, it } from "vitest";
import {
  alignVisibleRangeToMonthBounds,
  getDefaultVisibleRange,
} from "./date-range";

describe("getDefaultVisibleRange", () => {
  it("uses two months back and four months forward aligned to month bounds", () => {
    const range = getDefaultVisibleRange(new Date("2026-03-26T00:00:00Z"));

    expect(format(range.start, "yyyy-MM-dd")).toBe("2026-01-01");
    expect(format(range.end, "yyyy-MM-dd")).toBe("2026-07-31");
  });
});

describe("alignVisibleRangeToMonthBounds", () => {
  it("normalizes partial-month ranges for clean timeline ticks", () => {
    const range = alignVisibleRangeToMonthBounds({
      start: new Date("2026-02-26T00:00:00Z"),
      end: new Date("2026-05-26T00:00:00Z"),
    });

    expect(format(range.start, "yyyy-MM-dd")).toBe("2026-02-01");
    expect(format(range.end, "yyyy-MM-dd")).toBe("2026-05-31");
  });
});
