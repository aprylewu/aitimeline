import { conferences } from "@/data/conferences";
import {
  formatCountdown,
  formatMilestoneDateLabel,
  getMilestoneInstant,
} from "./milestone-time";

const colmFullPaper = conferences
  .find((conference) => conference.id === "colm-2026")!
  .milestones.find((milestone) => milestone.type === "fullPaper")!;

it("converts AoE milestones to a real deadline instant", () => {
  expect(getMilestoneInstant(colmFullPaper).toISOString()).toBe(
    "2026-04-01T11:59:59.999Z",
  );
});

it("formats milestone dates in the viewer timezone", () => {
  expect(
    formatMilestoneDateLabel(colmFullPaper, "Asia/Shanghai"),
  ).toContain("GMT+8");
});

it("formats countdowns with T- and T+ prefixes", () => {
  const target = new Date("2026-04-01T12:00:00.000Z");

  expect(formatCountdown(target, new Date("2026-03-30T00:00:00.000Z"))).toBe(
    "T-2d 12h",
  );
  expect(formatCountdown(target, new Date("2026-04-02T00:00:00.000Z"))).toBe(
    "T+12h",
  );
});
