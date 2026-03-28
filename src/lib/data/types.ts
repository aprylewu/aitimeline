/** Raw shape of a single ccfddl YAML file (top-level array element). */
export interface CcfddlRawSeries {
  title: string;
  description: string;
  sub: string;
  rank: {
    ccf?: string;
    core?: string;
    thcpl?: string;
  };
  dblp?: string;
  confs: CcfddlRawConf[];
}

export interface CcfddlRawConf {
  year: number;
  id: string;
  link: string;
  timeline: Array<{
    abstract_deadline?: string;
    deadline: string;
    comment?: string;
  }>;
  timezone: string;
  date: string;
  place: string;
}

/** Flattened ccfddl conference (one per series+year). */
export interface CcfddlConference {
  shortName: string;
  fullName: string;
  category: string;
  rank: { ccf?: string; core?: string; thcpl?: string };
  year: number;
  id: string;
  website: string;
  location: string;
  timezone: string;
  abstractDeadline: string | null;
  submissionDeadline: string;
  conferenceDateStr: string;
}

/** Raw shape of a single HF YAML file entry. */
export interface HfRawConference {
  title: string;
  year: number;
  id: string;
  full_name?: string;
  link: string;
  deadlines: Array<{
    type: string;
    label: string;
    date: string;
    timezone?: string;
  }>;
  date?: string;
  start?: string;
  end?: string;
  city?: string;
  country?: string;
  venue?: string;
  rankings?: string;
  hindex?: number;
  tags?: string[];
}

/** Flattened HF conference. */
export interface HfConference {
  shortName: string;
  fullName: string;
  year: number;
  id: string;
  website: string;
  location: string;
  deadlines: Array<{
    type: string;
    label: string;
    date: string;
    timezone: string;
  }>;
  conferenceStart: string | null;
  conferenceEnd: string | null;
  rankingsStr: string | null;
  tags: string[];
}
