import { existsSync } from "node:fs";
import { join } from "node:path";
import { vi } from "vitest";

vi.mock("geist/font/sans", () => ({
  GeistSans: { variable: "--font-geist-sans" },
}));

vi.mock("geist/font/mono", () => ({
  GeistMono: { variable: "--font-geist-mono" },
}));

it("exports the Conference Timeline page title", async () => {
  const { metadata } = await import("./layout");
  expect(metadata.title).toBe("Conference Timeline");
});

it("ships an app icon asset for browser tabs", () => {
  expect(existsSync(join(process.cwd(), "app", "icon.svg"))).toBe(true);
});
