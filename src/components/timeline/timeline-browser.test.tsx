import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
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

async function waitForMenuState(
  expected: Partial<{
    compact: string;
    collapsed: string;
    layout: string;
  }>,
) {
  await waitFor(() => {
    const menu = screen.getByTestId("timeline-menu");

    if (expected.layout) {
      expect(menu).toHaveAttribute("data-layout", expected.layout);
    }

    if (expected.compact) {
      expect(menu).toHaveAttribute("data-compact", expected.compact);
    }

    if (expected.collapsed) {
      expect(menu).toHaveAttribute("data-collapsed", expected.collapsed);
    }
  });
}

it("renders one shared gantt surface and supports dark mode", async () => {
  const user = userEvent.setup();

  render(
    <TimelineBrowser
      conferences={conferences}
      now={new Date("2026-03-26T00:00:00Z")}
    />,
  );

  await waitForMenuState({ layout: "desktop", collapsed: "false" });

  const browser = screen.getByTestId("timeline-browser");

  expect(
    screen.getByPlaceholderText(/search conferences/i),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "6M" })).toBeInTheDocument();
  expect(screen.getAllByText(conferences[0]!.shortName).length).toBeGreaterThan(0);
  expect(screen.getAllByTestId("timeline-surface")).toHaveLength(1);
  expect(browser).toHaveAttribute("data-theme", "light");
  expect(screen.queryByText("Collapse")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: /collapse menu/i })).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /dark mode/i }));

  expect(browser).toHaveAttribute("data-theme", "dark");
});

it("shows active and past sections, a today marker, and inline details on click", async () => {
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
  expect(screen.queryByText("NeurIPS")).not.toBeInTheDocument();
  expect(screen.queryByText(conferences[0]!.location)).not.toBeInTheDocument();
  expect(screen.getByTestId("conference-detail-row-colm-2026")).toHaveAttribute(
    "aria-hidden",
    "true",
  );

  await user.click(screen.getByTestId("conference-trigger-colm-2026"));

  expect(screen.getByTestId("conference-detail-row-colm-2026")).toHaveAttribute(
    "aria-hidden",
    "false",
  );
  expect(screen.getByTestId("conference-detail-row-colm-2026")).toHaveTextContent(
    conferences[0]!.location,
  );
});

it("collapses the desktop sidebar and restores the preference on rerender", async () => {
  const user = userEvent.setup();

  const firstRender = render(
    <TimelineBrowser
      conferences={conferences}
      now={new Date("2026-03-26T00:00:00Z")}
    />,
  );

  await waitForMenuState({ layout: "desktop", collapsed: "false" });

  await user.click(screen.getByRole("button", { name: /collapse menu/i }));

  await waitForMenuState({ layout: "desktop", collapsed: "true" });
  expect(screen.queryByText("Open")).not.toBeInTheDocument();
  await waitFor(() => {
    expect(
      window.localStorage.getItem("timeline.desktopMenuCollapsed"),
    ).toBe("true");
  });

  firstRender.unmount();

  render(
    <TimelineBrowser
      conferences={conferences}
      now={new Date("2026-03-26T00:00:00Z")}
    />,
  );

  await waitForMenuState({ layout: "desktop", collapsed: "true" });
  expect(
    screen.getByRole("button", { name: /expand menu/i }),
  ).toBeInTheDocument();
});

it("hydrates the desktop menu without server-client markup drift before restoring stored preference", async () => {
  setViewportWidth(1280);
  window.localStorage.setItem("timeline.desktopMenuCollapsed", "true");

  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  const originalWindow = globalThis.window;

  // Simulate the server render where browser globals are unavailable.
  vi.stubGlobal("window", undefined);

  const html = renderToString(
    <TimelineBrowser
      conferences={conferences}
      now={new Date("2026-03-26T00:00:00Z")}
    />,
  );

  vi.stubGlobal("window", originalWindow);

  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.appendChild(container);

  await act(async () => {
    hydrateRoot(
      container,
      <TimelineBrowser
        conferences={conferences}
        now={new Date("2026-03-26T00:00:00Z")}
      />,
    );
  });

  expect(consoleError).not.toHaveBeenCalled();
  await waitFor(() => {
    expect(
      container.querySelector("[data-testid='timeline-menu']"),
    ).toHaveAttribute("data-collapsed", "true");
  });

  consoleError.mockRestore();
  container.remove();
});

it("hydrates the mobile compact menu without server-client markup drift", async () => {
  setViewportWidth(390);
  setScrollPosition(180);

  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  const originalWindow = globalThis.window;

  vi.stubGlobal("window", undefined);

  const html = renderToString(
    <TimelineBrowser
      conferences={conferences}
      now={new Date("2026-03-26T00:00:00Z")}
    />,
  );

  vi.stubGlobal("window", originalWindow);

  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.appendChild(container);

  await act(async () => {
    hydrateRoot(
      container,
      <TimelineBrowser
        conferences={conferences}
        now={new Date("2026-03-26T00:00:00Z")}
      />,
    );
  });

  expect(consoleError).not.toHaveBeenCalled();
  await waitFor(() => {
    expect(
      container.querySelector("[data-testid='timeline-menu']"),
    ).toHaveAttribute("data-layout", "mobile");
    expect(
      container.querySelector("[data-testid='timeline-menu']"),
    ).toHaveAttribute("data-compact", "true");
  });

  consoleError.mockRestore();
  container.remove();
});

it("switches the mobile menu into compact mode after scrolling and restores filters on demand", async () => {
  const user = userEvent.setup();

  setViewportWidth(390);

  render(
    <TimelineBrowser
      conferences={conferences}
      now={new Date("2026-03-26T00:00:00Z")}
    />,
  );

  await waitForMenuState({ layout: "mobile", compact: "false" });

  setScrollPosition(180);
  fireEvent.scroll(window);

  await waitForMenuState({ layout: "mobile", compact: "true" });
  expect(screen.getByRole("button", { name: /filters/i })).toBeInTheDocument();
  expect(
    screen.queryByPlaceholderText(/search conferences/i),
  ).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /filters/i }));

  await waitForMenuState({ layout: "mobile", compact: "false" });
  expect(
    screen.getByPlaceholderText(/search conferences/i),
  ).toBeInTheDocument();
});
