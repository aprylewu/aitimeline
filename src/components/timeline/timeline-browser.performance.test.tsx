import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { conferences } from "@/data/conferences";

const { organizeConferenceSectionsSpy } = vi.hoisted(() => ({
  organizeConferenceSectionsSpy: vi.fn(({ conferences: inputConferences }) => ({
    active: inputConferences,
    past: [],
  })),
}));

vi.mock("@/lib/timeline/sections", () => ({
  organizeConferenceSections: organizeConferenceSectionsSpy,
}));

import { TimelineBrowser } from "./timeline-browser";

beforeEach(() => {
  organizeConferenceSectionsSpy.mockClear();
});

it("does not recompute sections when only the theme changes", async () => {
  const user = userEvent.setup();

  render(
    <TimelineBrowser
      conferences={conferences}
      now={new Date("2026-03-26T00:00:00Z")}
    />,
  );

  expect(organizeConferenceSectionsSpy).toHaveBeenCalledTimes(1);

  await user.click(screen.getByRole("button", { name: /dark mode/i }));

  expect(screen.getByTestId("timeline-browser")).toHaveAttribute(
    "data-theme",
    "dark",
  );
  expect(organizeConferenceSectionsSpy).toHaveBeenCalledTimes(1);
});
