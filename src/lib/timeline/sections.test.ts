import { describe, expect, it } from "vitest";
import { conferences } from "@/data/conferences";
import { organizeConferenceSections } from "./sections";

describe("organizeConferenceSections", () => {
  it("sorts by abstract-or-submission date and splits active from past", () => {
    const sections = organizeConferenceSections({
      conferences,
      query: "",
      categories: new Set(),
      visibleMilestoneTypes: new Set([
        "fullPaper",
        "rebuttalStart",
        "notification",
      ]),
      visibleRange: {
        start: new Date("2026-01-01T00:00:00Z"),
        end: new Date("2026-12-31T00:00:00Z"),
      },
      now: new Date("2026-03-26T00:00:00Z"),
    });

    expect(sections.active.map((conference) => conference.shortName)).toEqual([
      "ACL",
      "ICML",
      "KDD",
      "CoLM",
    ]);
    expect(sections.past.map((conference) => conference.shortName)).toEqual([
      "CHI",
      "ICLR",
      "SIGMOD",
      "ICDE",
      "CVPR",
    ]);
    expect(
      sections.active.some((conference) => conference.shortName === "NeurIPS"),
    ).toBe(false);
  });
});
