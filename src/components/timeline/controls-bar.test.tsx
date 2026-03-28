import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { conferences } from "@/data/conferences";
import { TimelineBrowser } from "./timeline-browser";

it("updates the visible rows when search and presets change", async () => {
  const user = userEvent.setup();

  render(
    <TimelineBrowser
      conferences={conferences}
      now={new Date("2026-03-26T00:00:00Z")}
    />,
  );

  expect(screen.getByRole("button", { name: "AI / ML" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "6M" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  // Milestone filters are behind a dedicated "Milestones" popover.
  await user.click(screen.getByRole("button", { name: /milestones/i }));
  const milestoneDialog = screen.getByRole("dialog", {
    name: /milestone filter controls/i,
  });
  expect(
    within(
      screen.getByRole("group", { name: /milestone filters/i }),
    ).getByRole("button", { name: /notification/i }),
  ).toBeInTheDocument();
  expect(milestoneDialog.parentElement).toBe(document.body);

  await user.click(screen.getByRole("button", { name: "3M" }));
  expect(screen.getByRole("button", { name: "3M" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await user.type(screen.getByPlaceholderText(/search conferences/i), "icml");

  expect(screen.getByText(/icml/i)).toBeInTheDocument();
  expect(screen.queryByText(/neurips/i)).not.toBeInTheDocument();
});

it("closes the milestone popover on escape and restores button focus", async () => {
  const user = userEvent.setup();

  render(
    <TimelineBrowser
      conferences={conferences}
      now={new Date("2026-03-26T00:00:00Z")}
    />,
  );

  const filtersButton = screen.getByRole("button", { name: /milestones/i });

  await user.click(filtersButton);

  expect(filtersButton).toHaveAttribute("aria-expanded", "true");
  expect(
    screen.getByRole("group", { name: /milestone filters/i }),
  ).toBeInTheDocument();

  await user.keyboard("{Escape}");

  expect(
    screen.queryByRole("group", { name: /milestone filters/i }),
  ).not.toBeInTheDocument();
  expect(filtersButton).toHaveAttribute("aria-expanded", "false");
  expect(filtersButton).toHaveFocus();
});

it("shows inline clear and reset actions for active search filters", async () => {
  const user = userEvent.setup();

  render(
    <TimelineBrowser
      conferences={conferences}
      now={new Date("2026-03-26T00:00:00Z")}
    />,
  );

  const searchInput = screen.getByRole("textbox", {
    name: /search conferences/i,
  });

  await user.type(searchInput, "icml");

  expect(screen.getByRole("button", { name: /clear search/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /reset filters/i })).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /clear search/i }));

  expect(searchInput).toHaveValue("");
  expect(
    screen.queryByRole("button", { name: /clear search/i }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /reset filters/i }),
  ).not.toBeInTheDocument();
});
