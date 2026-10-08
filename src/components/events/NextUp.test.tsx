import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { type ClubEvent } from "@/lib/events";
import { NextUp } from "./NextUp";

const meetup: ClubEvent = {
  id: "67",
  title: "Grok Bot Meetup – Ottawa",
  date: "2026-10-17",
  time: "6:00 PM - 10:00 PM",
  location: "Nicol Building",
  description: "An evening on AI agents.",
  type: "Social",
  image: "",
  tags: [],
  rsvpLink: "https://luma.com/phs5tofz",
};

const at = (iso: string) => jest.useFakeTimers({ now: new Date(iso) });
afterEach(() => jest.useRealTimers());

const renderTicket = (events: ClubEvent[]) =>
  render(
    <MemoryRouter>
      <NextUp events={events} />
    </MemoryRouter>,
  );

test("leads with the RSVP when the event takes them", () => {
  at("2026-10-10T12:00:00-04:00");
  renderTicket([meetup]);
  const ticket = screen.getByRole("article");
  expect(ticket).toHaveTextContent("Next up · In 7 days");
  expect(
    within(ticket).getByRole("link", { name: /Register on Luma/ }),
  ).toHaveAttribute("href", "https://luma.com/phs5tofz");
  expect(
    within(ticket).getByRole("button", { name: "Add to calendar" }),
  ).toBeInTheDocument();
});

test("says when an event is happening now", () => {
  at("2026-10-17T19:00:00-04:00");
  renderTicket([meetup]);
  const ticket = screen.getByRole("article");
  expect(ticket).toHaveTextContent("Happening now · until 10:00 PM");
  expect(ticket).not.toHaveTextContent(/Starts in/);
});

test("moves on once the event is over, and says when nothing is next", () => {
  at("2026-10-17T22:01:00-04:00");
  renderTicket([meetup]);
  expect(
    screen.getByRole("heading", { name: "Nothing on the calendar yet" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /Subscribe to the calendar/ }),
  ).toBeInTheDocument();
});
