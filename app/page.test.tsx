import { render, screen } from "@testing-library/react";
import { vi, it, expect } from "vitest";

vi.mock("@/lib/data/get-conferences", () => ({
  getConferences: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/components/timeline/timeline-browser", () => ({
  TimelineBrowser: () => (
    <div role="main" aria-label="conference timeline">
      Timeline
    </div>
  ),
}));

it("renders the conference timeline", async () => {
  const Home = (await import("./page")).default;
  const jsx = await Home();
  render(jsx);
  expect(
    screen.getByRole("main", { name: /conference timeline/i }),
  ).toBeInTheDocument();
});
