import { render, screen } from "@testing-library/react";
import { conferences } from "@/data/conferences";
import { MilestoneTooltip } from "./milestone-tooltip";

it("uses wrapping-safe classes for long labels and notes", () => {
  const conference = {
    ...conferences[0]!,
    shortName:
      "Extremely-Long-Conference-ShortName-That-Needs-To-Wrap-Cleanly",
  };
  const milestone = {
    ...conference.milestones[1]!,
    label:
      "Full paper submission with an intentionally long descriptive label that should wrap inside the tooltip instead of overflowing",
    note:
      "Bring a camera-ready checklist, timezone conversion notes, and contingency plan for delayed uploads even if the instruction text becomes unexpectedly long.",
  };

  render(
    <MilestoneTooltip
      anchorRect={{ left: 480, top: 240, width: 20 }}
      conference={conference}
      milestone={milestone}
    />,
  );

  expect(screen.getByTestId("milestone-tooltip")).toHaveClass(
    "max-w-[min(24rem,calc(100vw-2rem))]",
  );
  expect(screen.getByTestId("milestone-tooltip").parentElement).toBe(document.body);
  expect(screen.getByText(milestone.label)).toHaveClass("break-words");
  expect(screen.getByText(milestone.note)).toHaveClass("break-words");
});

it("shows source and viewer timezone dates plus a T-minus countdown", () => {
  const conference = conferences.find((item) => item.id === "colm-2026")!;
  const milestone = conference.milestones.find(
    (item) => item.type === "fullPaper",
  )!;

  render(
    <MilestoneTooltip
      anchorRect={{ left: 480, top: 240, width: 20 }}
      conference={conference}
      milestone={milestone}
      now={new Date("2026-03-30T00:00:00.000Z")}
      viewerTimeZone="Asia/Shanghai"
    />,
  );

  expect(screen.getByTestId("milestone-tooltip")).toHaveTextContent(
    "AoE · Mar 31, 2026, 11:59 PM AoE",
  );
  expect(screen.getByTestId("milestone-tooltip")).toHaveTextContent(
    "Asia/Shanghai · Apr 1, 2026, 7:59 PM GMT+8",
  );
  expect(screen.getByTestId("milestone-tooltip")).toHaveTextContent(
    "T-2d 12h",
  );
});
