import { existsSync } from "node:fs";
import { join } from "node:path";
import { metadata, viewport } from "./layout";

it("uses the AI Timeline page title", () => {
  expect(metadata.title).toBe("AI Timeline");
});

it("ships an app icon asset for browser tabs", () => {
  expect(existsSync(join(process.cwd(), "app", "icon.svg"))).toBe(true);
});

it("defines light and dark theme colors for mobile browser chrome", () => {
  expect(viewport.themeColor).toEqual([
    { media: "(prefers-color-scheme: light)", color: "#f6f3ed" },
    { media: "(prefers-color-scheme: dark)", color: "#070b14" },
  ]);
});
