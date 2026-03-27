import { isBefore } from "date-fns";
import { getPrimaryPathTypes } from "./key-path";
import { filterConferences } from "./filtering";
import { getMilestoneInstant } from "./milestone-time";
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
  viewerTimeZone?: string;
  now: Date;
}

function findMilestone(conference: Conference, type: MilestoneType) {
  return conference.milestones.find((milestone) => milestone.type === type);
}

function getConferenceSortTime(
  conference: Conference,
  viewerTimeZone?: string,
) {
  const sortMilestone =
    findMilestone(conference, "abstract") ??
    findMilestone(conference, "fullPaper") ??
    conference.milestones[0];

  return sortMilestone
    ? getMilestoneInstant(sortMilestone, viewerTimeZone).getTime()
    : Number.MAX_SAFE_INTEGER;
}

function getDecisionMilestone(conference: Conference): Milestone | undefined {
  return findMilestone(conference, "notification");
}

function hasRenderablePrimaryPath(conference: Conference) {
  return getPrimaryPathTypes(conference.milestones).length >= 2;
}

function isConferencePast(
  conference: Conference,
  now: Date,
  viewerTimeZone?: string,
) {
  const decisionMilestone = getDecisionMilestone(conference);

  if (!decisionMilestone) {
    return false;
  }

  return isBefore(getMilestoneInstant(decisionMilestone, viewerTimeZone), now);
}

export function organizeConferenceSections({
  conferences,
  query,
  categories,
  visibleMilestoneTypes,
  visibleRange,
  viewerTimeZone,
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
    viewerTimeZone,
  })
    .filter((conference) => {
      const sourceConference = conferenceLookup.get(conference.id) ?? conference;
      return hasRenderablePrimaryPath(sourceConference);
    })
    .sort((left, right) => {
      const leftSource = conferenceLookup.get(left.id) ?? left;
      const rightSource = conferenceLookup.get(right.id) ?? right;

      return (
        getConferenceSortTime(leftSource, viewerTimeZone) -
        getConferenceSortTime(rightSource, viewerTimeZone)
      );
    });

  return visibleConferences.reduce(
    (sections, conference) => {
      const sourceConference = conferenceLookup.get(conference.id) ?? conference;

      if (isConferencePast(sourceConference, now, viewerTimeZone)) {
        sections.past.push(conference);
      } else {
        sections.active.push(conference);
      }

      return sections;
    },
    { active: [] as Conference[], past: [] as Conference[] },
  );
}
