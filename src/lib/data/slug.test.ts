import { describe, expect, it } from "vitest";
import { normalizeSlug } from "./slug";

describe("normalizeSlug", () => {
  it("lowercases and strips year suffixes", () => {
    expect(normalizeSlug("AAAI26")).toBe("aaai");
    expect(normalizeSlug("icml-2026")).toBe("icml");
    expect(normalizeSlug("NeurIPS2026")).toBe("neurips");
  });

  it("collapses hyphens and trims", () => {
    expect(normalizeSlug("chi--2026")).toBe("chi");
    expect(normalizeSlug("  CVPR  ")).toBe("cvpr");
  });

  it("handles slugs without year", () => {
    expect(normalizeSlug("sigmod")).toBe("sigmod");
    expect(normalizeSlug("kdd")).toBe("kdd");
  });

  it("strips trailing digits that look like a year", () => {
    expect(normalizeSlug("aaai26")).toBe("aaai");
    expect(normalizeSlug("chi2026")).toBe("chi");
    expect(normalizeSlug("s3")).toBe("s3");
  });
});
