import { existsSync } from "node:fs";
import { join } from "node:path";
import { metadata } from "./layout";

it("uses the AI Timeline page title", () => {
  expect(metadata.title).toBe("AI Timeline");
});

it("ships an app icon asset for browser tabs", () => {
  expect(existsSync(join(process.cwd(), "app", "icon.svg"))).toBe(true);
});
