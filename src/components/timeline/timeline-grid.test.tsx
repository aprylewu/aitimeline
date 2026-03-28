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
    minWidth: "18rem",
  });
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

  expect(screen.getByText("Apr")).toHaveClass("text-[11px]");
});
