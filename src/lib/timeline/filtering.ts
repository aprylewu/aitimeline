import type {
  Conference,
  ConferenceCategory,
  Milestone,
  MilestoneType,
} from "@/types/conference";
import { getMilestoneRange } from "./milestone-time";

interface VisibleRange {
  start: Date;
  end: Date;
}

interface FilterArgs {
  conferences: Conference[];
  query: string;
  categories: Set<ConferenceCategory>;
  visibleMilestoneTypes: Set<MilestoneType>;
  visibleRange: VisibleRange;
  viewerTimeZone?: string;
}

function matchesQuery(conference: Conference, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return [conference.shortName, conference.title, conference.location].some(
    (value) => value.toLowerCase().includes(normalizedQuery),
  );
}

function intersectsVisibleRange(
  milestone: Milestone,
  range: VisibleRange,
  viewerTimeZone?: string,
) {
  const { start, end } = getMilestoneRange(milestone, viewerTimeZone);

  return start <= range.end && end >= range.start;
}

export function filterConferences(args: FilterArgs): Conference[] {
  const {
    conferences,
    query,
    categories,
    visibleMilestoneTypes,
    visibleRange,
    viewerTimeZone,
  } =
    args;

  return conferences
    .filter((conference) => {
      if (categories.size > 0 && !categories.has(conference.category)) {
        return false;
      }

      if (!matchesQuery(conference, query)) {
        return false;
      }

      return conference.milestones.some(
        (milestone) =>
          visibleMilestoneTypes.has(milestone.type) &&
          intersectsVisibleRange(milestone, visibleRange, viewerTimeZone),
      );
    });
}
