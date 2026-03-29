import { describe, expect, it } from "vitest";
import { parseRankingsString, sanitizeRankings } from "./rankings";

describe("parseRankingsString", () => {
  it("parses a full rankings string", () => {
    expect(parseRankingsString("CCF: A, CORE: A*, THCPL: A")).toEqual({
      ccf: "A",
      core: "A*",
      thcpl: "A",
    });
  });

  it("parses partial rankings", () => {
    expect(parseRankingsString("CCF: B, CORE: A")).toEqual({
      ccf: "B",
      core: "A",
    });
  });

  it("returns empty object for null/empty input", () => {
    expect(parseRankingsString(null)).toEqual({});
    expect(parseRankingsString("")).toEqual({});
  });

  it("handles extra whitespace", () => {
    expect(parseRankingsString("  CCF:  A ,  CORE:  B  ")).toEqual({
      ccf: "A",
      core: "B",
    });
  });
});

describe("sanitizeRankings", () => {
  it("drops non-display ranking values", () => {
    expect(
      sanitizeRankings({
        ccf: "N",
        core: "Emerging",
        thcpl: "A",
      }),
    ).toEqual({
      thcpl: "A",
    });
  });

  it("keeps recognized ranking values and trims whitespace", () => {
    expect(
      sanitizeRankings({
        ccf: " A ",
        core: " A* ",
      }),
    ).toEqual({
      ccf: "A",
      core: "A*",
    });
  });
});
