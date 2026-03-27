import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { conferences } from "@/data/conferences";
import { TimelineGrid } from "./timeline-grid";

const colmConference = conferences.find((conference) => conference.id === "colm-2026")!;
const iclrConference = conferences.find((conference) => conference.id === "iclr-2026")!;
const aclConference = conferences.find((conference) => conference.id === "acl-2026")!;

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

  expect(screen.getByTestId("today-label")).toHaveTextContent("Today");
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
  renderTimelineGrid([colmConference]);

  expect(screen.getByText("Apr")).toHaveClass("text-[13px]");
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
