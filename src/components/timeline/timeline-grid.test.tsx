import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { conferences } from "@/data/conferences";
import { organizeConferenceSections } from "@/lib/timeline/sections";
import { TimelineGrid } from "./timeline-grid";

const colmConference = conferences.find((conference) => conference.id === "colm-2026")!;
const icmlConference = conferences.find((conference) => conference.id === "icml-2026")!;
const iclrConference = conferences.find((conference) => conference.id === "iclr-2026")!;
const aclConference = conferences.find((conference) => conference.id === "acl-2026")!;
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

it("renders a continuous primary path bar", () => {
  renderTimelineGrid([colmConference]);

  const path = screen.getByTestId("primary-path-colm-2026");
  expect(path).toHaveAttribute("data-path-start", "fullPaper");
  expect(path).toHaveAttribute("data-path-end", "notification");
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
  expect(todayOverlay).toHaveClass("z-0");
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

it("renders larger month labels for the shared axis", () => {
  renderTimelineGrid([colmConference]);

  expect(screen.getByText("Apr")).toHaveClass("text-[13px]");
});

it("shows centered labels only for fully visible month cells", () => {
  renderTimelineGridWithRange({
    visibleConferences: [colmConference],
    visibleRange: {
      start: new Date("2026-01-27T00:00:00Z"),
      end: new Date("2026-07-27T00:00:00Z"),
    },
  });

  expect(screen.queryByText(/^Jan$/)).not.toBeInTheDocument();
  expect(screen.getByText(/^Feb$/)).toBeInTheDocument();
  expect(screen.getByText(/^Mar$/)).toBeInTheDocument();
  expect(screen.getByText(/^Apr$/)).toBeInTheDocument();
  expect(screen.getByText(/^May$/)).toBeInTheDocument();
  expect(screen.getByText(/^Jun$/)).toBeInTheDocument();
  expect(screen.queryByText(/^Jul$/)).not.toBeInTheDocument();
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

it("does not render milestone markers from a partially clipped leading month", () => {
  renderTimelineGridWithRange({
    visibleConferences: [icmlConference],
    visibleRange: {
      start: new Date("2026-01-27T00:00:00Z"),
      end: new Date("2026-07-27T00:00:00Z"),
    },
  });

  expect(screen.queryByText(/^Jan$/)).not.toBeInTheDocument();
  expect(screen.queryByLabelText("Full paper")).not.toBeInTheDocument();
  expect(screen.queryByLabelText("Abstract")).not.toBeInTheDocument();
  expect(screen.getByLabelText("Notification")).toBeInTheDocument();
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
  expect(tooltip).toHaveClass("z-40");
  expect(tooltip).toHaveClass("bg-[var(--tooltip-bg-solid)]");
  expect(screen.getByTestId("today-overlay")).toHaveClass("z-0");
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

it("does not render a stub primary path when only the final decision remains visible", () => {
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

  expect(
    screen.queryByTestId("primary-path-sigmod-2026"),
  ).not.toBeInTheDocument();
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
