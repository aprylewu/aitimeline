export type ConferenceCategory =
  | "AI"
  | "CG"
  | "CT"
  | "DB"
  | "DS"
  | "HI"
  | "MX"
  | "NW"
  | "SC"
  | "SE";

export type MilestoneType =
  | "abstract"
  | "fullPaper"
  | "supplementary"
  | "rebuttalStart"
  | "rebuttalEnd"
  | "notification"
  | "cameraReady"
  | "conferenceStart"
  | "conferenceEnd"
  | "workshop";

export interface ConferenceRanking {
  ccf?: string;
  core?: string;
  thcpl?: string;
}

export interface Milestone {
  id: string;
  type: MilestoneType;
  label: string;
  dateStart: string;
  dateEnd?: string;
  timezone: string;
  importance: "primary" | "secondary";
  note?: string;
}

export interface Conference {
  id: string;
  slug: string;
  title: string;
  shortName: string;
  year: number;
  website: string;
  location: string;
  category: ConferenceCategory;
  rankings: ConferenceRanking;
  milestones: Milestone[];
}
