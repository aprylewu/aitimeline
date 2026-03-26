import { describe, expect, it } from "vitest";
import { conferences } from "@/data/conferences";
import { getPrimaryPathTypes } from "./key-path";

describe("getPrimaryPathTypes", () => {
  it("returns the decision path in order", () => {
    const types = getPrimaryPathTypes(conferences[0]!.milestones);
    expect(types).toEqual(["fullPaper", "rebuttalStart", "notification"]);
  });
});
