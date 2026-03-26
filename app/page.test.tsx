import { render, screen } from "@testing-library/react";
import Home from "./page";

it("renders the conference timeline heading", () => {
  render(<Home />);
  expect(
    screen.getByRole("heading", { name: /conference timeline/i }),
  ).toBeInTheDocument();
});
