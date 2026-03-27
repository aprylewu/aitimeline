import { describe, expect, it } from "vitest";
import { getDefaultVisibleRange } from "./date-range";

describe("getDefaultVisibleRange", () => {
  it("uses two months back and four months forward", () => {
    const range = getDefaultVisibleRange(
      new Date("2026-03-26T00:00:00Z"),
      "UTC",
    );

    expect(range.start.toISOString().slice(0, 10)).toBe("2026-01-26");
    expect(range.end.toISOString().slice(0, 10)).toBe("2026-07-26");
  });
});
