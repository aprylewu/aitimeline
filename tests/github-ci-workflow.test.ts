import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("GitHub CI workflow", () => {
  it("defines the expected triggers and verification commands", () => {
    const workflow = readFileSync(
      resolve(process.cwd(), ".github/workflows/ci.yml"),
      "utf8",
    );

    expect(workflow).toContain("pull_request:");
    expect(workflow).toContain("push:");
    expect(workflow).toContain("branches: [main]");
    expect(workflow).toContain("npm ci");
    expect(workflow).toContain("npm run test -- --run");
    expect(workflow).toContain("npm run lint");
    expect(workflow).toContain("npm run build");
  });
});
