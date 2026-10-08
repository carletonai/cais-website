import eventsData from "@/data/events.json";
import {
  CLUB_TIME_ZONE,
  eventWindow,
  formatEnd,
  formatEventDate,
  formatStart,
  idFromSlug,
} from "@/lib/shared/event-time.js";

export {
  eventPath,
  eventSlug,
  eventWindow,
  formatEventDate,
  formatShortDate,
  formatTimeRange,
  formatWhen,
  weekdayOf,
} from "@/lib/shared/event-time.js";

/** One entry in src/data/events.json. */
export interface ClubEvent {
  id: string;
  title: string;
  /** YYYY-MM-DD, Ottawa time. */
  date: string;
  /** "6:00 PM - 7:00 PM", a start time alone, or free text for odd cases. */
  time: string;
  location: string;
  description: string;
  type: string;
  image: string;
  tags: string[];
  poster?: string;
  rsvpLink?: string;
  materials?: string;
  recording?: string;
  page?: string;
}

export const allEvents: readonly ClubEvent[] = eventsData.events;

/**
 * `new Date("2026-01-23")` is parsed as UTC midnight, which lands on the
 * previous day everywhere behind UTC — enough to render an Ottawa event a day
 * early. Build the date in local time; for calendar grids only.
 */
export const eventDate = (event: Pick<ClubEvent, "date">) => {
  const [year, month, day] = event.date.split("-").map(Number);
  return new Date(year, month - 1, day);
};

/** The academic year an event falls in, September to August: "2025–26". */
export const academicYear = (event: Pick<ClubEvent, "date">) => {
  const date = eventDate(event);
  const start =
    date.getMonth() >= 8 ? date.getFullYear() : date.getFullYear() - 1;
  return `${start}–${String(start + 1).slice(2)}`;
};

/** An event stays upcoming until it is over, not just until its day starts. */
export const isUpcoming = (event: ClubEvent, now: Date = new Date()) =>
  eventWindow(event).end.getTime() > now.getTime();

export const isLive = (event: ClubEvent, now: Date = new Date()) => {
  const { start, end } = eventWindow(event);
  return start.getTime() <= now.getTime() && now.getTime() < end.getTime();
};

/** Soonest first: the next event should lead. */
export const upcomingEvents = (
  events: readonly ClubEvent[],
  now: Date = new Date(),
) =>
  events
    .filter((event) => isUpcoming(event, now))
    .sort(
      (a, b) => eventWindow(a).start.getTime() - eventWindow(b).start.getTime(),
    );

/** Most recent first, so 2026 sits above 2025. */
export const pastEvents = (
  events: readonly ClubEvent[],
  now: Date = new Date(),
) =>
  events
    .filter((event) => !isUpcoming(event, now))
    .sort(
      (a, b) => eventWindow(b).start.getTime() - eventWindow(a).start.getTime(),
    );

export const nextEvent = (
  events: readonly ClubEvent[],
  now: Date = new Date(),
): ClubEvent | undefined => upcomingEvents(events, now)[0];

/** The event a /events/<slug> URL names, by the id at its front. */
export const findEventBySlug = (
  slug: string,
  events: readonly ClubEvent[] = allEvents,
) => {
  const id = idFromSlug(slug);
  return id ? events.find((event) => event.id === id) : undefined;
};

/** Today's date in Ottawa, YYYY-MM-DD. */
const clubToday = (now: Date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: CLUB_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

const dayNumber = (date: string) => {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
};

export type EventPhase =
  "live" | "today" | "tomorrow" | "soon" | "later" | "past";

export interface EventStatus {
  phase: EventPhase;
  /** "Happening now · until 7:00 PM", "Tomorrow · 6:00 PM", "In 9 days". */
  label: string;
  /** Milliseconds until it starts; 0 once it has. */
  startsIn: number;
}

/** Where an event stands relative to `now`, in words. */
export const eventStatus = (
  event: ClubEvent,
  now: Date = new Date(),
): EventStatus => {
  const window = eventWindow(event);
  const startsIn = Math.max(0, window.start.getTime() - now.getTime());
  const start = formatStart(event);

  if (now.getTime() >= window.end.getTime()) {
    return { phase: "past", label: "Past event", startsIn };
  }
  if (now.getTime() >= window.start.getTime()) {
    const until = window.allDay ? null : formatEnd(event);
    return {
      phase: "live",
      label: window.allDay
        ? "Happening today"
        : until
          ? `Happening now · until ${until}`
          : `Happening now · started ${start}`,
      startsIn,
    };
  }

  const days = dayNumber(event.date) - dayNumber(clubToday(now));
  if (days <= 0) {
    const minutesAway = Math.round(startsIn / 60_000);
    return {
      phase: "today",
      label: window.allDay
        ? "Today"
        : minutesAway < 60
          ? `Starts in ${minutesAway} min`
          : `Today · ${start}`,
      startsIn,
    };
  }
  if (days === 1) {
    return {
      phase: "tomorrow",
      label: start ? `Tomorrow · ${start}` : "Tomorrow",
      startsIn,
    };
  }
  if (days < 14) {
    return { phase: "soon", label: `In ${days} days`, startsIn };
  }
  return { phase: "later", label: formatEventDate(event.date), startsIn };
};

const isLuma = (href: string) =>
  /^https:\/\/(www\.)?lu(ma)?\.(com|ma)\//.test(href);

/** The RSVP for an upcoming event that takes them, or null. */
export const rsvpFor = (event: ClubEvent, now: Date = new Date()) =>
  isUpcoming(event, now) && event.rsvpLink && event.rsvpLink !== "#"
    ? {
        href: event.rsvpLink,
        label: isLuma(event.rsvpLink) ? "Register on Luma" : "RSVP",
      }
    : null;

export type ResourceKind = "materials" | "recording" | "page";

export interface ResourceLink {
  kind: ResourceKind;
  href: string;
  label: string;
}

const host = (href: string) => {
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

/** An event's links worth showing on its card, labelled by where they go. */
export const resourceLinks = (event: ClubEvent): ResourceLink[] => {
  const links: ResourceLink[] = [];
  if (event.materials) {
    const where = host(event.materials);
    links.push({
      kind: "materials",
      href: event.materials,
      label:
        where === "github.com"
          ? "Code on GitHub"
          : where === "kaggle.com"
            ? "Notebook on Kaggle"
            : "Workshop materials",
    });
  }
  if (event.recording) {
    links.push({
      kind: "recording",
      href: event.recording,
      label:
        host(event.recording) === "youtube.com"
          ? "Watch on YouTube"
          : "Watch the recording",
    });
  }
  if (event.page) {
    links.push({ kind: "page", href: event.page, label: "Event page" });
  }
  return links;
};

/** Past events whose code or recording is online, newest first. */
export const eventsWithResources = (
  events: readonly ClubEvent[],
  now: Date = new Date(),
) =>
  pastEvents(events, now).filter((event) => event.materials || event.recording);

/** Numbers the data can back, for the home page and the terminal. */
export const clubNumbers = (events: readonly ClubEvent[] = allEvents) => ({
  events: events.length,
  since: Math.min(...events.map((event) => Number(event.date.slice(0, 4)))),
  workshops: events.filter((event) => event.type === "Workshop").length,
  withResources: events.filter((event) => event.materials || event.recording)
    .length,
});

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
