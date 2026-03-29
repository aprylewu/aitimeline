import type { Conference } from "@/types/conference";
import { conferences as staticConferences } from "@/data/conferences";
import { fetchCcfddl } from "./fetch-ccfddl";
import { fetchHfDeadlines } from "./fetch-hf";
import { mergeSources } from "./merge-sources";
import cachedConferences from "./cache.json";
import { sanitizeRankings } from "./rankings";

function sanitizeConferenceRankings(conferences: Conference[]): Conference[] {
  return conferences.map((conference) => ({
    ...conference,
    rankings: sanitizeRankings(conference.rankings),
  }));
}

export async function getConferences(): Promise<Conference[]> {
  try {
    const [ccfddlEntries, hfEntries] = await Promise.all([
      fetchCcfddl(),
      fetchHfDeadlines(),
    ]);

    const merged = mergeSources(ccfddlEntries, hfEntries);

    if (merged.length > 0) {
      return sanitizeConferenceRankings(merged);
    }
  } catch {
    // Fall through to cache
  }

  const cached = cachedConferences as Conference[];

  if (cached.length > 0) {
    return sanitizeConferenceRankings(cached);
  }

  return sanitizeConferenceRankings(staticConferences);
}
