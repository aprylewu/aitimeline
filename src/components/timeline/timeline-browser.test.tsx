import { render, screen, within } from "@testing-library/react";
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
    screen.getByRole("button", { name: /clear filters/i }),
  ).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /clear filters/i }));

  expect(screen.getByText("CHI")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /milestones/i }));

  const milestoneButtons = within(
    screen.getByRole("group", { name: /milestone filters/i }),
  ).getAllByRole("button", {
    pressed: true,
  });

  for (const button of milestoneButtons) {
    await user.click(button);
  }

  expect(
    screen.getByText("No conferences match the current filters."),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /clear filters/i }),
  ).toBeInTheDocument();
});

it("drags the timeline surface horizontally with pointer input", async () => {
  const user = userEvent.setup();

  render(
    <TimelineBrowser
      conferences={conferences}
      now={new Date("2026-03-26T00:00:00Z")}
    />,
  );

  const surface = screen.getByTestId("timeline-surface");

  Object.defineProperty(surface, "scrollLeft", {
    value: 120,
    writable: true,
  });
  Object.defineProperty(surface, "scrollWidth", {
    value: 2000,
    configurable: true,
  });
  Object.defineProperty(surface, "clientWidth", {
    value: 800,
    configurable: true,
  });
  Object.defineProperty(surface, "setPointerCapture", {
    value: vi.fn(),
    configurable: true,
  });
  Object.defineProperty(surface, "releasePointerCapture", {
    value: vi.fn(),
    configurable: true,
  });

  await user.pointer([
    {
      target: surface,
      keys: "[MouseLeft>]",
      coords: { x: 300, y: 20 },
    },
    {
      target: surface,
      coords: { x: 220, y: 20 },
    },
    {
      target: surface,
      keys: "[/MouseLeft]",
    },
  ]);

  expect(surface.scrollLeft).toBeGreaterThan(120);
});

it("keeps the empty-data state stable when the all-range preset is selected", async () => {
  const user = userEvent.setup();

  render(
    <TimelineBrowser
      conferences={[]}
      now={new Date("2026-03-26T00:00:00Z")}
    />,
  );

  expect(
    screen.getByText("No conference data is available right now."),
  ).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "All" }));

  expect(
    screen.getByText("No conference data is available right now."),
  ).toBeInTheDocument();
  expect(
    screen.getByText("Try again later or refresh after the data sources recover."),
  ).toBeInTheDocument();
});
