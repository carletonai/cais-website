import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ContactPage from "./contact";

test("renders ContactPage correctly", () => {
  const { asFragment } = render(
    <MemoryRouter>
      <ContactPage />
    </MemoryRouter>,
  );
  expect(asFragment()).toMatchSnapshot();
});
