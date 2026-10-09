// @ts-check
/**
 * iCalendar (RFC 5545) files for events: one per event, and the feed people
 * subscribe to. Built at deploy time by scripts/prerender-routes.mjs and
 * linked from the site; nothing is generated in the browser.
 */
import {
  CLUB_TIME_ZONE,
  addDays,
  eventPath,
  eventWindow,
} from "./event-time.js";

/** @typedef {import("./event-time.js").EventLike} EventLike */

export const SITE_URL = "https://carletonai.com";
export const FEED_PATH = "/events.ics";

/** /events/66-intro-to-agentic-ai.ics */
export const icsPath = (/** @type {Pick<EventLike, "id" | "title">} */ e) =>
  `${eventPath(e)}.ics`;

/** Backslash, semicolon, comma and newline are special in TEXT values. */
const escapeText = (/** @type {string} */ text) =>
  text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");

const encoder = new TextEncoder();

/**
 * Lines longer than 75 octets continue on the next line after a space,
 * without splitting a UTF-8 character (titles contain "–").
 * @param {string} line
 */
const fold = (line) => {
  const out = [];
  let current = "";
  let size = 0;
  for (const char of line) {
    const bytes = encoder.encode(char).length;
    const limit = out.length === 0 ? 75 : 74;
    if (size + bytes > limit) {
      out.push(current);
      current = "";
      size = 0;
    }
    current += char;
    size += bytes;
  }
  out.push(current);
  return out.join("\r\n ");
};

/** 20261009T220000Z */
const utcStamp = (/** @type {Date} */ date) =>
  date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

/** 20261009 */
const dateStamp = (/** @type {string} */ date) => date.replace(/-/g, "");

/** The day after an all-day event's last day: iCalendar ends are exclusive. */
const dayAfter = (/** @type {Pick<EventLike, "date" | "endDate">} */ e) =>
  addDays(e.endDate && e.endDate > e.date ? e.endDate : e.date, 1);

/**
 * The event's description plus where to find more, for calendar apps.
 * @param {EventLike} event
 */
export const calendarDetails = (event) => {
  const window = eventWindow(event);
  const lines = [event.description];
  if (window.allDay && event.time) lines.push(`When: ${event.time}`);
  if (!window.allDay && !window.endKnown) lines.push("End time not announced.");
  if (event.rsvpLink) lines.push(`RSVP: ${event.rsvpLink}`);
  if (event.materials) lines.push(`Workshop materials: ${event.materials}`);
  if (event.recording) lines.push(`Recording: ${event.recording}`);
  lines.push(`Details: ${SITE_URL}${eventPath(event)}`);
  return lines.join("\n\n");
};

/**
 * @param {EventLike} event
 * @param {{ now: Date, feed: boolean }} options
 */
const vevent = (event, { now, feed }) => {
  const window = eventWindow(event);
  const lines = [
    "BEGIN:VEVENT",
    `UID:event-${event.id}@carletonai.com`,
    `DTSTAMP:${utcStamp(now)}`,
  ];
  if (window.allDay) {
    lines.push(
      `DTSTART;VALUE=DATE:${dateStamp(event.date)}`,
      `DTEND;VALUE=DATE:${dateStamp(dayAfter(event))}`,
    );
  } else {
    lines.push(`DTSTART:${utcStamp(window.start)}`);
    if (window.endKnown) lines.push(`DTEND:${utcStamp(window.end)}`);
  }
  lines.push(
    `SUMMARY:${escapeText(event.title)}`,
    ...(event.location ? [`LOCATION:${escapeText(event.location)}`] : []),
    `DESCRIPTION:${escapeText(calendarDetails(event))}`,
    `URL:${SITE_URL}${eventPath(event)}`,
    `CATEGORIES:${escapeText(event.type)}`,
    "STATUS:CONFIRMED",
    // A subscription should never mark someone busy for every club event;
    // a single event they chose to add should.
    `TRANSP:${feed ? "TRANSPARENT" : "OPAQUE"}`,
  );
  if (!feed && !window.allDay) {
    lines.push(
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapeText(event.title)}`,
      "TRIGGER:-PT1H",
      "END:VALARM",
    );
  }
  lines.push("END:VEVENT");
  return lines;
};

/**
 * A complete .ics file.
 * @param {EventLike[]} events
 * @param {{ now: Date, feed?: boolean }} options
 */
export const vcalendar = (events, { now, feed = false }) => {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Carleton AI Society//carletonai.com//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  if (feed) {
    lines.push(
      "NAME:CAIS Events",
      "X-WR-CALNAME:CAIS Events",
      "X-WR-CALDESC:Workshops\\, talks and socials from the Carleton AI Society",
      `X-WR-TIMEZONE:${CLUB_TIME_ZONE}`,
      "REFRESH-INTERVAL;VALUE=DURATION:PT12H",
      "X-PUBLISHED-TTL:PT12H",
    );
  }
  for (const event of events) lines.push(...vevent(event, { now, feed }));
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
};

/**
 * Events worth subscribing to: everything upcoming, plus the past year so a
 * new subscriber's calendar is not empty.
 * @param {EventLike[]} events
 * @param {Date} now
 */
export const feedEvents = (events, now) => {
  const cutoff = now.getTime() - 365 * 24 * 60 * 60 * 1000;
  return events
    .filter((event) => eventWindow(event).end.getTime() >= cutoff)
    .sort((a, b) => a.date.localeCompare(b.date));
};

/** "20261009T220000Z/20261009T230000Z", or all-day "20261009/20261010". */
const googleDates = (/** @type {EventLike} */ event) => {
  const window = eventWindow(event);
  if (window.allDay)
    return `${dateStamp(event.date)}/${dateStamp(dayAfter(event))}`;
  return `${utcStamp(window.start)}/${utcStamp(window.end)}`;
};

/** Google Calendar's "add event" page, prefilled. */
export const googleCalendarUrl = (/** @type {EventLike} */ event) => {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: googleDates(event),
    details: calendarDetails(event),
    location: event.location,
    ctz: CLUB_TIME_ZONE,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
};

/** Outlook.com's compose page, prefilled. */
export const outlookCalendarUrl = (/** @type {EventLike} */ event) => {
  const window = eventWindow(event);
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: event.title,
    startdt: window.allDay ? event.date : window.start.toISOString(),
    enddt: window.allDay ? dayAfter(event) : window.end.toISOString(),
    location: event.location,
    body: calendarDetails(event),
    ...(window.allDay && { allday: "true" }),
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params}`;
};

/** Google's "add calendar by URL" page for the feed. */
export const googleSubscribeUrl = () =>
  `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(
    `webcal://carletonai.com${FEED_PATH}`,
  )}`;

/** Opens the default calendar app's subscribe prompt (Apple, Outlook). */
export const webcalFeedUrl = () => `webcal://carletonai.com${FEED_PATH}`;
