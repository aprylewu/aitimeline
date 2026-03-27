import { describe, expect, it } from "vitest";
import { conferences } from "@/data/conferences";
import { filterConferences } from "./filtering";

describe("filterConferences", () => {
  it("filters by search query, category, milestone types, and range", () => {
    const result = filterConferences({
      conferences,
      query: "neurips",
      categories: new Set(["AI"]),
      visibleMilestoneTypes: new Set(["fullPaper", "notification"]),
      visibleRange: {
        start: new Date("2026-06-01T00:00:00Z"),
        end: new Date("2026-12-31T00:00:00Z"),
      },
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.shortName).toMatch(/neurips/i);
    expect(
      result[0]?.milestones.every((item) => item.type !== "cameraReady"),
    ).toBe(true);
  });

  it("includes AoE milestones when their projected viewer-local instant falls inside the visible range", () => {
    const result = filterConferences({
      conferences,
      query: "colm",
      categories: new Set(["AI"]),
      visibleMilestoneTypes: new Set(["fullPaper"]),
      visibleRange: {
        start: new Date("2026-03-31T16:00:00.000Z"),
        end: new Date("2026-04-30T15:59:59.999Z"),
      },
      viewerTimeZone: "Asia/Shanghai",
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.shortName).toBe("CoLM");
  });
});
