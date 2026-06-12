import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ProjectsPage from "./projects";

test("renders ProjectsPage correctly", () => {
  const { asFragment } = render(
    <MemoryRouter>
      <ProjectsPage />
    </MemoryRouter>,
  );
  expect(asFragment()).toMatchSnapshot();
});
