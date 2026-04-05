import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { conferences } from "@/data/conferences";
import { TimelineGrid } from "./timeline-grid";

const aclConference = conferences.find((conference) => conference.id === "acl-2026")!;
const icmlConference = conferences.find((conference) => conference.id === "icml-2026")!;

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
  expect(path).toHaveAttribute("data-path-start", "abstract");
  expect(path).toHaveAttribute("data-path-end", "conferenceEnd");
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

it("renders a separate today label and only uses hover as a click hint on conference triggers", async () => {
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
      viewerTimeZone="Asia/Shanghai"
    />,
  );

  expect(screen.getByTestId("today-label")).toHaveTextContent("Mar 26 08:00 GMT+8");

  const trigger = screen.getByTestId("conference-trigger-colm-2026");
  expect(within(trigger).getByText("CoLM")).toHaveClass("text-[11px]");
  expect(within(trigger).getByText("CoLM")).toHaveClass("md:text-[12px]");
  expect(within(trigger).getByText("2026")).toHaveClass("text-[9px]");
  expect(within(trigger).getByText(/^AI$/i)).toBeInTheDocument();
  expect(
    within(trigger).queryByText(/CORE Emerging/i),
  ).not.toBeInTheDocument();
  expect(
    within(trigger).getByTestId("conference-trigger-arrow-colm-2026"),
  ).toHaveClass("rotate-0");
  expect(
    within(trigger).getByTestId("conference-trigger-arrow-colm-2026"),
  ).toHaveClass("duration-[240ms]");
  expect(
    within(trigger).getByTestId("conference-trigger-arrow-colm-2026"),
  ).toHaveClass("ease-[cubic-bezier(0.22,1,0.36,1)]");

  await user.hover(trigger);

  expect(trigger).toHaveClass("conference-trigger--hovered");
  expect(trigger).not.toHaveClass("-translate-y-px");
  expect(trigger).not.toHaveClass("shadow-sm");
  expect(
    screen.queryByTestId("conference-detail-card-colm-2026"),
  ).not.toBeInTheDocument();
});

it("clicking a conference trigger restores the older compact inline detail strip", async () => {
  const user = userEvent.setup();

  renderTimelineGrid([aclConference]);

  const trigger = screen.getByTestId("conference-trigger-acl-2026");
  const detailRow = screen.getByTestId("conference-detail-row-acl-2026");

  expect(trigger).toHaveAttribute("aria-expanded", "false");
  expect(trigger).toHaveClass("conference-trigger--collapsed");
  expect(detailRow).toHaveAttribute("aria-hidden", "true");

  await user.click(trigger);

  expect(trigger).toHaveAttribute("aria-expanded", "true");
  expect(trigger).toHaveClass("conference-trigger--expanded");
  expect(trigger).not.toHaveClass("shadow-sm");
  expect(detailRow).toHaveAttribute("aria-hidden", "false");
  expect(detailRow).toHaveClass("relative");
  expect(detailRow).toHaveClass("z-20");
  expect(
    within(trigger).getByTestId("conference-trigger-arrow-acl-2026"),
  ).toHaveClass("rotate-90");
  expect(
    within(trigger).getByTestId("conference-trigger-arrow-acl-2026"),
  ).toHaveClass("scale-105");
  expect(within(detailRow).queryByText(/^ACL$/)).not.toBeInTheDocument();
  expect(within(detailRow).queryByText(/^2026$/)).not.toBeInTheDocument();
  expect(
    within(detailRow).getByText(
      /Annual Meeting of the Association for Computational Linguistics/i,
    ),
  ).toBeInTheDocument();
  expect(
    within(detailRow).getByText(/Jul 26-31, 2026, San Diego, United States/i),
  ).toBeInTheDocument();
  const detailBadges = within(detailRow).getByTestId(
    "conference-detail-badges-acl-2026",
  );
  expect(detailBadges).toHaveTextContent(/ccf/i);
  expect(detailBadges).toHaveTextContent(/core/i);
  expect(detailBadges).toHaveTextContent(/thcpl/i);
  expect(within(detailBadges).getByText(/^AI$/i)).toBeInTheDocument();
  expect(
    within(detailRow).getByTestId("conference-detail-title-acl-2026"),
  ).toHaveClass("text-[13px]");
  expect(
    within(detailRow).getByTestId("conference-detail-summary-acl-2026"),
  ).toHaveClass("text-[12px]");
  expect(
    within(detailRow).getByRole("link", { name: /call for papers/i }),
  ).toHaveClass("rounded-full");
  expect(
    within(detailRow).getByRole("link", { name: /call for papers/i }),
  ).toHaveClass("border");
  expect(
    within(detailRow).getByRole("link", { name: /call for papers/i }),
  ).toHaveAttribute("href", expect.stringContaining("aclweb.org"));
});

it("keeps the fixed meta cell as the positioning context for the trigger hover animation", async () => {
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

  expect(metaCell).toHaveClass("timeline-meta-fixed");
  expect(metaCell).toHaveClass("relative");
});

it("raises the trigger into the hovered guidance state without opening a floating detail card", async () => {
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

  const trigger = screen.getByTestId("conference-trigger-colm-2026");

  expect(trigger).toHaveClass("conference-trigger--hovered");
  expect(
    screen.queryByTestId("conference-detail-card-colm-2026"),
  ).not.toBeInTheDocument();
});

it("keeps expanded conference details fixed while the timeline scrolls independently", async () => {
  const user = userEvent.setup();

  renderTimelineGrid([aclConference]);

  await user.click(screen.getByTestId("conference-trigger-acl-2026"));

  const detailMetaCell = screen.getByTestId("conference-detail-meta-acl-2026");
  const detailPanel = screen.getByTestId("conference-detail-panel-acl-2026");
  const detailRow = screen.getByTestId("conference-detail-row-acl-2026");

  expect(detailMetaCell).toHaveClass("timeline-meta-fixed");
  expect(detailMetaCell).toHaveClass("z-10");
  expect(detailPanel).toHaveClass("sticky");
  expect(detailPanel).toHaveClass("left-[var(--timeline-meta-width)]");
  expect(detailPanel).toHaveClass("z-20");
  expect(detailRow).not.toHaveClass("col-span-2");
});

it("animates detail expansion with an explicit row height", async () => {
  const user = userEvent.setup();

  renderTimelineGrid([aclConference]);

  const trigger = screen.getByTestId("conference-trigger-acl-2026");
  const detailRow = screen.getByTestId("conference-detail-row-acl-2026");
  const detailContent = screen.getByTestId("conference-detail-content-acl-2026");

  Object.defineProperty(detailContent, "scrollHeight", {
    configurable: true,
    value: 188,
  });

  expect(detailRow.style.height).toBe("0px");

  await user.click(trigger);

  expect(detailRow.style.height).toBe("188px");
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

  const axisLabels = screen.getAllByTestId(/axis-label-/);

  expect(axisLabels.length).toBeGreaterThan(0);
  expect(axisLabels[0]).toHaveClass("text-[10px]");
  expect(axisLabels[0]).toHaveClass("md:text-[11px]");
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

it("derives month labels from the viewer timezone instead of raw UTC month boundaries", () => {
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
        start: new Date("2025-12-31T16:00:00.000Z"),
        end: new Date("2026-03-31T15:59:59.999Z"),
      }}
      now={new Date("2026-03-26T00:00:00Z")}
      viewerTimeZone="Asia/Shanghai"
    />,
  );

  expect(screen.getByTestId("axis-label-0")).toHaveTextContent("Jan 2026");
  expect(screen.queryByText("Dec 2025")).not.toBeInTheDocument();
});

it("does not render milestone markers that fall outside the visible range", () => {
  render(
    <TimelineGrid
      sections={[
        {
          id: "active",
          label: "Active",
          conferences: [icmlConference],
        },
      ]}
      visibleRange={{
        start: new Date("2026-02-01T00:00:00Z"),
        end: new Date("2026-08-01T00:00:00Z"),
      }}
      now={new Date("2026-03-26T00:00:00Z")}
    />,
  );

  expect(screen.queryByLabelText("Full paper")).not.toBeInTheDocument();
  expect(screen.getByLabelText("Notification")).toBeInTheDocument();
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
  expect(secondaryMarker).toHaveClass("h-8");
  expect(secondaryMarker).toHaveClass("w-8");

  const secondaryMarkerSurface = secondaryMarker.firstElementChild as HTMLElement;
  expect(secondaryMarkerSurface).toHaveClass("h-3.5");
  expect(secondaryMarkerSurface).toHaveClass("w-3.5");

  await user.hover(secondaryMarker);

  expect(secondaryMarker).not.toHaveClass("opacity-50");
  expect(secondaryMarker).toHaveClass("z-30");
  expect(secondaryMarkerSurface.firstElementChild).toHaveClass("scale-110");
});
