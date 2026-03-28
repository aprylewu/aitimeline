import type { Conference, ConferenceCategory, Milestone, MilestoneType } from "@/types/conference";
import { inferCategory } from "./category";
import { parseRankingsString } from "./rankings";
import { normalizeSlug } from "./slug";
import type { CcfddlConference, HfConference } from "./types";

const HF_TYPE_MAP: Record<string, MilestoneType> = {
  abstract: "abstract",
  paper: "fullPaper",
  submission: "fullPaper",
  supplementary: "supplementary",
  rebuttal_start: "rebuttalStart",
  rebuttal_end: "rebuttalEnd",
  notification: "notification",
  camera_ready: "cameraReady",
};

const PRIMARY_TYPES = new Set<MilestoneType>([
  "fullPaper",
  "rebuttalStart",
  "rebuttalEnd",
  "notification",
]);

function makeId(shortName: string, year: number): string {
  return `${shortName.toLowerCase().replace(/\s+/g, "-")}-${year}`;
}

function makeMilestone(
  confId: string,
  type: MilestoneType,
  label: string,
  dateStart: string,
  timezone: string,
): Milestone {
  return {
    id: `${confId}-${type}-${dateStart}`,
    type,
    label,
    dateStart,
    timezone,
    importance: PRIMARY_TYPES.has(type) ? "primary" : "secondary",
  };
}

function hfToMilestones(confId: string, hf: HfConference): Milestone[] {
  const milestones: Milestone[] = [];

  for (const deadline of hf.deadlines) {
    const type = HF_TYPE_MAP[deadline.type];

    if (!type) {
      continue;
    }

    milestones.push(
      makeMilestone(confId, type, deadline.label, deadline.date, deadline.timezone),
    );
  }

  if (hf.conferenceStart) {
    milestones.push(
      makeMilestone(confId, "conferenceStart", "Conference starts", hf.conferenceStart, "Local"),
    );
  }

  if (hf.conferenceEnd) {
    milestones.push(
      makeMilestone(confId, "conferenceEnd", "Conference ends", hf.conferenceEnd, "Local"),
    );
  }

  return milestones;
}

function ccfddlToMilestones(confId: string, ccf: CcfddlConference): Milestone[] {
  const milestones: Milestone[] = [];

  if (ccf.abstractDeadline) {
    milestones.push(
      makeMilestone(confId, "abstract", "Abstract", ccf.abstractDeadline, ccf.timezone),
    );
  }

  if (ccf.submissionDeadline) {
    milestones.push(
      makeMilestone(confId, "fullPaper", "Full paper", ccf.submissionDeadline, ccf.timezone),
    );
  }

  return milestones;
}

function isValidCategory(sub: string): sub is ConferenceCategory {
  return ["AI", "CG", "CT", "DB", "DS", "HI", "MX", "NW", "SC", "SE"].includes(sub);
}

export function mergeSources(
  ccfddlEntries: CcfddlConference[],
  hfEntries: HfConference[],
): Conference[] {
  const hfBySlugYear = new Map<string, HfConference>();

  for (const hf of hfEntries) {
    const key = `${normalizeSlug(hf.shortName)}-${hf.year}`;
    hfBySlugYear.set(key, hf);
  }

  const result: Conference[] = [];
  const processedHfKeys = new Set<string>();

  for (const ccf of ccfddlEntries) {
    const key = `${normalizeSlug(ccf.shortName)}-${ccf.year}`;
    const hfMatch = hfBySlugYear.get(key);
    const confId = makeId(ccf.shortName, ccf.year);
    const category = isValidCategory(ccf.category) ? ccf.category : "AI";

    if (hfMatch) {
      processedHfKeys.add(key);
      result.push({
        id: confId,
        slug: confId,
        title: ccf.fullName,
        shortName: ccf.shortName,
        year: ccf.year,
        website: hfMatch.website || ccf.website,
        location: hfMatch.location || ccf.location,
        category,
        rankings: ccf.rank,
        milestones: hfToMilestones(confId, hfMatch),
      });
    } else {
      result.push({
        id: confId,
        slug: confId,
        title: ccf.fullName,
        shortName: ccf.shortName,
        year: ccf.year,
        website: ccf.website,
        location: ccf.location,
        category,
        rankings: ccf.rank,
        milestones: ccfddlToMilestones(confId, ccf),
      });
    }
  }

  for (const hf of hfEntries) {
    const key = `${normalizeSlug(hf.shortName)}-${hf.year}`;

    if (processedHfKeys.has(key)) {
      continue;
    }

    const confId = makeId(hf.shortName, hf.year);

    result.push({
      id: confId,
      slug: confId,
      title: hf.fullName,
      shortName: hf.shortName,
      year: hf.year,
      website: hf.website,
      location: hf.location,
      category: inferCategory(hf.tags),
      rankings: parseRankingsString(hf.rankingsStr),
      milestones: hfToMilestones(confId, hf),
    });
  }

  return result;
}
