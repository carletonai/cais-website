import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TeamPage from "./team";

test("renders TeamPage correctly", () => {
  const { asFragment } = render(
    <MemoryRouter>
      <TeamPage />
    </MemoryRouter>,
  );
  expect(asFragment()).toMatchSnapshot();
});

test("shows the current team only, with a way to the past teams", () => {
  render(
    <MemoryRouter>
      <TeamPage />
    </MemoryRouter>,
  );

  expect(
    screen.getByRole("heading", { level: 1, name: "Current Team" }),
  ).toBeInTheDocument();
  expect(screen.queryByText("2021-2022")).not.toBeInTheDocument();
  // Button renders its link child with role="button".
  expect(
    screen.getByRole("button", { name: /past teams/i }).closest("a"),
  ).toHaveAttribute("href", "/team/past");
});
