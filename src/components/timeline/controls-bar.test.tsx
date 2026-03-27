import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { conferences } from "@/data/conferences";
import { TimelineBrowser } from "./timeline-browser";

function setViewportWidth(width: number) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: width,
    writable: true,
  });
}

function setScrollPosition(scrollY: number) {
  Object.defineProperty(window, "scrollY", {
    configurable: true,
    value: scrollY,
    writable: true,
  });
}

beforeEach(() => {
  window.localStorage.clear();
  setViewportWidth(1280);
  setScrollPosition(0);
});

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
    within(
      screen.getByRole("group", { name: /milestone filters/i }),
    ).getByRole("button", { name: /notification/i }),
  ).toBeInTheDocument();

  await user.type(screen.getByPlaceholderText(/search conferences/i), "icml");

  expect(screen.getByText(/icml/i)).toBeInTheDocument();
  expect(screen.queryByText(/neurips/i)).not.toBeInTheDocument();
});

it("reopens the mobile filter controls from the compact bar", async () => {
  const user = userEvent.setup();

  setViewportWidth(390);

  render(
    <TimelineBrowser
      conferences={conferences}
      now={new Date("2026-03-26T00:00:00Z")}
    />,
  );

  setScrollPosition(180);
  fireEvent.scroll(window);

  expect(
    screen.queryByRole("group", { name: /category filters/i }),
  ).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /filters/i }));

  expect(
    screen.getByRole("group", { name: /category filters/i }),
  ).toBeInTheDocument();
  expect(
    within(
      screen.getByRole("group", { name: /milestone filters/i }),
    ).getByRole("button", { name: /notification/i }),
  ).toBeInTheDocument();
});
