import { describe, expect, it, vi, beforeEach } from "vitest";
import { fetchCcfddl, normalizeCcfTimezone } from "./fetch-ccfddl";

const MOCK_TREE = {
  tree: [
    { path: "conference/AI/aaai.yml", type: "blob" },
    { path: "conference/DB/sigmod.yml", type: "blob" },
    { path: "README.md", type: "blob" },
  ],
};

const MOCK_AAAI_YAML = `
- title: AAAI
  description: AAAI Conference on Artificial Intelligence
  sub: AI
  rank:
    ccf: A
    core: "A*"
    thcpl: A
  confs:
    - year: 2026
      id: aaai26
      link: https://aaai.org/2026
      timeline:
        - abstract_deadline: '2025-07-25 23:59:59'
          deadline: '2025-08-01 23:59:59'
      timezone: UTC-12
      date: February 20 - 27, 2026
      place: Philadelphia, USA
`;

const MOCK_SIGMOD_YAML = `
- title: SIGMOD
  description: ACM SIGMOD Conference
  sub: DB
  rank:
    ccf: A
    core: "A*"
  confs:
    - year: 2026
      id: sigmod26
      link: https://sigmod2026.org
      timeline:
        - deadline: '2025-10-17 23:59:59'
      timezone: UTC-12
      date: June 1 - 5, 2026
      place: Bengaluru, India
`;

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("normalizeCcfTimezone", () => {
  it("maps AoE aliases to the milestone AoE label (not UTC)", () => {
    expect(normalizeCcfTimezone("AoE")).toBe("AoE");
    expect(normalizeCcfTimezone("aoe")).toBe("AoE");
    expect(normalizeCcfTimezone("UTC-12")).toBe("AoE");
  });

  it("maps UTC and GMT synonyms to UTC", () => {
    expect(normalizeCcfTimezone("UTC")).toBe("UTC");
    expect(normalizeCcfTimezone("UTC+0")).toBe("UTC");
    expect(normalizeCcfTimezone("GMT")).toBe("UTC");
  });

  it("maps fixed UTC±N offsets to IANA Etc/GMT* zones", () => {
    expect(normalizeCcfTimezone("UTC-7")).toBe("Etc/GMT+7");
    expect(normalizeCcfTimezone("UTC-8")).toBe("Etc/GMT+8");
    expect(normalizeCcfTimezone("UTC+8")).toBe("Etc/GMT-8");
  });

  it("passes through valid IANA timezones", () => {
    expect(normalizeCcfTimezone("America/Los_Angeles")).toBe(
      "America/Los_Angeles",
    );
  });
});

describe("fetchCcfddl", () => {
  it("fetches tree, downloads YAML files, and parses to CcfddlConference[]", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_TREE),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(MOCK_AAAI_YAML),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(MOCK_SIGMOD_YAML),
      });
    vi.stubGlobal("fetch", mockFetch);

    const result = await fetchCcfddl();

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      shortName: "AAAI",
      category: "AI",
      year: 2026,
      submissionDeadline: "2025-08-01",
    });
    expect(result[0].abstractDeadline).toBe("2025-07-25");
    expect(result[1]).toMatchObject({
      shortName: "SIGMOD",
      category: "DB",
      year: 2026,
    });
  });

  it("returns empty array when tree fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({ ok: false }));

    const result = await fetchCcfddl();

    expect(result).toEqual([]);
  });
});
