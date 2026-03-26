import { render, screen } from "@testing-library/react";
import { conferences } from "@/data/conferences";
import { TimelineBrowser } from "./timeline-browser";

it("renders the sticky control bar and seeded conferences", () => {
  render(
    <TimelineBrowser
      conferences={conferences}
      now={new Date("2026-03-26T00:00:00Z")}
    />,
  );

  expect(
    screen.getByPlaceholderText(/search conferences/i),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "6M" })).toBeInTheDocument();
  expect(screen.getByText(conferences[0]!.shortName)).toBeInTheDocument();
});
