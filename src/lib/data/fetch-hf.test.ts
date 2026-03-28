import { describe, expect, it, vi, beforeEach } from "vitest";
import { fetchHfDeadlines } from "./fetch-hf";

const MOCK_TREE = {
  tree: [
    { path: "src/data/conferences/aaai.yml", type: "blob" },
    { path: "src/data/conferences/README.md", type: "blob" },
  ],
};

const MOCK_AAAI_YAML = `
- title: AAAI
  year: 2026
  id: aaai26
  full_name: AAAI Conference on Artificial Intelligence
  link: https://aaai.org/2026
  deadlines:
    - type: abstract
      label: Abstract deadline
      date: '2025-07-25 23:59:59'
      timezone: AoE
    - type: paper
      label: Paper deadline
      date: '2025-08-01 23:59:59'
      timezone: AoE
    - type: notification
      label: Decision
      date: '2025-11-08 23:59:59'
      timezone: AoE
  start: '2026-02-20'
  end: '2026-02-27'
  city: Philadelphia
  country: USA
  venue: Philadelphia Convention Center
  rankings: 'CCF: A, CORE: A*, THCPL: A'
  tags:
    - machine-learning
    - natural-language-processing
`;

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("fetchHfDeadlines", () => {
  it("fetches tree, downloads YAML, and parses to HfConference[]", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_TREE),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(MOCK_AAAI_YAML),
      });
    vi.stubGlobal("fetch", mockFetch);

    const result = await fetchHfDeadlines();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      shortName: "AAAI",
      fullName: "AAAI Conference on Artificial Intelligence",
      year: 2026,
      website: "https://aaai.org/2026",
      conferenceStart: "2026-02-20",
      conferenceEnd: "2026-02-27",
    });
    expect(result[0].deadlines).toHaveLength(3);
    expect(result[0].tags).toContain("machine-learning");
  });

  it("returns empty array when tree fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({ ok: false }));

    const result = await fetchHfDeadlines();

    expect(result).toEqual([]);
  });
});
