"use client";

import { useState } from "react";
import { ControlsBar } from "./controls-bar";
import { getDefaultVisibleRange } from "@/lib/timeline/date-range";
import { filterConferences } from "@/lib/timeline/filtering";
import type { Conference, MilestoneType } from "@/types/conference";

interface TimelineBrowserProps {
  conferences: Conference[];
  now: Date;
}

const DEFAULT_VISIBLE_MILESTONE_TYPES: MilestoneType[] = [
  "abstract",
  "fullPaper",
  "supplementary",
  "rebuttalStart",
  "rebuttalEnd",
  "notification",
  "cameraReady",
  "conferenceStart",
  "conferenceEnd",
  "workshop",
];

export function TimelineBrowser({ conferences, now }: TimelineBrowserProps) {
  const [query, setQuery] = useState("");
  const [visibleRange, setVisibleRange] = useState(() =>
    getDefaultVisibleRange(now),
  );
  const [visibleMilestoneTypes] = useState(
    () => new Set<MilestoneType>(DEFAULT_VISIBLE_MILESTONE_TYPES),
  );

  const visibleConferences = filterConferences({
    conferences,
    query,
    categories: new Set(),
    visibleMilestoneTypes,
    visibleRange,
  });

  return (
    <main className="min-h-screen bg-stone-50 text-neutral-900">
      <ControlsBar
        query={query}
        onQueryChange={setQuery}
        visibleRange={visibleRange}
        onRangeChange={setVisibleRange}
      />
      <section className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="text-4xl font-semibold tracking-tight">
          Conference Timeline
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-neutral-600">
          Compare full paper, rebuttal, and notification milestones across
          active venues.
        </p>
        <div className="mt-8 space-y-3">
          {visibleConferences.map((conference) => (
            <article
              key={conference.id}
              className="rounded-3xl border border-black/8 bg-white px-5 py-4 shadow-sm"
            >
              <p className="text-base font-semibold">{conference.shortName}</p>
              <p className="mt-1 text-sm text-neutral-600">{conference.title}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
