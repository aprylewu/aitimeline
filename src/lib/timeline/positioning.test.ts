import { describe, expect, it } from "vitest";
import { getPositionPercent } from "./positioning";

describe("getPositionPercent", () => {
  it("maps the visible range bounds to 0 and 100", () => {
    const start = new Date("2026-01-01T00:00:00Z");
    const end = new Date("2026-03-01T00:00:00Z");

    expect(getPositionPercent(start, { start, end })).toBe(0);
    expect(getPositionPercent(end, { start, end })).toBe(100);
  });
});
