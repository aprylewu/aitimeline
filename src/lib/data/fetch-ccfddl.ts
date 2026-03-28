import yaml from "js-yaml";
import type { CcfddlConference, CcfddlRawSeries } from "./types";

const TREE_URL =
  "https://api.github.com/repos/ccfddl/ccf-deadlines/git/trees/main?recursive=1";
const RAW_BASE =
  "https://raw.githubusercontent.com/ccfddl/ccf-deadlines/main";

function extractDate(datetime: string): string {
  return datetime.split(" ")[0];
}

function normalizeCcfTimezone(tz: string): string {
  if (tz === "UTC-12") {
    return "AoE";
  }

  return "UTC";
}

function flattenSeries(series: CcfddlRawSeries): CcfddlConference[] {
  return series.confs.map((conf) => {
    const timeline = conf.timeline[0];

    return {
      shortName: series.title,
      fullName: series.description,
      category: series.sub,
      rank: series.rank ?? {},
      year: conf.year,
      id: conf.id,
      website: conf.link,
      location: conf.place,
      timezone: normalizeCcfTimezone(conf.timezone),
      abstractDeadline: timeline?.abstract_deadline
        ? extractDate(timeline.abstract_deadline)
        : null,
      submissionDeadline: extractDate(timeline?.deadline ?? ""),
      conferenceDateStr: conf.date,
    };
  });
}

export async function fetchCcfddl(): Promise<CcfddlConference[]> {
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
          item.path.startsWith("conference/") &&
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
        const parsed = yaml.load(text) as CcfddlRawSeries[] | null;

        if (!Array.isArray(parsed)) {
          return [];
        }

        return parsed.flatMap(flattenSeries);
      });
  } catch {
    return [];
  }
}
