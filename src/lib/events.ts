import eventsData from "@/data/events.json";

export type ClubEvent = (typeof eventsData.events)[number];

/**
 * `new Date("2026-01-23")` is parsed as UTC midnight, which lands on the
 * previous day everywhere behind UTC — enough to render an Ottawa event a day
 * early and to file today's event under "past". Build the date in local time.
 */
export const eventDate = (event: ClubEvent) => {
  const [year, month, day] = event.date.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

/** Soonest first: the next event should lead. */
export const upcomingEvents = (events: readonly ClubEvent[]) => {
  const today = startOfToday();
  return events
    .filter((event) => eventDate(event) >= today)
    .sort((a, b) => eventDate(a).getTime() - eventDate(b).getTime());
};

/** Most recent first, so 2026 sits above 2025. */
export const pastEvents = (events: readonly ClubEvent[]) => {
  const today = startOfToday();
  return events
    .filter((event) => eventDate(event) < today)
    .sort((a, b) => eventDate(b).getTime() - eventDate(a).getTime());
};
