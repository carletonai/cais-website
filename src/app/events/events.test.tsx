import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import EventsPage from "./events";

test("renders EventsPage correctly", () => {
  const { asFragment } = render(
    <MemoryRouter>
      <EventsPage />
    </MemoryRouter>,
  );
  expect(asFragment()).toMatchSnapshot();
});
