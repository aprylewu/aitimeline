import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
});

describe("getConferences", () => {
  it("returns merged conferences from both sources", async () => {
    vi.doMock("./fetch-ccfddl", () => ({
      fetchCcfddl: vi.fn().mockResolvedValue([
        {
          shortName: "AAAI",
          fullName: "AAAI Conference",
          category: "AI",
          rank: { ccf: "A" },
          year: 2026,
          id: "aaai26",
          website: "https://aaai.org",
          location: "Philadelphia",
          timezone: "AoE",
          abstractDeadline: null,
          submissionDeadline: "2025-08-01",
          conferenceDateStr: "Feb 20-27, 2026",
        },
      ]),
    }));
    vi.doMock("./fetch-hf", () => ({
      fetchHfDeadlines: vi.fn().mockResolvedValue([]),
    }));

    const { getConferences } = await import("./get-conferences");
    const result = await getConferences();

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].shortName).toBe("AAAI");
  });

  it("sanitizes non-display rankings from merged live data", async () => {
    vi.doMock("./fetch-ccfddl", () => ({
      fetchCcfddl: vi.fn().mockResolvedValue([
        {
          shortName: "CoLM",
          fullName: "Conference on Language Modeling",
          category: "AI",
          rank: { core: "Emerging" },
          year: 2026,
          id: "colm26",
          website: "https://colmweb.org",
          location: "San Francisco, USA",
          timezone: "AoE",
          abstractDeadline: "2026-03-26",
          submissionDeadline: "2026-03-31",
          conferenceDateStr: "October 6 - 9, 2026",
        },
      ]),
    }));
    vi.doMock("./fetch-hf", () => ({
      fetchHfDeadlines: vi.fn().mockResolvedValue([]),
    }));

    const { getConferences } = await import("./get-conferences");
    const result = await getConferences();

    expect(result[0]?.rankings).toEqual({});
  });

  it("falls back to cache when merged live data is empty", async () => {
    vi.doMock("./fetch-ccfddl", () => ({
      fetchCcfddl: vi.fn().mockResolvedValue([]),
    }));
    vi.doMock("./fetch-hf", () => ({
      fetchHfDeadlines: vi.fn().mockResolvedValue([]),
    }));

    const { getConferences } = await import("./get-conferences");
    const result = await getConferences();

    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("milestones");
  });

  it("sanitizes non-display rankings from cached data", async () => {
    vi.doMock("./fetch-ccfddl", () => ({
      fetchCcfddl: vi.fn().mockResolvedValue([]),
    }));
    vi.doMock("./fetch-hf", () => ({
      fetchHfDeadlines: vi.fn().mockResolvedValue([]),
    }));
    vi.doMock("./cache.json", () => ({
      default: [
        {
          id: "colm-2026",
          slug: "colm-2026",
          title: "Conference on Language Modeling",
          shortName: "CoLM",
          year: 2026,
          website: "https://colmweb.org/",
          location: "San Francisco, United States",
          category: "AI",
          rankings: { core: "Emerging" },
          milestones: [
            {
              id: "colm-2026-full-paper",
              type: "fullPaper",
              label: "Full paper",
              dateStart: "2026-03-31",
              timezone: "AoE",
              importance: "primary",
            },
          ],
        },
      ],
    }));

    const { getConferences } = await import("./get-conferences");
    const result = await getConferences();

    expect(result[0]?.rankings).toEqual({});
  });

  it("falls back to static conferences when cache is empty", async () => {
    vi.doMock("./fetch-ccfddl", () => ({
      fetchCcfddl: vi.fn().mockRejectedValue(new Error("network down")),
    }));
    vi.doMock("./fetch-hf", () => ({
      fetchHfDeadlines: vi.fn().mockRejectedValue(new Error("network down")),
    }));
    vi.doMock("./cache.json", () => ({
      default: [],
    }));

    const { conferences: staticConferences } = await import("@/data/conferences");
    const { getConferences } = await import("./get-conferences");
    const result = await getConferences();

    expect(result).toEqual(staticConferences);
  });

  it("enriches live merged results with curated static metadata and milestones", async () => {
    vi.doMock("./fetch-ccfddl", () => ({
      fetchCcfddl: vi.fn().mockResolvedValue([
        {
          shortName: "OSDI",
          fullName: "USENIX Symposium on Operating Systems Design and Implementation",
          category: "SE",
          rank: { ccf: "A", core: "A*" },
          year: 2026,
          id: "osdi2026",
          website: "https://www.usenix.org/conference/osdi26",
          location: "Seattle, WA, USA",
          timezone: "UTC",
          abstractDeadline: "2025-12-04",
          submissionDeadline: "2025-12-11",
          conferenceDateStr: "July 13-15, 2026",
        },
      ]),
    }));
    vi.doMock("./fetch-hf", () => ({
      fetchHfDeadlines: vi.fn().mockResolvedValue([]),
    }));

    const { getConferences } = await import("./get-conferences");
    const result = await getConferences();
    const osdi = result.find((conference) => conference.id === "osdi-2026");

    expect(osdi).toBeDefined();
    expect(osdi?.cfpUrl).toContain("/osdi26/call-for-papers");
    expect(
      osdi?.milestones.find((milestone) => milestone.type === "notification")?.dateStart,
    ).toBe("2026-03-26");
    expect(
      osdi?.milestones.find((milestone) => milestone.type === "conferenceStart")?.dateStart,
    ).toBe("2026-07-13");
  });

  it("supplements cached results with curated static conferences", async () => {
    vi.doMock("./fetch-ccfddl", () => ({
      fetchCcfddl: vi.fn().mockResolvedValue([]),
    }));
    vi.doMock("./fetch-hf", () => ({
      fetchHfDeadlines: vi.fn().mockResolvedValue([]),
    }));
    vi.doMock("./cache.json", () => ({
      default: [
        {
          id: "aaai-2026",
          slug: "aaai-2026",
          title: "AAAI Conference on Artificial Intelligence",
          shortName: "AAAI",
          year: 2026,
          website: "https://aaai.org/conference/aaai/aaai-26/",
          location: "Singapore",
          category: "AI",
          rankings: { ccf: "A" },
          milestones: [],
        },
      ],
    }));

    const { getConferences } = await import("./get-conferences");
    const result = await getConferences();

    expect(result.some((conference) => conference.id === "osdi-2026")).toBe(true);
    expect(result.some((conference) => conference.id === "socc-2026")).toBe(true);
  });
});
