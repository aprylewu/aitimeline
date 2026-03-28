import type { ConferenceCategory } from "@/types/conference";

const TAG_TO_CATEGORY: Array<[string[], ConferenceCategory]> = [
  [["data-mining", "information-retrieval"], "DS"],
  [["computer-vision"], "MX"],
  [["computer-graphics", "visualization"], "CG"],
  [["human-computer-interaction"], "HI"],
  [["databases"], "DB"],
  [["security", "cryptography"], "SC"],
  [["networking", "distributed-systems"], "NW"],
  [["software-engineering", "programming-languages"], "SE"],
  [["theory", "algorithms"], "CT"],
  [["machine-learning", "deep-learning", "natural-language-processing", "speech"], "AI"],
];

export function inferCategory(tags: string[]): ConferenceCategory {
  const tagSet = new Set(tags.map((t) => t.toLowerCase()));

  for (const [keywords, category] of TAG_TO_CATEGORY) {
    if (keywords.some((kw) => tagSet.has(kw))) {
      return category;
    }
  }

  return "AI";
}
