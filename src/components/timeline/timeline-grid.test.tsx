import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { conferences } from "@/data/conferences";
import { TimelineGrid } from "./timeline-grid";

it("renders highlighted primary milestones and shows a tooltip on hover", async () => {
  const user = userEvent.setup();

  render(
    <TimelineGrid
      conferences={conferences.slice(0, 1)}
      visibleRange={{
        start: new Date("2026-01-01T00:00:00Z"),
        end: new Date("2026-12-31T00:00:00Z"),
      }}
    />,
  );

  const fullPaperNode = screen.getByLabelText(/full paper/i);
  expect(fullPaperNode).toHaveAttribute("data-primary-path", "true");

  await user.hover(fullPaperNode);
  expect(screen.getByText(/full paper/i)).toBeInTheDocument();
});
