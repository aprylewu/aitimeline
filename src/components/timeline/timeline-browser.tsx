"use client";

import { useState } from "react";
import { addMonths, parseISO, subMonths } from "date-fns";
import { ControlsBar } from "./controls-bar";
import { getDefaultVisibleRange } from "@/lib/timeline/date-range";
import { filterConferences } from "@/lib/timeline/filtering";
import type {
  Conference,
  ConferenceCategory,
  MilestoneType,
} from "@/types/conference";

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

function toggleSetValue<T>(current: Set<T>, value: T) {
  const next = new Set(current);

  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }

  return next;
}

function getAllRange(conferences: Conference[]) {
  const points = conferences.flatMap((conference) =>
    conference.milestones.flatMap((milestone) => [
      parseISO(milestone.dateStart),
      parseISO(milestone.dateEnd ?? milestone.dateStart),
    ]),
  );

  return {
    start: new Date(Math.min(...points.map((point) => point.getTime()))),
    end: new Date(Math.max(...points.map((point) => point.getTime()))),
  };
}

export function TimelineBrowser({ conferences, now }: TimelineBrowserProps) {
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<Set<ConferenceCategory>>(
    () => new Set(),
  );
  const [visibleRange, setVisibleRange] = useState(() =>
    getDefaultVisibleRange(now),
  );
  const [visibleMilestoneTypes, setVisibleMilestoneTypes] = useState(
    () => new Set<MilestoneType>(DEFAULT_VISIBLE_MILESTONE_TYPES),
  );

  const availableCategories = Array.from(
    new Set(conferences.map((conference) => conference.category)),
  ).sort();

  const availableMilestoneTypes = DEFAULT_VISIBLE_MILESTONE_TYPES.filter((type) =>
    conferences.some((conference) =>
      conference.milestones.some((milestone) => milestone.type === type),
    ),
  );

  function handlePresetSelect(preset: "3M" | "6M" | "12M" | "All") {
    if (preset === "All") {
      setVisibleRange(getAllRange(conferences));
      return;
    }

    const months = Number.parseInt(preset, 10);
    const monthsBack = Math.max(1, Math.floor(months / 3));

    setVisibleRange({
      start: subMonths(now, monthsBack),
      end: addMonths(now, months - monthsBack),
    });
  }

  const visibleConferences = filterConferences({
    conferences,
    query,
    categories,
    visibleMilestoneTypes,
    visibleRange,
  });

  return (
    <main className="min-h-screen bg-stone-50 text-neutral-900">
      <ControlsBar
        query={query}
        onQueryChange={setQuery}
        availableCategories={availableCategories}
        categories={categories}
        onCategoryToggle={(value) =>
          setCategories((current) => toggleSetValue(current, value))
        }
        availableMilestoneTypes={availableMilestoneTypes}
        visibleMilestoneTypes={visibleMilestoneTypes}
        onMilestoneToggle={(value) =>
          setVisibleMilestoneTypes((current) => toggleSetValue(current, value))
        }
        onPresetSelect={handlePresetSelect}
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
