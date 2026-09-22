import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type Meeting } from "@/lib/events";
import { EventsCalendar } from "./EventsCalendar";

const icebreaker = {
  id: "13",
  title: "CAIS Icebreaker",
  date: "2026-09-24",
  time: "6:00 PM - 8:00 PM",
  location: "Southam Hall 402",
  description: "Come find out who we are and what we actually do.",
  type: "Social",
  image: "/assets/events/neural-networks.svg",
  tags: ["social"],
};

const workshop = {
  ...icebreaker,
  id: "12",
  title: "Training an AI Model!",
  date: "2026-02-26",
  time: "6:00 PM - 7:00 PM",
  location: "Tory Building 210",
};

beforeEach(() => {
  jest.useFakeTimers({ now: new Date(2026, 8, 22) });
});

afterEach(() => {
  jest.useRealTimers();
});

const execMeeting: Meeting = {
  id: "exec-meeting",
  title: "Exec Meeting",
  date: "2026-09-22",
  time: "7:30 PM - 8:00 PM",
  location: "Richcraft Hall 3228",
  weekly: true,
};

const setup = (meetings: Meeting[] = []) => {
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  render(
    <EventsCalendar events={[workshop, icebreaker]} meetings={meetings} />,
  );
  return user;
};

const dayCell = (day: number) =>
  screen
    .getAllByRole("cell")
    .find((cell) => cell.firstElementChild?.textContent === String(day))!;

test("opens on the next event's month with the event on its day", () => {
  setup();

  expect(
    screen.getByRole("table", { name: "September 2026" }),
  ).toBeInTheDocument();
  expect(within(dayCell(24)).getByText("CAIS Icebreaker")).toBeInTheDocument();
  expect(within(dayCell(23)).queryByRole("listitem")).not.toBeInTheDocument();
});

test("marks today", () => {
  setup();

  expect(dayCell(22)).toHaveTextContent("(today)");
  expect(dayCell(24)).not.toHaveTextContent("(today)");
});

test("lists the month's events with their time and place", () => {
  setup();

  const agenda = screen.getByText("6:00 PM - 8:00 PM").closest("li")!;
  expect(agenda).toHaveTextContent("CAIS Icebreaker");
  expect(agenda).toHaveTextContent("Southam Hall 402");
  expect(screen.queryByText("Training an AI Model!")).not.toBeInTheDocument();
});

test("pages between months", async () => {
  const user = setup();

  await user.click(screen.getByRole("button", { name: "Next month" }));
  expect(screen.getByRole("heading", { name: "October 2026" })).toBeVisible();
  expect(
    screen.getByText("No events scheduled in October 2026."),
  ).toBeInTheDocument();

  for (let i = 0; i < 8; i++) {
    await user.click(screen.getByRole("button", { name: "Previous month" }));
  }
  expect(screen.getByRole("heading", { name: "February 2026" })).toBeVisible();
  expect(
    within(dayCell(26)).getByText("Training an AI Model!"),
  ).toBeInTheDocument();
});

test("repeats a weekly meeting from its first date on", async () => {
  const user = setup([execMeeting]);

  expect(within(dayCell(22)).getByText("Exec Meeting")).toBeInTheDocument();
  expect(within(dayCell(29)).getByText("Exec Meeting")).toBeInTheDocument();
  expect(within(dayCell(15)).queryByText("Exec Meeting")).toBeNull();
  expect(within(dayCell(23)).queryByText("Exec Meeting")).toBeNull();

  await user.click(screen.getByRole("button", { name: "Next month" }));
  for (const tuesday of [6, 13, 20, 27]) {
    expect(
      within(dayCell(tuesday)).getByText("Exec Meeting"),
    ).toBeInTheDocument();
  }
});

test("stops a weekly meeting after its last date", async () => {
  const user = setup([{ ...execMeeting, until: "2026-10-13" }]);

  await user.click(screen.getByRole("button", { name: "Next month" }));
  expect(within(dayCell(13)).getByText("Exec Meeting")).toBeInTheDocument();
  expect(within(dayCell(20)).queryByText("Exec Meeting")).toBeNull();
});

test("summarises a meeting once rather than listing it as an event", async () => {
  const user = setup([execMeeting]);

  expect(screen.getByText("Tuesdays").closest("li")).toHaveTextContent(
    "Exec Meeting",
  );

  // October has meetings but no events, and says so.
  await user.click(screen.getByRole("button", { name: "Next month" }));
  expect(
    screen.getByText("No events scheduled in October 2026."),
  ).toBeInTheDocument();
  expect(screen.getAllByText("Tuesdays")).toHaveLength(1);
});
