import { parseISO } from "date-fns";
import type {
  Conference,
  ConferenceCategory,
  Milestone,
  MilestoneType,
} from "@/types/conference";

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

function intersectsVisibleRange(milestone: Milestone, range: VisibleRange) {
  const start = parseISO(milestone.dateStart);
  const end = parseISO(milestone.dateEnd ?? milestone.dateStart);

  return start <= range.end && end >= range.start;
}

export function filterConferences(args: FilterArgs): Conference[] {
  const { conferences, query, categories, visibleMilestoneTypes, visibleRange } =
    args;

  return conferences
    .filter((conference) => {
      if (categories.size > 0 && !categories.has(conference.category)) {
        return false;
      }

      return matchesQuery(conference, query);
    })
    .map((conference) => ({
      ...conference,
      milestones: conference.milestones.filter(
        (milestone) =>
          visibleMilestoneTypes.has(milestone.type) &&
          intersectsVisibleRange(milestone, visibleRange),
      ),
    }))
    .filter((conference) => conference.milestones.length > 0);
}
