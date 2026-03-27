import { vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "./page";

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

it("renders the conference timeline heading", async () => {
  render(await Home());
  expect(
    screen.getByRole("heading", { name: /conference timeline/i }),
  ).toBeInTheDocument();
});
