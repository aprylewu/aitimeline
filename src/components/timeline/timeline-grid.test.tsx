import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { conferences } from "@/data/conferences";
import { TimelineGrid } from "./timeline-grid";

function renderTimelineGrid(visibleConferences = conferences.slice(0, 1)) {
  render(
    <TimelineGrid
      sections={[
        {
          id: "active",
          label: "Active",
          conferences: visibleConferences,
        },
      ]}
      visibleRange={{
        start: new Date("2026-01-01T00:00:00Z"),
        end: new Date("2026-12-31T00:00:00Z"),
      }}
      now={new Date("2026-03-26T00:00:00Z")}
    />,
  );
}

it("renders a continuous primary path bar", () => {
  renderTimelineGrid();

  const path = screen.getByTestId("primary-path-colm-2026");
  expect(path).toHaveAttribute("data-path-start", "fullPaper");
  expect(path).toHaveAttribute("data-path-end", "notification");
});

it("renders highlighted primary milestones and shows a tooltip on hover", async () => {
  const user = userEvent.setup();

  renderTimelineGrid();

  const fullPaperNode = screen.getByLabelText(/full paper/i);
  expect(fullPaperNode).toHaveAttribute("data-primary-path", "true");

  await user.hover(fullPaperNode);
  expect(screen.getByText(/full paper/i)).toBeInTheDocument();
  expect(screen.getByTestId("milestone-tooltip")).toHaveStyle({
    minWidth: "20rem",
  });
});

it("renders a separate today label and inline conference detail rows on click", async () => {
  const user = userEvent.setup();

  renderTimelineGrid();

  expect(screen.getByTestId("today-label")).toHaveTextContent("Today");
  expect(
    screen.queryByTestId("conference-detail-row-colm-2026"),
  ).not.toBeInTheDocument();

  await user.click(screen.getByTestId("conference-trigger-colm-2026"));

  expect(
    screen.getByTestId("conference-detail-row-colm-2026"),
  ).toBeInTheDocument();
  expect(screen.getByText("Conference type")).toBeInTheDocument();
  expect(screen.getByText("AI")).toBeInTheDocument();
  expect(screen.getByText("Main page")).toBeInTheDocument();
});

it("renders a single continuous today line overlay", () => {
  renderTimelineGrid(conferences.slice(0, 2));

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
  renderTimelineGrid();

  expect(screen.getByText("Apr")).toHaveClass("text-[13px]");
});

it("allows multiple conference detail rows to stay expanded", async () => {
  const user = userEvent.setup();

  renderTimelineGrid(conferences.slice(0, 2));

  await user.click(screen.getByTestId("conference-trigger-colm-2026"));
  await user.click(screen.getByTestId("conference-trigger-icml-2026"));

  expect(
    screen.getByTestId("conference-detail-row-colm-2026"),
  ).toBeInTheDocument();
  expect(
    screen.getByTestId("conference-detail-row-icml-2026"),
  ).toBeInTheDocument();
});

it("collapses an expanded conference detail row when clicked again", async () => {
  const user = userEvent.setup();

  renderTimelineGrid();

  const trigger = screen.getByTestId("conference-trigger-colm-2026");

  await user.click(trigger);
  expect(
    screen.getByTestId("conference-detail-row-colm-2026"),
  ).toBeInTheDocument();

  await user.click(trigger);
  expect(
    screen.queryByTestId("conference-detail-row-colm-2026"),
  ).not.toBeInTheDocument();
});
