import { describe, expect, it } from "vitest";
import { mergeSources } from "./merge-sources";
import type { CcfddlConference, HfConference } from "./types";

const ccfddlFixtures: CcfddlConference[] = [
  {
    shortName: "AAAI",
    fullName: "AAAI Conference on Artificial Intelligence",
    category: "AI",
    rank: { ccf: "A", core: "A*", thcpl: "A" },
    year: 2026,
    id: "aaai26",
    website: "https://aaai.org/2026",
    location: "Philadelphia, USA",
    timezone: "AoE",
    abstractDeadline: "2025-07-25",
    submissionDeadline: "2025-08-01",
    conferenceDateStr: "February 20 - 27, 2026",
  },
  {
    shortName: "SIGMOD",
    fullName: "ACM SIGMOD Conference",
    category: "DB",
    rank: { ccf: "A", core: "A*" },
    year: 2026,
    id: "sigmod26",
    website: "https://sigmod2026.org",
    location: "Bengaluru, India",
    timezone: "AoE",
    abstractDeadline: null,
    submissionDeadline: "2025-10-17",
    conferenceDateStr: "June 1 - 5, 2026",
  },
];

const hfFixtures: HfConference[] = [
  {
    shortName: "AAAI",
    fullName: "AAAI Conference on Artificial Intelligence",
    year: 2026,
    id: "aaai26",
    website: "https://aaai.org/2026",
    location: "Philadelphia Convention Center, Philadelphia, USA",
    deadlines: [
      { type: "abstract", label: "Abstract", date: "2025-07-25", timezone: "AoE" },
      { type: "paper", label: "Paper deadline", date: "2025-08-01", timezone: "AoE" },
      { type: "rebuttal_start", label: "Rebuttal opens", date: "2025-10-07", timezone: "AoE" },
      { type: "rebuttal_end", label: "Rebuttal closes", date: "2025-10-13", timezone: "AoE" },
      { type: "notification", label: "Decision", date: "2025-11-08", timezone: "AoE" },
      { type: "camera_ready", label: "Camera ready", date: "2025-11-13", timezone: "AoE" },
    ],
    conferenceStart: "2026-02-20",
    conferenceEnd: "2026-02-27",
    rankingsStr: "CCF: A, CORE: A*, THCPL: A",
    tags: ["machine-learning"],
  },
  {
    shortName: "ICLR",
    fullName: "International Conference on Learning Representations",
    year: 2026,
    id: "iclr26",
    website: "https://iclr.cc/2026",
    location: "Rio de Janeiro, Brazil",
    deadlines: [
      { type: "paper", label: "Paper deadline", date: "2025-09-24", timezone: "AoE" },
      { type: "notification", label: "Decision", date: "2026-01-25", timezone: "AoE" },
    ],
    conferenceStart: "2026-04-23",
    conferenceEnd: "2026-04-27",
    rankingsStr: "CCF: A, CORE: A*",
    tags: ["machine-learning", "deep-learning"],
  },
];

describe("mergeSources", () => {
  it("merges matched conferences: HF milestones + ccfddl category/rankings", () => {
    const result = mergeSources(ccfddlFixtures, hfFixtures);
    const aaai = result.find((c) => c.shortName === "AAAI");

    expect(aaai).toBeDefined();
    expect(aaai!.category).toBe("AI");
    expect(aaai!.rankings).toEqual({ ccf: "A", core: "A*", thcpl: "A" });
    expect(aaai!.milestones.some((m) => m.type === "rebuttalStart")).toBe(true);
    expect(aaai!.milestones.some((m) => m.type === "notification")).toBe(true);
    expect(aaai!.milestones.some((m) => m.type === "conferenceStart")).toBe(true);
  });

  it("includes ccfddl-only conferences with submission milestones", () => {
    const result = mergeSources(ccfddlFixtures, hfFixtures);
    const sigmod = result.find((c) => c.shortName === "SIGMOD");

    expect(sigmod).toBeDefined();
    expect(sigmod!.category).toBe("DB");
    expect(sigmod!.milestones.some((m) => m.type === "fullPaper")).toBe(true);
    expect(sigmod!.milestones.some((m) => m.type === "rebuttalStart")).toBe(false);
  });

  it("includes HF-only conferences with inferred category", () => {
    const result = mergeSources(ccfddlFixtures, hfFixtures);
    const iclr = result.find((c) => c.shortName === "ICLR");

    expect(iclr).toBeDefined();
    expect(iclr!.category).toBe("AI");
    expect(iclr!.rankings).toEqual({ ccf: "A", core: "A*" });
  });

  it("produces valid Conference objects with required fields", () => {
    const result = mergeSources(ccfddlFixtures, hfFixtures);

    for (const conf of result) {
      expect(conf.id).toBeTruthy();
      expect(conf.slug).toBeTruthy();
      expect(conf.shortName).toBeTruthy();
      expect(conf.year).toBeGreaterThan(2000);
      expect(conf.milestones.length).toBeGreaterThan(0);
    }
  });
});
