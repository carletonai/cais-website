import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import ProjectsPage from "./projects";

const renderProjectsPage = () =>
  render(
    <MemoryRouter>
      <ProjectsPage />
    </MemoryRouter>,
  );

test("renders ProjectsPage correctly", () => {
  const { asFragment } = renderProjectsPage();
  expect(asFragment()).toMatchSnapshot();
});

test("renders CuMind as a previous project", () => {
  renderProjectsPage();

  const cuMind = screen.getByRole("heading", { name: "CuMind" })
    .parentElement as HTMLElement;
  expect(within(cuMind).getByText("Previous Project")).toBeInTheDocument();
  expect(
    screen.getByText(/MuZero-style reinforcement learning/i),
  ).toBeInTheDocument();

  const card = screen.getByRole("heading", { name: "CuMind" })
    .parentElement as HTMLElement;
  expect(
    within(card).getByRole("link", { name: /view project/i }),
  ).toHaveAttribute("href", "https://github.com/carletonai/CuMind");
});

test("links the CAIS Terminal project to the terminal in this site", () => {
  renderProjectsPage();

  const card = screen.getByRole("heading", { name: "CAIS Terminal" })
    .parentElement as HTMLElement;
  const link = within(card).getByRole("link", { name: /view project/i });
  expect(link).toHaveAttribute("href", "/resources");
  expect(link).not.toHaveAttribute("target");
});

test("lists hackathon winners apart from club projects", () => {
  renderProjectsPage();

  const hackathons = screen.getByRole("region", {
    name: "Built at CAIS Hackathons",
  });
  expect(
    within(hackathons).getByText("CAIS Hackathon 2.0 · 1st Place"),
  ).toBeInTheDocument();
  expect(
    within(hackathons).queryByRole("heading", { name: "CuMind" }),
  ).not.toBeInTheDocument();
  expect(
    within(screen.getByRole("region", { name: "Club Projects" })).getByRole(
      "heading",
      { name: "CuMind" },
    ),
  ).toBeInTheDocument();
});
