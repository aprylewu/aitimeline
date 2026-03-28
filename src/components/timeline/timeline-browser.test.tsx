import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { conferences } from "@/data/conferences";
import { TimelineBrowser } from "./timeline-browser";

it("renders one shared gantt surface and supports dark mode", async () => {
  const user = userEvent.setup();

  render(
    <TimelineBrowser
      conferences={conferences}
      now={new Date("2026-03-26T00:00:00Z")}
    />,
  );

  const browser = screen.getByTestId("timeline-browser");

  expect(
    screen.getByPlaceholderText(/search conferences/i),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "6M" })).toBeInTheDocument();
  expect(screen.getByText(conferences[0]!.shortName)).toBeInTheDocument();
  expect(screen.getAllByTestId("timeline-surface")).toHaveLength(1);
  expect(browser).toHaveAttribute("data-theme", "light");

  await user.click(screen.getByRole("button", { name: /dark mode/i }));

  expect(browser).toHaveAttribute("data-theme", "dark");
});

it("shows active and past sections, a today marker, and hover details", async () => {
  const user = userEvent.setup();

  render(
    <TimelineBrowser
      conferences={conferences}
      now={new Date("2026-03-26T00:00:00Z")}
    />,
  );

  expect(screen.getByText("Active")).toBeInTheDocument();
  expect(screen.getByText("Past")).toBeInTheDocument();
  expect(screen.getByTestId("today-line")).toBeInTheDocument();
  expect(screen.getByLabelText(/camera-ready/i)).toBeInTheDocument();
  expect(screen.getAllByLabelText(/conference starts/i).length).toBeGreaterThan(0);
  expect(screen.queryByText("NeurIPS")).toBeInTheDocument();
  expect(screen.queryByText(conferences[0]!.location)).not.toBeInTheDocument();

  await user.hover(screen.getByTestId("conference-trigger-colm-2026"));

  expect(screen.getByText(conferences[0]!.location)).toBeInTheDocument();
});

it("shows the clear action for non-default preset and milestone filters", async () => {
  const user = userEvent.setup();

  render(
    <TimelineBrowser
      conferences={conferences}
      now={new Date("2025-06-20T00:00:00Z")}
    />,
  );

  expect(screen.getByText("CHI")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "3M" }));

  expect(
    screen.getByText("No conferences match the current filters."),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /clear all filters/i }),
  ).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /clear all filters/i }));

  expect(screen.getByText("CHI")).toBeInTheDocument();

  const milestoneButtons = screen.getAllByRole("button", {
    pressed: true,
  });

  for (const button of milestoneButtons) {
    await user.click(button);
  }

  expect(
    screen.getByText("No conferences match the current filters."),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /clear all filters/i }),
  ).toBeInTheDocument();
});
