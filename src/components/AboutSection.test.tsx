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
    "Build projects",
    "Grow your network",
    "Attend events",
  ]) {
    expect(screen.getByRole("heading", { name: pillar })).toBeInTheDocument();
  }
  // Styled as a button, but still a link to assistive tech.
  expect(screen.getByRole("link", { name: /Meet the team/ })).toHaveAttribute(
    "href",
    "/team",
  );
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
