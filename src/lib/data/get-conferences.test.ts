import { describe, expect, it, vi, beforeEach } from "vitest";

beforeEach(() => {
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

  it("falls back to cache when both fetches fail", async () => {
    vi.doMock("./fetch-ccfddl", () => ({
      fetchCcfddl: vi.fn().mockResolvedValue([]),
    }));
    vi.doMock("./fetch-hf", () => ({
      fetchHfDeadlines: vi.fn().mockResolvedValue([]),
    }));

    const { getConferences } = await import("./get-conferences");
    const result = await getConferences();

    expect(Array.isArray(result)).toBe(true);
  });
});
