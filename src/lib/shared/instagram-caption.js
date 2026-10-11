// @ts-check
/**
 * Reads an Instagram caption the way a member would: what is it, when and
 * where, and how to sign up. Captions are free text, so this is heuristic;
 * the result says how sure it is, and the sync opens a pull request for a
 * person to check rather than publishing anything on its own.
 *
 * Plain ESM with no imports: scripts/instagram-sync.mjs runs it on bare Node.
 */

/** @typedef {import("./event-time.js").EventLike} EventLike */

const MONTHS = /** @type {Record<string, number>} */ ({
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
});
const MONTH =
  "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";
const WEEKDAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];
const WEEKDAY =
  "(sun|mon|tue|tues|wed|thu|thur|thurs|fri|sat)(?:day|sday|nesday|rsday|urday)?";

/** Campus buildings an event is likely to name, longest first. */
const BUILDINGS = [
  "Richcraft Hall",
  "Herzberg Laboratories",
  "Herzberg",
  "Nicol Building",
  "Southam Hall",
  "Tory Building",
  "Canal Building",
  "Minto CASE",
  "Mackenzie Building",
  "Dunton Tower",
  "Azrieli Theatre",
  "Azrieli Pavilion",
  "Loeb Building",
  "River Building",
  "Residence Commons",
  "University Centre",
  "Health Sciences Building",
  "Paterson Hall",
  "Patterson Hall",
  "Steacie Building",
  "Teraanga Commons",
  "Nideyinàn",
  "Innovation Hub",
  "MacOdrum Library",
  "Discovery Centre",
  "St. Patrick's Building",
  "Bayview Yards",
  "Nicol",
];

const EMOJI = /\p{Extended_Pictographic}|\u{FE0F}|\u{200D}|\u{20E3}/gu;

/** Text without emoji, hashtags or mentions, with tidy spaces. */
const clean = (/** @type {string} */ text) =>
  text
    .replace(EMOJI, " ")
    .replace(/#[\p{L}\p{N}_]+/gu, " ")
    // "with @host" goes as a whole, or "with" would dangle.
    .replace(/\b(?:with|w\/|ft\.?|feat\.?|x|and|&|\+)\s+@[\w.]+/gi, " ")
    .replace(/@[\w.]+/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .trim();

/** YYYY-MM-DD of a Date in Ottawa. */
const clubDate = (/** @type {Date} */ date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

const ymd = (
  /** @type {number} */ y,
  /** @type {number} */ m,
  /** @type {number} */ d,
) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

const addDays = (/** @type {string} */ date, /** @type {number} */ days) => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
};

const weekdayOf = (/** @type {string} */ date) => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
};

/**
 * The first date the caption names, as YYYY-MM-DD, or null. A month and
 * day without a year mean the next such date on or after the post, with
 * a week's slack for posts that go up on the day.
 * @param {string} text cleaned caption
 * @param {string} posted YYYY-MM-DD the post went up, Ottawa time
 */
export const dateIn = (text, posted) => {
  const lower = text.toLowerCase();
  const year = Number(posted.slice(0, 4));
  /** @param {number} m @param {number} d @param {string | undefined} y */
  const resolve = (m, d, y) => {
    if (m < 1 || m > 12 || d < 1 || d > 31) return null;
    if (y) return ymd(Number(y), m, d);
    const thisYear = ymd(year, m, d);
    return thisYear < addDays(posted, -7) ? ymd(year + 1, m, d) : thisYear;
  };

  const iso = /\b(\d{4})-(\d{2})-(\d{2})\b/.exec(lower);
  if (iso) return ymd(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  const monthFirst = new RegExp(
    `\\b${MONTH}\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b(?:,?\\s*(\\d{4}))?`,
  ).exec(lower);
  const dayFirst = new RegExp(
    `\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?${MONTH}\\b(?:,?\\s*(\\d{4}))?`,
  ).exec(lower);
  const first =
    monthFirst && dayFirst
      ? monthFirst.index <= dayFirst.index
        ? monthFirst
        : dayFirst
      : (monthFirst ?? dayFirst);
  if (first) {
    const [, a, b, y] = first;
    return first === monthFirst
      ? resolve(MONTHS[a], Number(b), y)
      : resolve(MONTHS[b], Number(a), y);
  }

  if (/\btonight\b|\btoday\b/.test(lower)) return posted;
  if (/\btomorrow\b/.test(lower)) return addDays(posted, 1);
  const relative = new RegExp(`\\b(?:this|next|on)?\\s*${WEEKDAY}\\b`).exec(
    lower,
  );
  if (relative) {
    const target = WEEKDAYS.findIndex((day) =>
      day.startsWith(relative[1].slice(0, 3)),
    );
    const ahead = (target - weekdayOf(posted) + 7) % 7;
    return addDays(
      posted,
      /\bnext\b/.test(relative[0]) && ahead === 0 ? 7 : ahead,
    );
  }
  return null;
};

/** "6", "6:30", "pm" -> minutes after midnight, or null. */
const minutes = (
  /** @type {string} */ h,
  /** @type {string | undefined} */ m,
  /** @type {string} */ period,
) => {
  const hour = Number(h);
  const minute = Number(m ?? 0);
  if (hour < 1 || hour > 12 || minute > 59) return null;
  return ((hour % 12) + (period === "pm" ? 12 : 0)) * 60 + minute;
};

const clock = (/** @type {number} */ min) =>
  `${Math.floor(min / 60) % 12 || 12}:${String(min % 60).padStart(2, "0")} ${min < 720 ? "AM" : "PM"}`;

/**
 * The first clock time or range in the caption, written the way
 * events.json writes them: "6:00 PM - 7:00 PM", "6:00 PM", or "".
 * "6-8pm" takes the period from its end; "11-1pm" starts in the morning.
 * @param {string} text cleaned caption
 */
export const timeIn = (text) => {
  const lower = text
    .toLowerCase()
    .replace(/\bnoon\b/g, "12:00 pm")
    .replace(/\b(a|p)\.m\./g, "$1m");
  const range =
    /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:-|–|—|to|until|till)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/.exec(
      lower,
    );
  if (range) {
    const [, h1, m1, p1, h2, m2, p2] = range;
    const end = minutes(h2, m2, p2);
    let start = minutes(h1, m1, p1 ?? p2);
    if (start !== null && end !== null && !p1 && start >= end) start -= 12 * 60;
    if (start !== null && end !== null && start >= 0) {
      return `${clock(start)} - ${clock(end)}`;
    }
  }
  const single = /\b(?:at|@|from)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/.exec(
    lower,
  );
  if (single) {
    const start = minutes(single[1], single[2], single[3]);
    if (start !== null) return clock(start);
  }
  return "";
};

/** A literal for a RegExp: every metacharacter escaped, backslash included. */
const escapeRegExp = (/** @type {string} */ text) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Where it is: a "📍"/"Location:" line, a campus building with its room,
 * or "Online". Empty when nothing is named.
 * @param {string} raw the caption as posted
 */
export const locationIn = (raw) => {
  const labelled = /(?:📍|\b(?:location|where|venue)\s*:)\s*([^\n]+)/i.exec(
    raw,
  );
  if (labelled)
    return clean(labelled[1])
      .replace(/[.!]+$/, "")
      .trim();
  const text = clean(raw);
  for (const building of BUILDINGS) {
    const match = new RegExp(
      `\\b${escapeRegExp(building)}\\b(?:,?\\s*(?:room|rm\\.?)?\\s*(\\d{3,4}[a-z]?))?`,
      "i",
    ).exec(text);
    if (match) {
      const room = /^\d/.test(match[1] ?? "") ? ` ${match[1]}` : "";
      return `${building}${room}`;
    }
  }
  if (/\b(online|virtual|zoom|google meet|on discord)\b/i.test(text))
    return "Online";
  return "";
};

/** Every https link, and the one that looks like sign-up. */
export const linksIn = (/** @type {string} */ raw) => {
  const links = [...raw.matchAll(/https?:\/\/[^\s)>\]]+/g)].map((m) =>
    m[0].replace(/[.,;:!?]+$/, ""),
  );
  const rsvpLink =
    links.find((link) =>
      /\b(lu\.ma|luma\.com|forms\.gle|docs\.google\.com\/forms|eventbrite|tally\.so|typeform)\b/i.test(
        link,
      ),
    ) ?? null;
  return { links, rsvpLink };
};

/** The event's name: the first line that is not a date, time or tag line. */
export const titleIn = (/** @type {string} */ raw) => {
  const lines = clean(raw)
    .split("\n")
    .map((line) => line.replace(/^[\s\-–—•|:·]+|[\s\-–—•|:·]+$/g, "").trim())
    .filter(Boolean);
  const dateLike = new RegExp(
    `^(?:${WEEKDAY}|${MONTH}|\\d{1,2}(?::\\d{2})?\\s*(?:am|pm))\\b`,
    "i",
  );
  const line =
    lines.find(
      (l) =>
        !dateLike.test(l) &&
        !/^(when|where|location|time|date|rsvp|register|link)\b/i.test(l),
    ) ??
    lines[0] ??
    "";
  const title = line
    .replace(/\s*[|·]\s*.*$/, "")
    .replace(/\s+(?:with|w\/|ft\.?|feat\.?|x|and|&|\+|by)\s*$/i, "")
    .replace(/[!]+$/, "")
    .trim();
  return title.length > 80
    ? `${title.slice(0, 77).replace(/\s+\S*$/, "")}…`
    : title;
};

/** Workshop, Talk, Competition or Social, from the words used. */
export const typeIn = (/** @type {string} */ text) => {
  const lower = text.toLowerCase();
  if (/\b(hackathon|competition|contest|tournament)\b/.test(lower))
    return "Competition";
  if (
    /\b(workshop|tutorial|hands-on|bootcamp|crash course|intro to)\b/.test(
      lower,
    )
  )
    return "Workshop";
  if (
    /\b(talk|panel|speaker|fireside|lecture|seminar|presentation|q&a)\b/.test(
      lower,
    )
  )
    return "Talk";
  return "Social";
};

/** The site's tags that the words support. */
export const tagsIn = (
  /** @type {string} */ text,
  /** @type {string} */ type,
) => {
  const lower = text.toLowerCase();
  const tags = new Set();
  if (
    /\b(free (food|pizza|snacks|lunch|dinner)|pizza|snacks|refreshments|food (will be )?provided)\b/.test(
      lower,
    )
  )
    tags.add("free-food");
  if (
    /\b(beginner|no experience|all levels|all skill levels|everyone welcome)\b/.test(
      lower,
    )
  )
    tags.add("beginner-friendly");
  if (
    /\b(hands-on|bring (a|your) laptop|code along|follow along)\b/.test(lower)
  )
    tags.add("hands-on");
  if (/\b(online|virtual|zoom|google meet)\b/.test(lower)) tags.add("online");
  if (/\bnetwork(ing)?\b/.test(lower)) tags.add("networking");
  if (/\b(guest speaker|speaker|panelist)\b/.test(lower))
    tags.add("guest-speaker");
  if (
    /\b(hiring|recruit(ing|ment)?|applications? (are )?open|join the (exec|team))\b/.test(
      lower,
    )
  )
    tags.add("recruitment");
  if (/\bhackathon\b/.test(lower)) tags.add("hackathon");
  if (type === "Workshop" || type === "Talk") tags.add("technical");
  if (type === "Social") tags.add("social");
  if (type === "Competition") tags.add("competition");
  return [...tags];
};

/** A post about an event that already happened, not one coming up. */
export const isRecap = (/** @type {string} */ text) =>
  /\b(thank(s| you)( to)? (everyone|all|to all)|thanks for (coming|joining|showing up)|what a (night|turnout|week(end)?)|recap|highlights from|last (night|week|weekend)|yesterday'?s?|was a (blast|success|hit))\b/i.test(
    text,
  );

/**
 * @typedef {object} ParsedCaption
 * @property {string} title
 * @property {string | null} date YYYY-MM-DD
 * @property {string} time "6:00 PM - 7:00 PM", "6:00 PM" or ""
 * @property {string} location
 * @property {string} description
 * @property {string} type
 * @property {string[]} tags
 * @property {string | null} rsvpLink
 * @property {string[]} links
 * @property {boolean} recap a post about something that already happened
 * @property {boolean} isEvent dated, with a time, a place or a call to come
 * @property {"high" | "medium" | "low"} confidence
 */

/**
 * @param {string} caption
 * @param {{ postedAt: Date }} context
 * @returns {ParsedCaption}
 */
export const parseCaption = (caption, { postedAt }) => {
  const raw = caption ?? "";
  const text = clean(raw);
  const posted = clubDate(postedAt);
  const date = dateIn(text, posted);
  const time = timeIn(text);
  const location = locationIn(raw);
  const { links, rsvpLink } = linksIn(raw);
  const type = typeIn(text);
  const recap = isRecap(text);
  const invites =
    /\b(join us|come (by|out|through)|rsvp|register|sign up|see you (there|then)|don'?t miss|save the date|mark your calendars?)\b/i.test(
      text,
    );
  const isEvent =
    Boolean(date) && !recap && Boolean(time || location || invites);
  const confidence =
    isEvent && time && location
      ? "high"
      : isEvent && (time || location)
        ? "medium"
        : "low";

  const description = text
    .split("\n")
    .filter((line) => !/^(?:https?:\/\/|\s*$)/.test(line))
    .join(" ")
    .replace(/https?:\/\/\S+/g, "")
    // A label left pointing at a removed link: "Register:", "RSVP here:".
    .replace(
      /\b(?:register|rsvp|sign ?up|link|tickets|details)(?:\s+here)?\s*:\s*(?=\s|$)/gi,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();

  return {
    title: titleIn(raw),
    date,
    time,
    location,
    description:
      description.length > 480
        ? `${description.slice(0, 477).replace(/\s+\S*$/, "")}…`
        : description,
    type,
    tags: tagsIn(text, type),
    rsvpLink,
    links,
    recap,
    isEvent,
    confidence,
  };
};
