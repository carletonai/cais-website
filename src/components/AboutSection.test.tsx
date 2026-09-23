import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AboutSection } from "./AboutSection";

test("brings the About content onto the home page as a linkable section", () => {
  const { container } = render(
    <MemoryRouter>
      <AboutSection />
    </MemoryRouter>,
  );

  expect(container.querySelector("section#about")).toBeInTheDocument();
  for (const pillar of [
    "Learn AI",
    "Build Projects",
    "Grow Your Network",
    "Attend Events",
  ]) {
    expect(screen.getByRole("heading", { name: pillar })).toBeInTheDocument();
  }
  // Button renders its link child with role="button".
  expect(
    screen.getByRole("button", { name: "Meet the Team" }).closest("a"),
  ).toHaveAttribute("href", "/team");
});
