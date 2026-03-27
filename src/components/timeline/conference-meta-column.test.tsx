import { render, screen } from "@testing-library/react";
import { conferences } from "@/data/conferences";
import { ConferenceMetaColumn } from "./conference-meta-column";

it("shows rankings, location, and an external conference link", () => {
  render(<ConferenceMetaColumn conference={conferences[1]!} />);

  const link = screen.getByRole("link", { name: conferences[1]!.shortName });

  expect(link).toHaveAttribute("target", "_blank");
  expect(link).toHaveAttribute("rel", expect.stringContaining("noreferrer"));
  expect(screen.getByText(/ccf/i)).toBeInTheDocument();
  expect(screen.getByText(conferences[1]!.location)).toBeInTheDocument();
});

it("keeps large compact sizing for short conference abbreviations", () => {
  render(<ConferenceMetaColumn conference={conferences[5]!} compact />);

  expect(screen.getByText("ACL")).toHaveClass("text-[24px]");
});

it("scales compact sizing down for longer conference abbreviations", () => {
  render(<ConferenceMetaColumn conference={conferences[7]!} compact />);

  expect(screen.getByText("SIGMOD")).not.toHaveClass("text-[24px]");
  expect(screen.getByText("SIGMOD")).toHaveClass("text-[20px]");
});
