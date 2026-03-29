import { describe, expect, it } from "vitest";
import { conferences } from "./conferences";

describe("conferences data", () => {
  it("includes the approved first batch of missing 2026 CCF conferences", () => {
    const expectedIds = [
      "aaai-2026",
      "aistats-2026",
      "ijcai-2026",
      "3dv-2026",
      "eurographics-2026",
      "eurovis-2026",
      "dis-2026",
      "ecscw-2026",
      "mlsys-2026",
      "miccai-2026",
      "sigspatial-2026",
      "www-2026",
    ];

    expect(
      expectedIds.every((id) => conferences.some((conference) => conference.id === id)),
    ).toBe(true);
  });

  it("uses the verified dates for representative newly added venues", () => {
    const aaai = conferences.find((conference) => conference.id === "aaai-2026");
    const threeDV = conferences.find((conference) => conference.id === "3dv-2026");
    const dis = conferences.find((conference) => conference.id === "dis-2026");
    const miccai = conferences.find((conference) => conference.id === "miccai-2026");
    const www = conferences.find((conference) => conference.id === "www-2026");

    expect(aaai?.milestones.find((milestone) => milestone.type === "abstract")?.dateStart).toBe(
      "2025-07-25",
    );
    expect(
      aaai?.milestones.find((milestone) => milestone.type === "conferenceStart")?.dateStart,
    ).toBe("2026-01-20");

    expect(threeDV?.location).toBe("Vancouver, Canada");
    expect(
      threeDV?.milestones.find((milestone) => milestone.type === "fullPaper")?.dateStart,
    ).toBe("2025-08-18");
    expect(
      threeDV?.milestones.find((milestone) => milestone.type === "conferenceStart")?.dateStart,
    ).toBe("2026-03-20");
    expect(
      threeDV?.milestones.find((milestone) => milestone.type === "conferenceEnd")?.dateStart,
    ).toBe("2026-03-23");

    expect(dis?.milestones.find((milestone) => milestone.type === "abstract")?.dateStart).toBe(
      "2026-01-09",
    );
    expect(
      dis?.milestones.find((milestone) => milestone.type === "conferenceEnd")?.dateStart,
    ).toBe("2026-06-17");

    expect(
      miccai?.milestones.find((milestone) => milestone.type === "rebuttalStart")?.dateStart,
    ).toBe("2026-05-08");
    expect(
      miccai?.milestones.find((milestone) => milestone.type === "conferenceEnd")?.dateStart,
    ).toBe("2026-10-08");

    expect(www?.milestones.find((milestone) => milestone.type === "abstract")?.dateStart).toBe(
      "2025-09-30",
    );
    expect(
      www?.milestones.find((milestone) => milestone.type === "conferenceStart")?.dateStart,
    ).toBe("2026-06-29");
    expect(
      www?.milestones.find((milestone) => milestone.type === "conferenceEnd")?.dateStart,
    ).toBe("2026-07-03");
  });

  it("keeps CoLM unranked so it renders without any ranking tags", () => {
    const colm = conferences.find((conference) => conference.id === "colm-2026");

    expect(colm).toBeDefined();
    expect(colm?.rankings).toEqual({});
  });

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
