import type { Conference } from "@/types/conference";
import { fetchCcfddl } from "./fetch-ccfddl";
import { fetchHfDeadlines } from "./fetch-hf";
import { mergeSources } from "./merge-sources";
import cachedConferences from "./cache.json";

export async function getConferences(): Promise<Conference[]> {
  try {
    const [ccfddlEntries, hfEntries] = await Promise.all([
      fetchCcfddl(),
      fetchHfDeadlines(),
    ]);

    const merged = mergeSources(ccfddlEntries, hfEntries);

    if (merged.length > 0) {
      return merged;
    }
  } catch {
    // Fall through to cache
  }

  return cachedConferences as Conference[];
}
