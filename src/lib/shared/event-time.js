// @ts-check
/**
 * Event times, shared by the app and the build (scripts/prerender-routes.mjs
 * imports this on bare Node, so it is plain ESM with JSDoc types and no
 * imports).
 *
 * Every event happens in Ottawa. Instants are computed in America/Toronto
 * whatever time zone the visitor, or the build machine, is in.
 */

export const CLUB_TIME_ZONE = "America/Toronto";

/**
 * @typedef {object} EventLike
 * @property {string} id
 * @property {string} title
 * @property {string} date YYYY-MM-DD, the (first) day
 * @property {string} time free text, normally "h:mm AM - h:mm PM"
 * @property {string} location
 * @property {string} description
 * @property {string} type
 * @property {string[]} tags
 * @property {string} [poster]
 * @property {string} [rsvpLink]
 * @property {string} [materials]
 * @property {string} [recording]
 * @property {string} [page]
 * @property {string} [endDate] YYYY-MM-DD, last day of a multi-day event
 */

/**
 * @typedef {object} EventWindow
 * @property {Date} start first instant (local midnight for all-day events)
 * @property {Date} end when the event is over
 * @property {boolean} allDay no usable clock time; `time` is shown verbatim
 * @property {boolean} multiDay runs from `date` through `endDate`
 * @property {boolean} endKnown false when only a start time was announced
 * @property {number | null} startMin minutes after midnight, Ottawa time
 * @property {number | null} endMin
 */

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const LONG_DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
// Fixed English names: ICU builds disagree on abbreviations (en-CA has
// shipped "Sept."), and the build and the browser must print the same text.
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const LONG_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const CLOCK = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;

/** "6:30 PM" -> 1110 (minutes after midnight), or null. */
const minutes = (/** @type {string} */ text) => {
  const m = CLOCK.exec(text.trim());
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (hour < 1 || hour > 12 || minute > 59) return null;
  return ((hour % 12) + (m[3].toUpperCase() === "PM" ? 12 : 0)) * 60 + minute;
};

/**
 * The clock times in an event's `time` text: a range, a start only, or null
 * for anything else ("", "TBA", "Until 4:30 PM", multi-day notes).
 * @param {string} text
 * @returns {{ startMin: number, endMin: number | null } | null}
 */
export const parseClockTimes = (text) => {
  const parts = (text ?? "").split(/\s+[-–]\s+/);
  if (parts.length === 1) {
    const startMin = minutes(parts[0]);
    return startMin === null ? null : { startMin, endMin: null };
  }
  if (parts.length !== 2) return null;
  const startMin = minutes(parts[0]);
  const endMin = minutes(parts[1]);
  if (startMin === null || endMin === null) return null;
  return { startMin, endMin };
};

/** @param {string} date YYYY-MM-DD */
const ymd = (date) => {
  const [y, m, d] = date.split("-").map(Number);
  return { y, m, d };
};

/** UTC offset of Ottawa at an instant, in minutes (e.g. -240 in summer). */
const torontoOffset = (/** @type {number} */ instant) => {
  const name = new Intl.DateTimeFormat("en-US", {
    timeZone: CLUB_TIME_ZONE,
    timeZoneName: "longOffset",
  })
    .formatToParts(new Date(instant))
    .find((p) => p.type === "timeZoneName")?.value;
  const m = /GMT([+-])(\d{2}):(\d{2})/.exec(name ?? "");
  if (!m) return 0;
  return (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3]));
};

/**
 * The instant an Ottawa wall-clock time happens. DST-correct: the offset is
 * read at the instant itself, then re-read once in case the guess crossed a
 * change.
 * @param {string} date YYYY-MM-DD
 * @param {number} minuteOfDay may exceed 1440 to roll into the next day
 */
export const clubInstant = (date, minuteOfDay) => {
  const { y, m, d } = ymd(date);
  const wall = Date.UTC(y, m - 1, d, 0, minuteOfDay);
  let instant = wall - torontoOffset(wall) * 60_000;
  instant = wall - torontoOffset(instant) * 60_000;
  return new Date(instant);
};

/** How long a start-only event is assumed to run, for "happening now" and
 *  calendar files. */
const ASSUMED_MINUTES = 60;

/** The YYYY-MM-DD `days` after `date`. */
export const addDays = (
  /** @type {string} */ date,
  /** @type {number} */ days,
) => {
  const { y, m, d } = ymd(date);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
};

/**
 * When an event starts and ends.
 * @param {Pick<EventLike, "date" | "time" | "endDate">} event
 * @returns {EventWindow}
 */
export const eventWindow = (event) => {
  // A multi-day event (a competition, a weekend hackathon) runs whole days,
  // from its first day through its last; its time text is shown as written.
  if (event.endDate && event.endDate > event.date) {
    return {
      start: clubInstant(event.date, 0),
      end: clubInstant(addDays(event.endDate, 1), 0),
      allDay: true,
      multiDay: true,
      endKnown: true,
      startMin: null,
      endMin: null,
    };
  }
  const clock = parseClockTimes(event.time);
  if (!clock) {
    return {
      start: clubInstant(event.date, 0),
      end: clubInstant(event.date, 24 * 60),
      allDay: true,
      multiDay: false,
      endKnown: false,
      startMin: null,
      endMin: null,
    };
  }
  const { startMin } = clock;
  // An end before the start runs past midnight.
  const endMin =
    clock.endMin === null
      ? null
      : clock.endMin <= startMin
        ? clock.endMin + 24 * 60
        : clock.endMin;
  return {
    start: clubInstant(event.date, startMin),
    end: clubInstant(event.date, endMin ?? startMin + ASSUMED_MINUTES),
    allDay: false,
    multiDay: false,
    endKnown: endMin !== null,
    startMin,
    endMin,
  };
};

/** Weekday of a YYYY-MM-DD date, 0 = Sunday. */
export const weekdayOf = (/** @type {string} */ date) => {
  const { y, m, d } = ymd(date);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
};

/**
 * "Fri, Oct 9", or "Fri, Oct 9, 2026" with `year`.
 * @param {string} date
 * @param {{ year?: boolean, long?: boolean }} [options]
 */
export const formatEventDate = (date, options = {}) => {
  const { y, m, d } = ymd(date);
  const day = weekdayOf(date);
  const text = options.long
    ? `${LONG_DAYS[day]}, ${LONG_MONTHS[m - 1]} ${d}`
    : `${DAYS[day]}, ${MONTHS[m - 1]} ${d}`;
  return options.year ? `${text}, ${y}` : text;
};

/** "Oct 9, 2026": compact, for archive rows. */
export const formatShortDate = (/** @type {string} */ date) => {
  const { y, m, d } = ymd(date);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
};

/** 1110 -> "6:30 PM" */
const clock12 = (/** @type {number} */ minuteOfDay, withPeriod = true) => {
  const m = ((minuteOfDay % 1440) + 1440) % 1440;
  const hour = Math.floor(m / 60);
  const text = `${hour % 12 || 12}:${String(m % 60).padStart(2, "0")}`;
  return withPeriod ? `${text} ${hour < 12 ? "AM" : "PM"}` : text;
};

/**
 * The posters' way of writing a time: "6:00–7:00 PM", "11:00 AM–4:00 PM",
 * "1:15 PM". Text that is not a plain time passes through unchanged.
 * @param {string} text
 */
export const formatTimeRange = (text) => {
  const clock = parseClockTimes(text);
  if (!clock) return (text ?? "").trim();
  if (clock.endMin === null) return clock12(clock.startMin);
  const samePeriod = clock.startMin < 720 === clock.endMin < 720;
  return `${clock12(clock.startMin, !samePeriod)}–${clock12(clock.endMin)}`;
};

/** "Fri, Oct 9 · 6:00–7:00 PM" */
export const formatWhen = (
  /** @type {Pick<EventLike, "date" | "time" | "endDate">} */ event,
  /** @type {{ year?: boolean }} */ options = {},
) => {
  const date = formatDateRange(event, options);
  if (event.endDate && event.endDate > event.date) return date;
  const time = formatTimeRange(event.time);
  return time ? `${date} · ${time}` : date;
};

/** "Fri, Oct 9", or for a multi-day event "Sat, Mar 21 – Sun, Mar 22". */
export const formatDateRange = (
  /** @type {Pick<EventLike, "date" | "endDate">} */ event,
  /** @type {{ year?: boolean }} */ options = {},
) => {
  if (!event.endDate || event.endDate <= event.date) {
    return formatEventDate(event.date, options);
  }
  const sameYear = event.date.slice(0, 4) === event.endDate.slice(0, 4);
  const first = formatEventDate(event.date, {
    year: options.year && !sameYear,
  });
  return `${first} – ${formatEventDate(event.endDate, options)}`;
};

/** The start time on its own, "6:00 PM", when there is one. */
export const formatStart = (
  /** @type {Pick<EventLike, "date" | "time">} */ event,
) => {
  const clock = parseClockTimes(event.time);
  return clock ? clock12(clock.startMin) : null;
};

/** The end time on its own, "7:00 PM", when one was announced. */
export const formatEnd = (
  /** @type {Pick<EventLike, "date" | "time">} */ event,
) => {
  const clock = parseClockTimes(event.time);
  return clock && clock.endMin !== null ? clock12(clock.endMin) : null;
};

/**
 * A stable URL slug: the id keeps it unique and lets an old link survive a
 * retitled event; the title makes it readable. "66-intro-to-agentic-ai".
 * @param {Pick<EventLike, "id" | "title">} event
 */
export const eventSlug = (event) => {
  const words = event.title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
  let slug = "";
  for (const word of words) {
    if ((slug + "-" + word).length > 56) break;
    slug = slug ? `${slug}-${word}` : word;
  }
  return slug ? `${event.id}-${slug}` : event.id;
};

/** The id at the front of a slug, or null. */
export const idFromSlug = (/** @type {string} */ slug) =>
  /^(\d+)(?:-|$)/.exec(slug)?.[1] ?? null;

export const eventPath = (/** @type {Pick<EventLike, "id" | "title">} */ e) =>
  `/events/${eventSlug(e)}`;
