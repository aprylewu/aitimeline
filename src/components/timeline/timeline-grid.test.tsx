import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { conferences } from "@/data/conferences";
import { getMilestoneInstant } from "@/lib/timeline/milestone-time";
import { getPositionPercent } from "@/lib/timeline/positioning";
import { organizeConferenceSections } from "@/lib/timeline/sections";
import { TimelineGrid } from "./timeline-grid";

const colmConference = conferences.find((conference) => conference.id === "colm-2026")!;
const icmlConference = conferences.find((conference) => conference.id === "icml-2026")!;
const iclrConference = conferences.find((conference) => conference.id === "iclr-2026")!;
const aclConference = conferences.find((conference) => conference.id === "acl-2026")!;
const neuripsConference = conferences.find((conference) => conference.id === "neurips-2026")!;
const sigmodConference = conferences.find((conference) => conference.id === "sigmod-2026")!;
const defaultVisibleMilestoneTypes = new Set([
  "fullPaper",
  "rebuttalStart",
  "rebuttalEnd",
  "notification",
  "cameraReady",
  "conferenceStart",
  "conferenceEnd",
] as const);

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

function renderTimelineGridWithRange(args: {
  visibleConferences?: typeof conferences;
  visibleRange: {
    start: Date;
    end: Date;
  };
}) {
  return render(
    <TimelineGrid
      sections={[
        {
          id: "active",
          label: "Active",
          conferences: args.visibleConferences ?? conferences.slice(0, 1),
        },
      ]}
      visibleRange={args.visibleRange}
      now={new Date("2026-03-26T00:00:00Z")}
    />,
  );
}

function getLeftPercent(node: HTMLElement) {
  return Number.parseFloat(node.style.left.replace("%", ""));
}

function getRightPercent(node: HTMLElement) {
  return (
    Number.parseFloat(node.style.left.replace("%", "")) +
    Number.parseFloat(node.style.width.replace("%", ""))
  );
}

it("renders a continuous primary path bar", () => {
  renderTimelineGrid([colmConference]);

  const path = screen.getByTestId("primary-path-colm-2026");
  expect(path).toHaveAttribute("data-path-start", "abstract");
  expect(path).toHaveAttribute("data-path-end", "conferenceEnd");
});

it("renders highlighted primary milestones and shows a tooltip on hover", async () => {
  const user = userEvent.setup();

  renderTimelineGrid([colmConference]);

  const fullPaperNode = screen.getByLabelText(/full paper/i);
  expect(fullPaperNode).toHaveAttribute("data-primary-path", "true");

  await user.hover(fullPaperNode);
  expect(screen.getByText(/full paper/i)).toBeInTheDocument();
  expect(screen.getByTestId("milestone-tooltip")).toHaveStyle({
    minWidth: "20rem",
  });
});

it("renders a separate today label and a compact inline detail strip on click", async () => {
  const user = userEvent.setup();

  renderTimelineGrid([aclConference]);
  const trigger = screen.getByTestId("conference-trigger-acl-2026");
  const detailRow = screen.getByTestId("conference-detail-row-acl-2026");
  const todayLabel = screen.getByTestId("today-label");
  const todayOverlay = screen.getByTestId("today-overlay");

  expect(todayLabel).toHaveTextContent("Today");
  expect(todayLabel).toHaveTextContent("Mar 26, 2026");
  expect(todayOverlay).toHaveClass("z-[1]");
  expect(screen.getByTestId("today-label-overlay")).toHaveClass("z-20");
  expect(screen.getByTestId("today-date")).toHaveClass("ml-2");
  expect(screen.getByTestId("today-date")).toHaveClass("pl-2");
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  expect(trigger).toHaveClass("conference-trigger--collapsed");
  expect(trigger).toHaveClass("items-center");
  expect(trigger).toHaveClass("justify-center");
  expect(trigger).toHaveClass("text-center");
  expect(detailRow).toHaveAttribute("aria-hidden", "true");
  expect(within(trigger).getByText("ACL")).toHaveClass("text-[24px]");
  expect(within(trigger).getByText("2026")).toHaveClass("font-mono");
  expect(within(trigger).getByText("2026")).toHaveClass("text-[14px]");

  await user.click(trigger);

  expect(trigger).toHaveAttribute("aria-expanded", "true");
  expect(trigger).toHaveClass("conference-trigger--expanded");
  expect(detailRow).toHaveAttribute("aria-hidden", "false");
  expect(detailRow).toHaveClass("relative");
  expect(detailRow).toHaveClass("z-10");
  expect(within(detailRow).queryByText(/^ACL$/)).not.toBeInTheDocument();
  expect(within(detailRow).queryByText(/^2026$/)).not.toBeInTheDocument();
  expect(
    within(detailRow).getByText(
      /Annual Meeting of the Association for Computational Linguistics/i,
    ),
  ).toBeInTheDocument();
  expect(
    within(detailRow).getByText(
      /Jul 26-31, 2026, San Diego, United States/i,
    ),
  ).toBeInTheDocument();
  expect(detailRow).toHaveTextContent(/ccf\s+A/i);
  expect(detailRow).toHaveTextContent(/core\s+A\*/i);
  expect(detailRow).toHaveTextContent(/thcpl\s+A/i);
  expect(within(detailRow).getByText(/^AI$/i)).toBeInTheDocument();
  expect(within(detailRow).getByTestId("conference-detail-title-acl-2026")).toHaveClass(
    "text-[13px]",
  );
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

it("keeps expanded conference details fixed while the timeline scrolls independently", async () => {
  const user = userEvent.setup();

  renderTimelineGrid([aclConference]);

  await user.click(screen.getByTestId("conference-trigger-acl-2026"));

  const detailMetaCell = screen.getByTestId("conference-detail-meta-acl-2026");
  const detailPanel = screen.getByTestId("conference-detail-panel-acl-2026");
  const detailRow = screen.getByTestId("conference-detail-row-acl-2026");

  expect(detailMetaCell).toHaveClass("sticky");
  expect(detailMetaCell).toHaveClass("left-0");
  expect(detailPanel).toHaveClass("sticky");
  expect(detailPanel).toHaveClass("left-[196px]");
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

  await waitFor(() => {
    expect(detailRow.style.height).toBe("188px");
  });
});

it("keeps expanded details visible after follow-up rerenders", async () => {
  const user = userEvent.setup();

  renderTimelineGrid([aclConference]);

  const trigger = screen.getByTestId("conference-trigger-acl-2026");
  const detailRow = screen.getByTestId("conference-detail-row-acl-2026");
  const detailContent = screen.getByTestId("conference-detail-content-acl-2026");

  Object.defineProperty(detailContent, "scrollHeight", {
    configurable: true,
    value: 188,
  });

  await user.click(trigger);

  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 240));
  });

  expect(detailRow).toHaveAttribute("aria-hidden", "false");
  expect(detailRow.style.height).not.toBe("0px");
  expect(
    within(detailRow).getByTestId("conference-detail-title-acl-2026"),
  ).toBeInTheDocument();
});

it("restores trigger hover feedback after expansion without keeping the clicked glow", async () => {
  const user = userEvent.setup();

  renderTimelineGrid([aclConference]);

  const trigger = screen.getByTestId("conference-trigger-acl-2026");

  await user.click(trigger);
  expect(trigger).toHaveAttribute("aria-expanded", "true");
  expect(trigger).toHaveClass("conference-trigger--hover-cooldown");

  await new Promise((resolve) => setTimeout(resolve, 240));

  expect(trigger).not.toHaveClass("conference-trigger--hover-cooldown");
});

it("renders a single continuous today line overlay", () => {
  renderTimelineGrid([colmConference, iclrConference]);

  expect(screen.getByTestId("today-line")).toHaveClass("w-[3px]");
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

it("extends the conference range to the overall event end when workshops run later", () => {
  const visibleRange = {
    start: new Date("2026-12-01T00:00:00Z"),
    end: new Date("2026-12-31T00:00:00Z"),
  };
  const workshop = neuripsConference.milestones.find(
    (milestone) => milestone.type === "workshop",
  )!;

  render(
    <TimelineGrid
      sections={[
        {
          id: "active",
          label: "Active",
          conferences: [neuripsConference],
        },
      ]}
      visibleMilestoneTypes={defaultVisibleMilestoneTypes}
      visibleRange={visibleRange}
      now={new Date("2026-03-26T00:00:00Z")}
    />,
  );

  const conferenceRange = screen.getByTestId("range-neurips-2026-conference");
  const expectedOverallEnd = getPositionPercent(
    getMilestoneInstant(workshop),
    visibleRange,
  );

  expect(getRightPercent(conferenceRange)).toBeCloseTo(
    expectedOverallEnd,
    5,
  );
});

it("does not stretch short conference ranges past their end marker", () => {
  render(
    <TimelineGrid
      sections={[
        {
          id: "active",
          label: "Active",
          conferences: [colmConference],
        },
      ]}
      visibleMilestoneTypes={defaultVisibleMilestoneTypes}
      visibleRange={{
        start: new Date("2026-01-01T00:00:00Z"),
        end: new Date("2026-12-31T00:00:00Z"),
      }}
      now={new Date("2026-03-26T00:00:00Z")}
    />,
  );

  const conferenceRange = screen.getByTestId("range-colm-2026-conference");
  const conferenceEndMarker = screen.getByLabelText("Conference ends");

  expect(getRightPercent(conferenceRange)).toBeCloseTo(
    getLeftPercent(conferenceEndMarker),
    5,
  );
});

it("renders larger month labels for the shared axis", () => {
  renderTimelineGrid([colmConference]);

  expect(screen.getByText("Apr")).toHaveClass("text-[13px]");
});

it("keeps the venue column frozen while leaving the timeline lane scrollable", () => {
  renderTimelineGrid([colmConference, iclrConference]);

  const venueHead = screen.getByText("Venue").closest("div");
  const sectionLabel = screen.getByText("Active").closest("div");
  const conferenceCell = screen
    .getByTestId("conference-trigger-colm-2026")
    .parentElement;
  const timelineRow = screen
    .getByTestId("timeline-row-grid-colm-2026")
    .closest("div");

  expect(venueHead).toHaveClass("sticky");
  expect(venueHead).toHaveClass("left-0");
  expect(sectionLabel).toHaveClass("sticky");
  expect(sectionLabel).toHaveClass("left-0");
  expect(conferenceCell).toHaveClass("sticky");
  expect(conferenceCell).toHaveClass("left-0");
  expect(timelineRow).not.toHaveClass("sticky");
});

it("keeps boundary month labels and late-month milestones visible inside the timeline range", () => {
  renderTimelineGridWithRange({
    visibleConferences: [colmConference],
    visibleRange: {
      start: new Date("2026-01-27T00:00:00Z"),
      end: new Date("2026-07-27T00:00:00Z"),
    },
  });

  expect(screen.getByText(/^Jan$/)).toBeInTheDocument();
  expect(screen.getByText(/^Feb$/)).toBeInTheDocument();
  expect(screen.getByText(/^Mar$/)).toBeInTheDocument();
  expect(screen.getByText(/^Apr$/)).toBeInTheDocument();
  expect(screen.getByText(/^May$/)).toBeInTheDocument();
  expect(screen.getByText(/^Jun$/)).toBeInTheDocument();
  expect(screen.getByText(/^Jul$/)).toBeInTheDocument();
  expect(screen.getByLabelText("Notification")).toBeInTheDocument();
});

it("uses the same month cell layout for the shared axis and each row grid", () => {
  renderTimelineGridWithRange({
    visibleConferences: [colmConference],
    visibleRange: {
      start: new Date("2026-01-27T00:00:00Z"),
      end: new Date("2026-07-27T00:00:00Z"),
    },
  });

  const axisMonthCell = screen.getByTestId("axis-month-cell-2026-02");
  const rowMonthCell = screen.getByTestId("grid-month-cell-colm-2026-2026-02");

  expect(axisMonthCell.style.left).toBe(rowMonthCell.style.left);
  expect(axisMonthCell.style.width).toBe(rowMonthCell.style.width);
  expect(axisMonthCell).toHaveClass("absolute");
  expect(rowMonthCell).toHaveClass("absolute");
  expect(screen.getByText(/^Feb$/)).toHaveClass("-translate-x-1/2");
});

it("does not render milestone markers that fall outside the visible range", () => {
  renderTimelineGridWithRange({
    visibleConferences: [icmlConference],
    visibleRange: {
      start: new Date("2026-02-01T00:00:00Z"),
      end: new Date("2026-08-01T00:00:00Z"),
    },
  });

  expect(screen.queryByLabelText("Full paper")).not.toBeInTheDocument();
  expect(screen.getByLabelText("Notification")).toBeInTheDocument();
});

it("keeps boundary months labeled while still hiding milestones that are truly out of range", () => {
  renderTimelineGridWithRange({
    visibleConferences: [icmlConference],
    visibleRange: {
      start: new Date("2026-01-27T00:00:00Z"),
      end: new Date("2026-07-27T00:00:00Z"),
    },
  });

  expect(screen.getByText(/^Jan$/)).toBeInTheDocument();
  expect(screen.getByLabelText("Full paper")).toBeInTheDocument();
  expect(screen.queryByLabelText("Abstract")).not.toBeInTheDocument();
  expect(screen.getByLabelText("Notification")).toBeInTheDocument();
});

it("clips the conference path to the visible range edge instead of the next full month", () => {
  renderTimelineGridWithRange({
    visibleConferences: [icmlConference],
    visibleRange: {
      start: new Date("2026-01-27T00:00:00Z"),
      end: new Date("2026-07-27T00:00:00Z"),
    },
  });

  const path = screen.getByTestId("primary-path-icml-2026");
  const febCell = screen.getByTestId("axis-month-cell-2026-02");

  expect(path.style.left).toBe("0%");
  expect(path.style.left).not.toBe(febCell.style.left);
});

it("projects AoE milestones onto the viewer-local timeline axis", () => {
  render(
    <TimelineGrid
      sections={[
        {
          id: "active",
          label: "Active",
          conferences: [colmConference],
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

  const fullPaperMarker = screen.getByLabelText("Full paper");
  const aprilCell = screen.getByTestId("axis-month-cell-2026-04");

  expect(getLeftPercent(fullPaperMarker)).toBeGreaterThan(getLeftPercent(aprilCell));
});

it("shows an AoE countdown and keeps the tooltip above the today overlay", async () => {
  const user = userEvent.setup();

  render(
    <TimelineGrid
      sections={[
        {
          id: "active",
          label: "Active",
          conferences: [colmConference],
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

  await user.hover(screen.getByLabelText("Full paper"));

  const tooltip = screen.getByTestId("milestone-tooltip");

  expect(tooltip).toHaveTextContent("T-6d 11h");
  expect(tooltip).toHaveTextContent("Your time");
  expect(tooltip).toHaveTextContent("GMT+8");
  expect(tooltip).toHaveTextContent("AoE");
  expect(tooltip).toHaveClass("z-40");
  expect(tooltip).toHaveClass("bg-[var(--tooltip-bg-solid)]");
  expect(screen.getByTestId("today-overlay")).toHaveClass("z-[1]");
  expect(screen.getByTestId("today-label-overlay")).toHaveClass("z-20");
  expect(screen.getByTestId("timeline-grid-shell")).toHaveClass("z-10");
});

it("removes the legacy gray row baseline from timeline rows", () => {
  const { container } = renderTimelineGridWithRange({
    visibleConferences: [colmConference, iclrConference],
    visibleRange: {
      start: new Date("2026-01-01T00:00:00Z"),
      end: new Date("2026-12-31T00:00:00Z"),
    },
  });

  const legacyBaselines = Array.from(container.querySelectorAll("div")).filter(
    (node) => node.className.includes("bg-[var(--path-baseline)]"),
  );

  expect(legacyBaselines).toHaveLength(0);
});

it("keeps the conference path available when only the final decision is inside the focus range", () => {
  const visibleRange = {
    start: new Date("2026-01-27T00:00:00Z"),
    end: new Date("2026-07-27T00:00:00Z"),
  };
  const now = new Date("2026-03-26T00:00:00Z");
  const sections = organizeConferenceSections({
    conferences: [sigmodConference],
    query: "",
    categories: new Set(),
    visibleMilestoneTypes: defaultVisibleMilestoneTypes,
    visibleRange,
    now,
  });

  render(
    <TimelineGrid
      sections={[
        { id: "active", label: "Active", conferences: sections.active },
        { id: "past", label: "Past", conferences: sections.past },
      ]}
      visibleRange={visibleRange}
      now={now}
    />,
  );

  const path = screen.getByTestId("primary-path-sigmod-2026");

  expect(path).toHaveAttribute("data-path-start", "abstract");
  expect(path).toHaveAttribute("data-path-end", "conferenceEnd");
});

it("allows multiple conference detail rows to stay expanded", async () => {
  const user = userEvent.setup();

  renderTimelineGrid([colmConference, iclrConference]);

  await user.click(screen.getByTestId("conference-trigger-colm-2026"));
  await user.click(screen.getByTestId("conference-trigger-iclr-2026"));

  expect(
    screen.getByTestId("conference-detail-row-colm-2026"),
  ).toHaveAttribute("aria-hidden", "false");
  expect(
    screen.getByTestId("conference-detail-row-iclr-2026"),
  ).toHaveAttribute("aria-hidden", "false");
});

it("collapses an expanded conference detail row when clicked again", async () => {
  const user = userEvent.setup();

  renderTimelineGrid([colmConference]);

  const trigger = screen.getByTestId("conference-trigger-colm-2026");
  const detailRow = screen.getByTestId("conference-detail-row-colm-2026");

  await user.click(trigger);
  expect(detailRow).toHaveAttribute("aria-hidden", "false");

  await user.click(trigger);
  expect(detailRow).toHaveAttribute("aria-hidden", "true");
});

it("hides the CFP action when a conference does not have a dedicated CFP url", async () => {
  const user = userEvent.setup();

  renderTimelineGrid([iclrConference]);

  await user.click(screen.getByTestId("conference-trigger-iclr-2026"));

  expect(
    within(screen.getByTestId("conference-detail-row-iclr-2026")).queryByRole(
      "link",
      { name: /call for papers/i },
    ),
  ).not.toBeInTheDocument();
});

it("shows a conference-level detail note when dates are not fully announced", async () => {
  const user = userEvent.setup();

  renderTimelineGrid([neuripsConference]);

  await user.click(screen.getByTestId("conference-trigger-neurips-2026"));

  expect(
    screen.getByTestId("conference-detail-row-neurips-2026"),
  ).toHaveTextContent(/rebuttal.*not.*announced/i);
});
