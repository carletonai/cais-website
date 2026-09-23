import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import eventsData from "@/data/events.json";
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

const renderEvents = () => {
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  render(
    <MemoryRouter>
      <EventsPage />
    </MemoryRouter>,
  );
  return user;
};

const cardTitle = (name: string) =>
  screen.queryByRole("heading", { level: 3, name });

test("offers only the event types that have events", () => {
  renderEvents();

  const types = within(screen.getByRole("group", { name: "Filter by type" }))
    .getAllByRole("button")
    .map((button) => button.textContent);

  expect(types[0]).toBe("All");
  for (const gone of ["Panel", "Symposium", "TBA"]) {
    expect(types).not.toContain(gone);
  }
  for (const type of types.slice(1)) {
    expect(eventsData.events.some((event) => event.type === type)).toBe(true);
  }
});

test("filters both upcoming and past events by tag", async () => {
  const user = renderEvents();

  const freeFood = () =>
    within(screen.getByRole("group", { name: "Filter by tag" })).getByRole(
      "button",
      { name: "free-food" },
    );
  await user.click(freeFood());

  // Re-queried: the framer-motion mock remounts the filter row on render.
  expect(freeFood()).toHaveAttribute("aria-pressed", "true");
  expect(cardTitle("CAIS Icebreaker")).toBeInTheDocument();
  expect(cardTitle("FED Meet & Greet")).toBeInTheDocument();
  expect(cardTitle("Tentative Event")).not.toBeInTheDocument();
  expect(cardTitle("Tech Club Expo")).not.toBeInTheDocument();
});

test("says so when the filters leave nothing to show", async () => {
  const user = renderEvents();

  await user.click(screen.getByRole("button", { name: "Workshop" }));
  await user.click(screen.getByRole("button", { name: "free-food" }));

  expect(
    screen.getByText("No upcoming events match these filters."),
  ).toBeInTheDocument();
  expect(
    screen.getByText("No past events match these filters."),
  ).toBeInTheDocument();
});

test("shows the latest past events as cards and files the rest by year", async () => {
  const user = renderEvents();

  const archive = screen.getByRole("region", { name: "Event Archive" });
  const years = within(archive).getAllByText(/^\d{4}–\d{2}$/);
  expect(years.length).toBeGreaterThan(1);
  expect(within(archive).getByText("2019–20")).toBeInTheDocument();

  // An archived workshop is not also a card, and opens its full details.
  expect(cardTitle("Linear Regression")).not.toBeInTheDocument();
  await user.click(within(archive).getByText("2021–22"));
  await user.click(
    within(archive).getByRole("button", { name: /Linear Regression/ }),
  );
  const details = screen.getByRole("dialog", { name: "Linear Regression" });
  expect(
    within(details)
      .getByRole("button", { name: /Watch the recording/ })
      .closest("a"),
  ).toHaveAttribute("href", "https://www.youtube.com/watch?v=jAVnWNh_uAU");
});

test("opens a card's full details, links included", async () => {
  const user = renderEvents();

  await user.click(
    screen.getByRole("button", { name: "Details: CAIS Hackathon 2.0" }),
  );
  const details = screen.getByRole("dialog", { name: "CAIS Hackathon 2.0" });
  expect(
    within(details)
      .getByRole("button", { name: /Event page/ })
      .closest("a"),
  ).toHaveAttribute("href", expect.stringContaining("linkedin.com"));
});
