import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { conferences } from "@/data/conferences";

const { renderCounts } = vi.hoisted(() => ({
  renderCounts: new Map<string, number>(),
}));

vi.mock("./conference-meta-column", () => ({
  ConferenceMetaColumn: ({
    conference,
    compact = false,
  }: {
    conference: { id: string; shortName: string };
    compact?: boolean;
  }) => {
    const key = `${conference.id}:${compact ? "compact" : "detail"}`;
    renderCounts.set(key, (renderCounts.get(key) ?? 0) + 1);

    return <div data-testid={`conference-meta-${key}`}>{conference.shortName}</div>;
  },
}));

import { TimelineGrid } from "./timeline-grid";

beforeEach(() => {
  renderCounts.clear();
});

it("does not rerender unrelated conference metadata when hovering a marker", async () => {
  const user = userEvent.setup();
  const [firstConference, secondConference] = conferences;

  render(
    <TimelineGrid
      sections={[
        {
          id: "active",
          label: "Active",
          conferences: [firstConference!, secondConference!],
        },
      ]}
      visibleRange={{
        start: new Date("2026-01-01T00:00:00Z"),
        end: new Date("2026-12-31T00:00:00Z"),
      }}
      now={new Date("2026-03-26T00:00:00Z")}
    />,
  );

  expect(renderCounts.get(`${firstConference!.id}:compact`)).toBe(1);
  expect(renderCounts.get(`${secondConference!.id}:compact`)).toBe(1);

  await user.hover(screen.getAllByLabelText("Full paper")[0]!);

  expect(screen.getByTestId("milestone-tooltip")).toBeInTheDocument();
  expect(renderCounts.get(`${secondConference!.id}:compact`)).toBe(1);
});
