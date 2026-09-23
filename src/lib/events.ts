import eventsData from "@/data/events.json";

export type ClubEvent = (typeof eventsData.events)[number];

/**
 * `new Date("2026-01-23")` is parsed as UTC midnight, which lands on the
 * previous day everywhere behind UTC — enough to render an Ottawa event a day
 * early and to file today's event under "past". Build the date in local time.
 */
export const eventDate = (event: Pick<ClubEvent, "date">) => {
  const [year, month, day] = event.date.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

/** The academic year an event falls in, September to August: "2025–26". */
export const academicYear = (event: Pick<ClubEvent, "date">) => {
  const date = eventDate(event);
  const start =
    date.getMonth() >= 8 ? date.getFullYear() : date.getFullYear() - 1;
  return `${start}–${String(start + 1).slice(2)}`;
};

/** Today's events count as upcoming until the day is over. */
export const isUpcoming = (event: ClubEvent) =>
  eventDate(event) >= startOfToday();

/** Soonest first: the next event should lead. */
export const upcomingEvents = (events: readonly ClubEvent[]) =>
  events
    .filter(isUpcoming)
    .sort((a, b) => eventDate(a).getTime() - eventDate(b).getTime());

/** Most recent first, so 2026 sits above 2025. */
export const pastEvents = (events: readonly ClubEvent[]) =>
  events
    .filter((event) => !isUpcoming(event))
    .sort((a, b) => eventDate(b).getTime() - eventDate(a).getTime());

/**
 * Calendar-only entries from meetings.json, like the exec meeting: they show
 * on the events calendar but never as an event card, on the home page, or in
 * the resources terminal.
 */
export type Meeting = {
  id: string;
  title: string;
  /** The first (or only) meeting, YYYY-MM-DD. */
  date: string;
  time: string;
  location: string;
  /** Repeats every week on the weekday of `date`. */
  weekly?: boolean;
  /** Last day a weekly meeting can fall on, YYYY-MM-DD. Open-ended if unset. */
  until?: string;
};

/** Whether the meeting takes place on `day`, a local-midnight date. */
export const meetsOn = (meeting: Meeting, day: Date) => {
  const first = eventDate(meeting);
  if (day < first) return false;
  if (meeting.until && day > eventDate({ date: meeting.until })) return false;

  return meeting.weekly
    ? day.getDay() === first.getDay()
    : day.getTime() === first.getTime();
};
