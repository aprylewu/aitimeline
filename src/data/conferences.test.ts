import { describe, expect, it } from "vitest";
import { conferences } from "./conferences";

describe("conferences data", () => {
  it("uses official 2026 NeurIPS dates and omits unannounced rebuttal milestones", () => {
    const neurips = conferences.find((conference) => conference.id === "neurips-2026");

    expect(neurips).toBeDefined();
    expect(neurips?.cfpUrl).toContain("neurips.cc/Conferences/2026/CallForPapers");
    expect(neurips?.milestones.find((milestone) => milestone.type === "fullPaper")?.dateStart).toBe(
      "2026-05-06",
    );
    expect(
      neurips?.milestones.find((milestone) => milestone.type === "conferenceStart")?.dateStart,
    ).toBe("2026-12-08");
    expect(
      neurips?.milestones.find((milestone) => milestone.type === "conferenceEnd")?.dateStart,
    ).toBe("2026-12-10");
    expect(
      neurips?.milestones.find((milestone) => milestone.type === "workshop")?.dateStart,
    ).toBe("2026-12-11");
    expect(
      neurips?.milestones.find((milestone) => milestone.type === "workshop")?.dateEnd,
    ).toBe("2026-12-12");
    expect(
      neurips?.milestones.some((milestone) => milestone.type === "rebuttalStart"),
    ).toBe(false);
    expect(
      neurips?.milestones.some((milestone) => milestone.type === "rebuttalEnd"),
    ).toBe(false);
  });

  it("includes EMNLP 2026 with official CFP and milestone dates", () => {
    const emnlp = conferences.find((conference) => conference.id === "emnlp-2026");

    expect(emnlp).toBeDefined();
    expect(emnlp?.shortName).toBe("EMNLP");
    expect(emnlp?.location).toBe("Budapest, Hungary");
    expect(emnlp?.cfpUrl).toContain("2026.emnlp.org/calls/main_conference_papers");
    expect(emnlp?.milestones.find((milestone) => milestone.type === "fullPaper")?.dateStart).toBe(
      "2026-05-25",
    );
    expect(
      emnlp?.milestones.find((milestone) => milestone.type === "rebuttalStart")?.dateStart,
    ).toBe("2026-07-07");
    expect(
      emnlp?.milestones.find((milestone) => milestone.type === "rebuttalEnd")?.dateStart,
    ).toBe("2026-07-13");
    expect(
      emnlp?.milestones.find((milestone) => milestone.type === "notification")?.dateStart,
    ).toBe("2026-08-20");
    expect(
      emnlp?.milestones.find((milestone) => milestone.type === "cameraReady")?.dateStart,
    ).toBe("2026-09-20");
    expect(
      emnlp?.milestones.find((milestone) => milestone.type === "conferenceStart")?.dateStart,
    ).toBe("2026-10-24");
    expect(
      emnlp?.milestones.find((milestone) => milestone.type === "conferenceEnd")?.dateStart,
    ).toBe("2026-10-29");
  });
});
