import type { Conference, Milestone } from "@/types/conference";
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

function milestoneKey(milestone: Milestone) {
  return `${milestone.type}|${milestone.dateStart}|${milestone.dateEnd ?? ""}`;
}

function mergeMilestones(
  sourceMilestones: Milestone[],
  curatedMilestones: Milestone[],
) {
  const merged = new Map(
    sourceMilestones.map((milestone) => [milestoneKey(milestone), milestone]),
  );

  for (const milestone of curatedMilestones) {
    merged.set(milestoneKey(milestone), milestone);
  }

  return Array.from(merged.values()).sort((left, right) => {
    return (
      left.dateStart.localeCompare(right.dateStart) ||
      (left.dateEnd ?? "").localeCompare(right.dateEnd ?? "") ||
      left.label.localeCompare(right.label)
    );
  });
}

function enrichWithStaticConferences(conferences: Conference[]) {
  const curatedById = new Map(
    staticConferences.map((conference) => [conference.id, conference]),
  );
  const merged = conferences.map((conference) => {
    const curated = curatedById.get(conference.id);

    if (!curated) {
      return conference;
    }

    return {
      ...conference,
      title: curated.title,
      website: curated.website || conference.website,
      cfpUrl: curated.cfpUrl ?? conference.cfpUrl,
      location: curated.location || conference.location,
      category: curated.category,
      rankings: {
        ...conference.rankings,
        ...curated.rankings,
      },
      detailNote: curated.detailNote ?? conference.detailNote,
      milestones: mergeMilestones(conference.milestones, curated.milestones),
    } satisfies Conference;
  });
  const presentIds = new Set(merged.map((conference) => conference.id));

  for (const curated of staticConferences) {
    if (!presentIds.has(curated.id)) {
      merged.push(curated);
    }
  }

  return merged;
}

export async function getConferences(): Promise<Conference[]> {
  try {
    const [ccfddlEntries, hfEntries] = await Promise.all([
      fetchCcfddl(),
      fetchHfDeadlines(),
    ]);

    const merged = mergeSources(ccfddlEntries, hfEntries);

    if (merged.length > 0) {
      return sanitizeConferenceRankings(enrichWithStaticConferences(merged));
    }
  } catch {
    // Fall through to cache
  }

  const cached = cachedConferences as Conference[];

  if (cached.length > 0) {
    return sanitizeConferenceRankings(enrichWithStaticConferences(cached));
  }

  return sanitizeConferenceRankings(staticConferences);
}
