import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
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
  expect(document.documentElement).toHaveAttribute("data-theme", "light");
  expect(document.body).toHaveAttribute("data-theme", "light");

  await user.click(screen.getByRole("button", { name: /dark mode/i }));

  expect(browser).toHaveAttribute("data-theme", "dark");
  await waitFor(() => {
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(document.body).toHaveAttribute("data-theme", "dark");
  });
});

it("shows active and past sections, a today marker, and hover click hints", async () => {
  const user = userEvent.setup();

  render(
    <TimelineBrowser
      conferences={conferences}
      now={new Date("2026-03-26T00:00:00Z")}
      viewerTimeZone="UTC"
    />,
  );

  expect(screen.getByText("Active")).toBeInTheDocument();
  expect(screen.getByText("Past")).toBeInTheDocument();
  expect(screen.getByTestId("today-line")).toBeInTheDocument();
  expect(screen.getAllByLabelText(/camera-ready/i).length).toBeGreaterThan(0);
  expect(screen.getAllByLabelText(/conference starts/i).length).toBeGreaterThan(0);
  expect(screen.queryByText("NeurIPS")).toBeInTheDocument();
  expect(screen.queryByText(conferences[0]!.location)).not.toBeInTheDocument();

  const trigger = screen.getByTestId("conference-trigger-colm-2026");
  await user.hover(trigger);

  expect(trigger).toHaveClass("conference-trigger--hovered");
  expect(screen.queryByText(conferences[0]!.location)).not.toBeInTheDocument();
});

it("shows the current viewer-local timestamp beside the today marker", () => {
  render(
    <TimelineBrowser
      conferences={conferences}
      now={new Date("2026-03-26T00:00:00Z")}
      viewerTimeZone="Asia/Shanghai"
    />,
  );

  expect(screen.getByTestId("today-label")).toHaveTextContent("Mar 26 08:00 GMT+8");
});

it("shows Abstract milestones by default when they differ from the full paper deadline", () => {
  render(
    <TimelineBrowser
      conferences={conferences}
      now={new Date("2026-03-26T00:00:00Z")}
    />,
  );

  expect(screen.getAllByLabelText("Abstract").length).toBeGreaterThan(0);
});

it("shows inline conference details when a conference title is clicked", async () => {
  const user = userEvent.setup();

  render(
    <TimelineBrowser
      conferences={conferences}
      now={new Date("2026-03-26T00:00:00Z")}
    />,
  );

  await user.click(screen.getByTestId("conference-trigger-colm-2026"));

  expect(screen.getByTestId("conference-detail-row-colm-2026")).toHaveAttribute(
    "aria-hidden",
    "false",
  );
});

it("keeps the sticky controls bar above expanded timeline details", async () => {
  const user = userEvent.setup();

  render(
    <TimelineBrowser
      conferences={conferences}
      now={new Date("2026-03-26T00:00:00Z")}
    />,
  );

  await user.click(screen.getByTestId("conference-trigger-colm-2026"));

  const controlsBar = screen
    .getByPlaceholderText(/search conferences/i)
    .closest(".sticky");

  expect(controlsBar).toHaveClass("top-0");
  expect(controlsBar).toHaveClass("z-40");
  expect(screen.getByTestId("conference-detail-meta-colm-2026")).toHaveClass(
    "z-10",
  );
});

it("uses a horizontally scrollable surface without creating an inner vertical scroll area", () => {
  render(
    <TimelineBrowser
      conferences={conferences}
      now={new Date("2026-03-26T00:00:00Z")}
    />,
  );

  const surface = screen.getByTestId("timeline-surface");

  expect(surface).toHaveClass("overflow-x-auto");
  expect(surface).toHaveClass("overflow-y-hidden");
});

it("shows the clear action for non-default preset and milestone filters", async () => {
  const user = userEvent.setup();

  render(
    <TimelineBrowser
      conferences={conferences}
      now={new Date("2025-04-20T00:00:00Z")}
    />,
  );

  expect(screen.getByText("AAAI")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "3M" }));

  expect(
    screen.getByText("No conferences match the current filters."),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /clear filters/i }),
  ).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /clear filters/i }));

  expect(screen.getByText("AAAI")).toBeInTheDocument();

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

it("starts with a horizontally scrollable timeline focused on the default two-month back and four-month forward window", async () => {
  const clientWidthSpy = vi
    .spyOn(HTMLElement.prototype, "clientWidth", "get")
    .mockReturnValue(960);
  const ResizeObserverMock = class {
    constructor(
      private readonly callback: ResizeObserverCallback,
    ) {}

    observe(target: Element) {
      this.callback(
        [
          {
            target,
            contentRect: {
              width: 960,
              height: 480,
              top: 0,
              left: 0,
              bottom: 480,
              right: 960,
              x: 0,
              y: 0,
              toJSON: () => ({}),
            },
          } as ResizeObserverEntry,
        ],
        this as unknown as ResizeObserver,
      );
    }

    unobserve() {}

    disconnect() {}
  };

  vi.stubGlobal("ResizeObserver", ResizeObserverMock);

  render(
    <TimelineBrowser
      conferences={conferences}
      now={new Date("2026-03-27T00:00:00Z")}
    />,
  );

  await waitFor(() => {
    expect(screen.getByTestId("timeline-surface").scrollLeft).toBeGreaterThan(0);
  });

  clientWidthSpy.mockRestore();
  vi.unstubAllGlobals();
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
