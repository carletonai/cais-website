import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import oldTeamsData from "@/data/old-teams.json";
import PastTeamsPage from "./past-teams";

test("lists every past team under its own year heading", () => {
  render(
    <MemoryRouter>
      <PastTeamsPage />
    </MemoryRouter>,
  );

  expect(
    screen.getByRole("heading", { level: 1, name: "Past Teams" }),
  ).toBeInTheDocument();
  for (const team of oldTeamsData.teams) {
    expect(
      screen.getByRole("heading", { level: 2, name: team.year }),
    ).toBeInTheDocument();
  }
});
