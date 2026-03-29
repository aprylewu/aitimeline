import type { ConferenceRanking } from "@/types/conference";

const RANKING_KEY_MAP: Record<string, keyof ConferenceRanking> = {
  ccf: "ccf",
  core: "core",
  thcpl: "thcpl",
};

const NON_DISPLAY_RANKING_VALUES = new Set([
  "n",
  "na",
  "n/a",
  "none",
  "emerging",
]);

export function sanitizeRankings(raw: ConferenceRanking): ConferenceRanking {
  const result: ConferenceRanking = {};

  for (const [key, value] of Object.entries(raw) as Array<
    [keyof ConferenceRanking, string | undefined]
  >) {
    const normalizedValue = value?.trim();

    if (!normalizedValue) {
      continue;
    }

    if (NON_DISPLAY_RANKING_VALUES.has(normalizedValue.toLowerCase())) {
      continue;
    }

    result[key] = normalizedValue;
  }

  return result;
}

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

  return sanitizeRankings(result);
}
