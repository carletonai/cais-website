import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import eventsData from "@/data/events.json";
import EventsPage from "./events";

// Which events are upcoming, and where the calendar opens, depend on the date:
// Ottawa, the afternoon before Intro to Agentic AI.
beforeEach(() => {
  jest.useFakeTimers({ now: new Date("2026-10-08T16:00:00-04:00") });
});

afterEach(() => {
  jest.useRealTimers();
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

test("leads with the next event, then what follows it", () => {
  renderEvents();
  const upcoming = screen.getByRole("region", { name: "Upcoming" });
  expect(
    within(upcoming).getByRole("article", { name: /Intro to Agentic AI/ }),
  ).toHaveTextContent("Next up · Tomorrow · 6:00 PM");
  expect(
    within(upcoming).getByRole("link", { name: "Grok Bot Meetup – Ottawa" }),
  ).toHaveAttribute("href", "/events/67-grok-bot-meetup-ottawa");
});

test("offers only the event types that have events", () => {
  renderEvents();

  const types = within(screen.getByRole("group", { name: "Filter by type" }))
    .getAllByRole("button")
    .map((button) => button.textContent)
    .filter((label) => label !== "Slides, code or video");

  expect(types[0]).toBe("All");
  for (const gone of ["Panel", "Symposium", "TBA"]) {
    expect(types).not.toContain(gone);
  }
  for (const type of types.slice(1)) {
    expect(eventsData.events.some((event) => event.type === type)).toBe(true);
  }
});

test("filters past events by tag", async () => {
  const user = renderEvents();

  const freeFood = () =>
    within(screen.getByRole("group", { name: "Filter by tag" })).getByRole(
      "button",
      { name: "free-food" },
    );
  await user.click(freeFood());

  expect(freeFood()).toHaveAttribute("aria-pressed", "true");
  const past = screen.getByRole("region", { name: "Past events" });
  expect(within(past).getByRole("status")).toHaveTextContent("2 events match");
  expect(
    within(past).getByRole("heading", { name: "CAIS Icebreaker" }),
  ).toBeInTheDocument();
  expect(
    within(past).getByRole("heading", { name: "FED Meet & Greet" }),
  ).toBeInTheDocument();
  expect(
    within(past).queryByRole("heading", { name: "Tech Club Expo" }),
  ).not.toBeInTheDocument();
});

test("narrows to workshops whose code or video is online", async () => {
  const user = renderEvents();
  await user.click(
    screen.getByRole("button", { name: /Slides, code or video/ }),
  );

  const past = screen.getByRole("region", { name: "Past events" });
  expect(
    within(past).getByRole("link", {
      name: /Code on GitHub for Machine Learning Workshop at Hack the Hill III/,
    }),
  ).toHaveAttribute(
    "href",
    "https://github.com/carletonai/cais-workshop-hth-iii",
  );
  expect(cardTitle("Volunteer Meeting")).not.toBeInTheDocument();
});

test("says so when the filters leave nothing to show", async () => {
  const user = renderEvents();

  await user.click(screen.getByRole("button", { name: "Workshop" }));
  await user.click(screen.getByRole("button", { name: "free-food" }));

  expect(
    screen.getByText("No past events match these filters."),
  ).toBeInTheDocument();
});

test("files earlier years as rows that open each event's page", () => {
  renderEvents();

  const past = screen.getByRole("region", { name: "Past events" });
  expect(within(past).getByText("2019–20")).toBeInTheDocument();
  expect(within(past).getByText("2021–22")).toBeInTheDocument();

  // An archived workshop is a row, not a card, and links to its own page.
  expect(cardTitle("Linear Regression")).not.toBeInTheDocument();
  const row = within(past).getByRole("link", { name: /Linear Regression/ });
  expect(row.getAttribute("href")).toMatch(/^\/events\/\d+-linear-regression$/);
  expect(row).toHaveAccessibleName(/recording online/);
});

test("shows this year's past events as cards", () => {
  renderEvents();
  expect(cardTitle("Volunteer Meeting")).toBeInTheDocument();
  expect(cardTitle("Intro to AI")).toBeInTheDocument();
  expect(
    cardTitle("Machine Learning Workshop at Hack the Hill III"),
  ).toBeInTheDocument();
});
