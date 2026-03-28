import yaml from "js-yaml";
import type { HfConference, HfRawConference } from "./types";

const TREE_URL =
  "https://api.github.com/repos/huggingface/ai-deadlines/git/trees/main?recursive=1";
const RAW_BASE =
  "https://raw.githubusercontent.com/huggingface/ai-deadlines/main";

function toHfConference(raw: HfRawConference): HfConference {
  const location = [raw.venue, raw.city, raw.country]
    .filter(Boolean)
    .join(", ");

  return {
    shortName: raw.title,
    fullName: raw.full_name ?? raw.title,
    year: raw.year,
    id: raw.id,
    website: raw.link,
    location: location || "TBA",
    deadlines: raw.deadlines.map((d) => ({
      type: d.type,
      label: d.label,
      date: d.date.split(" ")[0],
      timezone: d.timezone ?? "AoE",
    })),
    conferenceStart: raw.start ?? null,
    conferenceEnd: raw.end ?? null,
    rankingsStr: raw.rankings ?? null,
    tags: raw.tags ?? [],
  };
}

export async function fetchHfDeadlines(): Promise<HfConference[]> {
  try {
    const treeResponse = await fetch(TREE_URL);

    if (!treeResponse.ok) {
      return [];
    }

    const tree = await treeResponse.json();
    const yamlPaths: string[] = tree.tree
      .filter(
        (item: { path: string; type: string }) =>
          item.type === "blob" &&
          item.path.startsWith("src/data/conferences/") &&
          item.path.endsWith(".yml"),
      )
      .map((item: { path: string }) => item.path);

    const yamlTexts = await Promise.all(
      yamlPaths.map(async (path) => {
        const response = await fetch(`${RAW_BASE}/${path}`);

        if (!response.ok) {
          return null;
        }

        return response.text();
      }),
    );

    return yamlTexts
      .filter((text): text is string => text !== null)
      .flatMap((text) => {
        const parsed = yaml.load(text) as HfRawConference[] | null;

        if (!Array.isArray(parsed)) {
          return [];
        }

        return parsed.map(toHfConference);
      });
  } catch {
    return [];
  }
}
