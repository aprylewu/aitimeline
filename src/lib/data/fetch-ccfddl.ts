import yaml from "js-yaml";
import type { CcfddlConference, CcfddlRawSeries } from "./types";

const TREE_URL =
  "https://api.github.com/repos/ccfddl/ccf-deadlines/git/trees/main?recursive=1";
const RAW_BASE =
  "https://raw.githubusercontent.com/ccfddl/ccf-deadlines/main";

function extractDate(datetime: string): string {
  return datetime.split(" ")[0];
}

function isValidIanaTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/**
 * ccfddl YAML uses mixed labels: `AoE`, `UTC-12`, `UTC+0`, `UTC-8`, plain `UTC`, etc.
 * Previously anything other than `UTC-12` was forced to `UTC`, so real `AoE` rows were
 * interpreted as UTC end-of-day (≈ 08:00 next calendar day in China) instead of AoE.
 */
export function normalizeCcfTimezone(raw: string): string {
  const tz = raw.trim();
  const upper = tz.toUpperCase();

  if (upper === "AOE" || upper === "UTC-12") {
    return "AoE";
  }

  if (
    upper === "UTC" ||
    upper === "UTC+0" ||
    upper === "UTC-0" ||
    upper === "GMT" ||
    upper === "GMT+0" ||
    upper === "GMT-0"
  ) {
    return "UTC";
  }

  const utcOffset = tz.match(/^UTC([+-])(\d{1,2})(?::(\d{2}))?$/i);
  if (utcOffset) {
    const minutes = utcOffset[3] ? Number.parseInt(utcOffset[3], 10) : 0;
    if (minutes === 0) {
      const inverted = utcOffset[1] === "-" ? "+" : "-";
      const iana = `Etc/GMT${inverted}${utcOffset[2]}`;
      if (isValidIanaTimeZone(iana)) {
        return iana;
      }
    }
  }

  const gmtOffset = tz.match(/^GMT([+-])(\d{1,2})(?::(\d{2}))?$/i);
  if (gmtOffset) {
    const minutes = gmtOffset[3] ? Number.parseInt(gmtOffset[3], 10) : 0;
    if (minutes === 0) {
      const inverted = gmtOffset[1] === "-" ? "+" : "-";
      const iana = `Etc/GMT${inverted}${gmtOffset[2]}`;
      if (isValidIanaTimeZone(iana)) {
        return iana;
      }
    }
  }

  if (isValidIanaTimeZone(tz)) {
    return tz;
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
