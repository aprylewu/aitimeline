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

    const activeNames = sections.active.map((conference) => conference.shortName);
    const pastNames = sections.past.map((conference) => conference.shortName);

    expect(activeNames).toEqual(
      expect.arrayContaining([
        "OSDI",
        "ACL",
        "DIS",
        "IJCAI",
        "SoCC",
        "SOSP",
        "NeurIPS",
      ]),
    );
    expect(pastNames).toEqual(
      expect.arrayContaining([
        "EuroSys",
        "CHI",
        "ICLR",
        "WWW",
      ]),
    );
    expect(activeNames).not.toContain("NSDI");
    expect(pastNames).not.toContain("NSDI");
    expect(activeNames.indexOf("OSDI")).toBeLessThan(activeNames.indexOf("ACL"));
    expect(activeNames.indexOf("SoCC")).toBeLessThan(activeNames.indexOf("MICCAI"));
    expect(activeNames.indexOf("SOSP")).toBeLessThan(activeNames.indexOf("NeurIPS"));
  });

  it("does not mark an AoE decision as past before the real AoE deadline instant", () => {
    const sections = organizeConferenceSections({
      conferences: conferences.filter((conference) => conference.id === "iclr-2026"),
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
      now: new Date("2026-01-26T06:00:00.000Z"),
    });

    expect(sections.active.map((conference) => conference.shortName)).toEqual([
      "ICLR",
    ]);
    expect(sections.past).toHaveLength(0);
  });
});
