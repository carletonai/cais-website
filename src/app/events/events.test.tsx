import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import EventsPage from "./events";

// Which events are upcoming, and where the calendar opens, depend on the date.
beforeEach(() => {
  jest.useFakeTimers({ now: new Date(2026, 8, 22) });
});

afterEach(() => {
  jest.useRealTimers();
});

test("renders EventsPage correctly", () => {
  const { asFragment } = render(
    <MemoryRouter>
      <EventsPage />
    </MemoryRouter>,
  );
  expect(asFragment()).toMatchSnapshot();
});
