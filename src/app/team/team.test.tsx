import React from "react";
import { render } from "@testing-library/react";
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
