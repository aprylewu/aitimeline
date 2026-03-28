import { describe, expect, it } from "vitest";
import { inferCategory } from "./category";

describe("inferCategory", () => {
  it("maps machine-learning to AI", () => {
    expect(inferCategory(["machine-learning", "optimization"])).toBe("AI");
  });

  it("maps computer-vision to MX", () => {
    expect(inferCategory(["computer-vision"])).toBe("MX");
  });

  it("maps data-mining to DS", () => {
    expect(inferCategory(["data-mining", "machine-learning"])).toBe("DS");
  });

  it("maps human-computer-interaction to HI", () => {
    expect(inferCategory(["human-computer-interaction"])).toBe("HI");
  });

  it("maps databases to DB", () => {
    expect(inferCategory(["databases"])).toBe("DB");
  });

  it("maps security to SC", () => {
    expect(inferCategory(["security"])).toBe("SC");
  });

  it("maps networking to NW", () => {
    expect(inferCategory(["networking"])).toBe("NW");
  });

  it("maps software-engineering to SE", () => {
    expect(inferCategory(["software-engineering"])).toBe("SE");
  });

  it("maps theory to CT", () => {
    expect(inferCategory(["theory"])).toBe("CT");
  });

  it("maps computer-graphics to CG", () => {
    expect(inferCategory(["computer-graphics"])).toBe("CG");
  });

  it("defaults to AI for unknown tags", () => {
    expect(inferCategory(["unknown-tag"])).toBe("AI");
    expect(inferCategory([])).toBe("AI");
  });
});
