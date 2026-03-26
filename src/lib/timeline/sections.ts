import { endOfDay, isBefore, parseISO } from "date-fns";
import { filterConferences } from "./filtering";
import type {
  Conference,
  ConferenceCategory,
  Milestone,
  MilestoneType,
} from "@/types/conference";

interface OrganizeConferenceSectionsArgs {
  conferences: Conference[];
  query: string;
  categories: Set<ConferenceCategory>;
  visibleMilestoneTypes: Set<MilestoneType>;
  visibleRange: {
    start: Date;
    end: Date;
  };
  now: Date;
}

function findMilestone(conference: Conference, type: MilestoneType) {
  return conference.milestones.find((milestone) => milestone.type === type);
}

function getConferenceSortTime(conference: Conference) {
  const sortMilestone =
    findMilestone(conference, "abstract") ??
    findMilestone(conference, "fullPaper") ??
    conference.milestones[0];

  return sortMilestone ? parseISO(sortMilestone.dateStart).getTime() : Number.MAX_SAFE_INTEGER;
}

function getDecisionMilestone(conference: Conference): Milestone | undefined {
  return findMilestone(conference, "notification");
}

function hasRenderablePrimaryPath(conference: Conference) {
  return ["fullPaper", "rebuttalStart", "notification"].every((type) =>
    conference.milestones.some((milestone) => milestone.type === type),
  );
}

function isConferencePast(conference: Conference, now: Date) {
  const decisionMilestone = getDecisionMilestone(conference);

  if (!decisionMilestone) {
    return false;
  }

  return isBefore(endOfDay(parseISO(decisionMilestone.dateStart)), now);
}

export function organizeConferenceSections({
  conferences,
  query,
  categories,
  visibleMilestoneTypes,
  visibleRange,
  now,
}: OrganizeConferenceSectionsArgs) {
  const conferenceLookup = new Map(
    conferences.map((conference) => [conference.id, conference]),
  );

  const visibleConferences = filterConferences({
    conferences,
    query,
    categories,
    visibleMilestoneTypes,
    visibleRange,
  })
    .filter((conference) => {
      const sourceConference = conferenceLookup.get(conference.id) ?? conference;
      return hasRenderablePrimaryPath(sourceConference);
    })
    .sort((left, right) => {
      const leftSource = conferenceLookup.get(left.id) ?? left;
      const rightSource = conferenceLookup.get(right.id) ?? right;

      return (
        getConferenceSortTime(leftSource) - getConferenceSortTime(rightSource)
      );
    });

  return visibleConferences.reduce(
    (sections, conference) => {
      const sourceConference = conferenceLookup.get(conference.id) ?? conference;

      if (isConferencePast(sourceConference, now)) {
        sections.past.push(conference);
      } else {
        sections.active.push(conference);
      }

      return sections;
    },
    { active: [] as Conference[], past: [] as Conference[] },
  );
}
