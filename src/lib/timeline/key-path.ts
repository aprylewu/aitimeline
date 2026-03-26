import type { Milestone, MilestoneType } from "@/types/conference";

const PRIMARY_PATH: MilestoneType[] = [
  "fullPaper",
  "rebuttalStart",
  "notification",
];

export function getPrimaryPathTypes(milestones: Milestone[]) {
  return PRIMARY_PATH.filter((type) =>
    milestones.some((milestone) => milestone.type === type),
  );
}
