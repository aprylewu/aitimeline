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

it("uses wrapping-safe classes for long titles and locations", () => {
  const conference = {
    ...conferences[1]!,
    shortName:
      "International-Conference-With-A-Very-Long-Unbroken-ShortName-2026",
    title:
      "A very long conference title that should wrap cleanly even when the content gets much wider than the floating card",
    location:
      "A-City-With-An-Exceedingly-Long-Unbroken-Location-Name-That-Should-Not-Overflow-The-Panel",
  };

  render(<ConferenceMetaColumn conference={conference} />);

  expect(
    screen.getByRole("link", { name: conference.shortName }),
  ).toHaveClass("break-words");
  expect(screen.getByText(conference.title)).toHaveClass("break-words");
  expect(screen.getByText(conference.location)).toHaveClass("break-words");
});

it("renders compact metadata with year suffix and shield-style badges", () => {
  render(<ConferenceMetaColumn conference={conferences[1]!} compact />);

  expect(screen.getByText(conferences[1]!.shortName)).toBeInTheDocument();
  expect(screen.getByText(String(conferences[1]!.year))).toBeInTheDocument();
  expect(screen.getByTestId(`conference-meta-badges-${conferences[1]!.id}`)).toBeInTheDocument();
  expect(screen.getByText(conferences[1]!.category)).toBeInTheDocument();
  expect(screen.getByText(/ccf/i)).toBeInTheDocument();
});
