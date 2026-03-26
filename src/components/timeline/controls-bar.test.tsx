import { render, screen } from "@testing-library/react";
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

  expect(screen.getByRole("button", { name: "AI" })).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /notification/i }),
  ).toBeInTheDocument();

  await user.type(screen.getByPlaceholderText(/search conferences/i), "icml");

  expect(screen.getByText(/icml/i)).toBeInTheDocument();
  expect(screen.queryByText(/neurips/i)).not.toBeInTheDocument();
});
