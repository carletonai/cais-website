import React from "react";
import { render, screen } from "@testing-library/react";
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

  expect(screen.getByRole("heading", { name: "CuMind" })).toBeInTheDocument();
  expect(screen.getByText("Previous Project")).toBeInTheDocument();
  expect(
    screen.getByText(/MuZero-style reinforcement learning/i),
  ).toBeInTheDocument();

  expect(screen.getByRole("link", { name: /view project/i })).toHaveAttribute(
    "href",
    "https://github.com/carletonai/CuMind",
  );
});
