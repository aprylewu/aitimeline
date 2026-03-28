import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { conferences } from "@/data/conferences";
import { TimelineGrid } from "./timeline-grid";

it("renders a continuous primary path bar", () => {
  render(
    <TimelineGrid
      sections={[
        {
          id: "active",
          label: "Active",
          conferences: conferences.slice(0, 1),
        },
      ]}
      visibleRange={{
        start: new Date("2026-01-01T00:00:00Z"),
        end: new Date("2026-12-31T00:00:00Z"),
      }}
      now={new Date("2026-03-26T00:00:00Z")}
    />,
  );

  const path = screen.getByTestId("primary-path-colm-2026");
  expect(path).toHaveAttribute("data-path-start", "fullPaper");
  expect(path).toHaveAttribute("data-path-end", "notification");
});

it("renders highlighted primary milestones and shows a tooltip on hover", async () => {
  const user = userEvent.setup();

  render(
    <TimelineGrid
      sections={[
        {
          id: "active",
          label: "Active",
          conferences: conferences.slice(0, 1),
        },
      ]}
      visibleRange={{
        start: new Date("2026-01-01T00:00:00Z"),
        end: new Date("2026-12-31T00:00:00Z"),
      }}
      now={new Date("2026-03-26T00:00:00Z")}
    />,
  );

  const fullPaperNode = screen.getByLabelText(/full paper/i);
  expect(fullPaperNode).toHaveAttribute("data-primary-path", "true");

  await user.hover(fullPaperNode);
  expect(screen.getByText(/full paper/i)).toBeInTheDocument();
  expect(screen.getByTestId("milestone-tooltip")).toHaveStyle({
    minWidth: "min(18rem, calc(100vw - 2rem))",
  });
  expect(screen.getByTestId("milestone-tooltip")).toHaveClass(
    "max-w-[min(24rem,calc(100vw-2rem))]",
  );
  expect(screen.getByTestId("milestone-tooltip")).toHaveClass(
    "timeline-floating-surface",
  );
  expect(screen.getByTestId("milestone-tooltip")).not.toHaveClass(
    "backdrop-blur-xl",
  );
  expect(fullPaperNode).not.toContainElement(
    screen.getByTestId("milestone-tooltip"),
  );
});

it("renders a separate today label and an animated conference detail card", async () => {
  const user = userEvent.setup();

  render(
    <TimelineGrid
      sections={[
        {
          id: "active",
          label: "Active",
          conferences: conferences.slice(0, 1),
        },
      ]}
      visibleRange={{
        start: new Date("2026-01-01T00:00:00Z"),
        end: new Date("2026-12-31T00:00:00Z"),
      }}
      now={new Date("2026-03-26T00:00:00Z")}
    />,
  );

  expect(screen.getByTestId("today-label")).toHaveTextContent("Today");

  await user.hover(screen.getByTestId("conference-trigger-colm-2026"));

  expect(
    screen.getByTestId("conference-detail-card-colm-2026"),
  ).toHaveClass("conference-detail-card");
  expect(
    screen.getByTestId("conference-detail-card-colm-2026"),
  ).toHaveClass("timeline-floating-surface");
});

it("keeps the sticky meta cell as the positioning context for the detail card", async () => {
  const user = userEvent.setup();

  render(
    <TimelineGrid
      sections={[
        {
          id: "active",
          label: "Active",
          conferences: conferences.slice(0, 1),
        },
      ]}
      visibleRange={{
        start: new Date("2026-01-01T00:00:00Z"),
        end: new Date("2026-12-31T00:00:00Z"),
      }}
      now={new Date("2026-03-26T00:00:00Z")}
    />,
  );

  await user.hover(screen.getByTestId("conference-trigger-colm-2026"));

  const metaCell = screen
    .getByTestId("conference-trigger-colm-2026")
    .closest("div");

  expect(metaCell).toHaveClass("sticky");
  expect(metaCell).toHaveClass("relative");
});

it("raises the sticky meta cell above timeline markers while the detail card is open", async () => {
  const user = userEvent.setup();

  render(
    <TimelineGrid
      sections={[
        {
          id: "active",
          label: "Active",
          conferences: conferences.slice(0, 1),
        },
      ]}
      visibleRange={{
        start: new Date("2026-01-01T00:00:00Z"),
        end: new Date("2026-12-31T00:00:00Z"),
      }}
      now={new Date("2026-03-26T00:00:00Z")}
    />,
  );

  await user.hover(screen.getByTestId("conference-trigger-colm-2026"));

  const metaCell = screen
    .getByTestId("conference-trigger-colm-2026")
    .closest("div");

  expect(metaCell).toHaveClass("z-40");
  expect(
    screen.getByTestId("conference-detail-card-colm-2026"),
  ).toHaveClass("z-50");
});

it("keeps the conference detail card open while focus moves into its link", async () => {
  const user = userEvent.setup();

  render(
    <TimelineGrid
      sections={[
        {
          id: "active",
          label: "Active",
          conferences: conferences.slice(0, 1),
        },
      ]}
      visibleRange={{
        start: new Date("2026-01-01T00:00:00Z"),
        end: new Date("2026-12-31T00:00:00Z"),
      }}
      now={new Date("2026-03-26T00:00:00Z")}
    />,
  );

  await user.click(screen.getByTestId("conference-trigger-colm-2026"));

  const detailLink = screen.getByRole("link", { name: conferences[0]!.shortName });
  expect(
    screen.getByTestId("conference-detail-card-colm-2026"),
  ).toBeInTheDocument();

  await user.tab();

  expect(detailLink).toHaveFocus();
  expect(
    screen.getByTestId("conference-detail-card-colm-2026"),
  ).toBeInTheDocument();
});

it("renders a single continuous today line overlay", () => {
  render(
    <TimelineGrid
      sections={[
        {
          id: "active",
          label: "Active",
          conferences: conferences.slice(0, 2),
        },
      ]}
      visibleRange={{
        start: new Date("2026-01-01T00:00:00Z"),
        end: new Date("2026-12-31T00:00:00Z"),
      }}
      now={new Date("2026-03-26T00:00:00Z")}
    />,
  );

  expect(screen.getByTestId("today-line")).toBeInTheDocument();
});

it("uses semantic tones for full paper, notification, rebuttal, and conference milestones", () => {
  render(
    <TimelineGrid
      sections={[
        {
          id: "active",
          label: "Active",
          conferences: conferences.slice(0, 1),
        },
      ]}
      visibleRange={{
        start: new Date("2026-01-01T00:00:00Z"),
        end: new Date("2026-12-31T00:00:00Z"),
      }}
      now={new Date("2026-03-26T00:00:00Z")}
    />,
  );

  expect(screen.getByTestId("range-colm-2026-rebuttal")).toHaveAttribute(
    "data-tone",
    "rebuttal",
  );
  expect(screen.getByTestId("range-colm-2026-conference")).toHaveAttribute(
    "data-tone",
    "conference",
  );
  expect(screen.getByLabelText("Full paper")).toHaveAttribute(
    "data-tone",
    "fullPaper",
  );
  expect(screen.getByLabelText("Rebuttal opens")).toHaveAttribute(
    "data-tone",
    "rebuttal",
  );
  expect(screen.getByLabelText("Notification")).toHaveAttribute(
    "data-tone",
    "notification",
  );
  expect(screen.getByLabelText("Conference starts")).toHaveAttribute(
    "data-tone",
    "conference",
  );
});

it("renders larger month labels for the shared axis", () => {
  render(
    <TimelineGrid
      sections={[
        {
          id: "active",
          label: "Active",
          conferences: conferences.slice(0, 1),
        },
      ]}
      visibleRange={{
        start: new Date("2026-01-01T00:00:00Z"),
        end: new Date("2026-12-31T00:00:00Z"),
      }}
      now={new Date("2026-03-26T00:00:00Z")}
    />,
  );

  expect(screen.getByText("Apr 2026")).toHaveClass("text-[10px]");
  expect(screen.getByText("Apr 2026")).toHaveClass("md:text-[11px]");
});

it("anchors the first and last month labels inside the visible axis", () => {
  render(
    <TimelineGrid
      sections={[
        {
          id: "active",
          label: "Active",
          conferences: conferences.slice(0, 1),
        },
      ]}
      visibleRange={{
        start: new Date("2026-01-01T00:00:00Z"),
        end: new Date("2026-07-31T00:00:00Z"),
      }}
      now={new Date("2026-03-26T00:00:00Z")}
    />,
  );

  expect(screen.getByTestId("axis-label-0")).toHaveStyle({
    transform: "translateX(0%)",
  });
  expect(screen.getByTestId("axis-label-6")).toHaveStyle({
    transform: "translateX(-100%)",
  });
});

it("does not fade the entire non-primary marker button", async () => {
  const user = userEvent.setup();

  render(
    <TimelineGrid
      sections={[
        {
          id: "active",
          label: "Active",
          conferences: conferences.slice(9, 10),
        },
      ]}
      visibleRange={{
        start: new Date("2026-01-01T00:00:00Z"),
        end: new Date("2026-12-31T00:00:00Z"),
      }}
      now={new Date("2026-03-26T00:00:00Z")}
    />,
  );

  const secondaryMarker = screen.getByLabelText("Author feedback closes");
  expect(secondaryMarker).toHaveAttribute("data-primary-path", "false");

  await user.hover(secondaryMarker);

  expect(secondaryMarker).not.toHaveClass("opacity-50");
  expect(secondaryMarker).toHaveClass("z-30");
});
