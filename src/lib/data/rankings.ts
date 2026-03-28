import type { ConferenceRanking } from "@/types/conference";

const RANKING_KEY_MAP: Record<string, keyof ConferenceRanking> = {
  ccf: "ccf",
  core: "core",
  thcpl: "thcpl",
};

export function parseRankingsString(raw: string | null): ConferenceRanking {
  if (!raw || !raw.trim()) {
    return {};
  }

  const result: ConferenceRanking = {};

  for (const part of raw.split(",")) {
    const match = part.trim().match(/^(\w+):\s*(.+)$/);

    if (match) {
      const key = RANKING_KEY_MAP[match[1].toLowerCase()];

      if (key) {
        result[key] = match[2].trim();
      }
    }
  }

  return result;
}
