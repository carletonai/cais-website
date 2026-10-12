// @ts-check
/**
 * The "New event" issue form (.github/ISSUE_TEMPLATE/new-event.yml) turned
 * into an entry for src/data/events.json, kept free of I/O so it can be
 * tested. scripts/event-from-issue.mjs does the reading and writing, and
 * .github/workflows/event-intake.yml runs it when such an issue is opened
 * or edited. See CONTRIBUTING.md, "Adding an event from GitHub".
 */
import { dateIn, parseCaption, tagsIn, timeIn } from "./instagram-caption.js";
import { nextId } from "./instagram-sync-core.js";

/** The form's fields, by the label GitHub writes above each answer. */
export const FIELDS = {
  date: "Date",
  endDate: "Last day",
  time: "Time",
  location: "Location",
  type: "Type",
  description: "Description",
  tags: "Tags",
  rsvp: "RSVP or registration link",
  instagram: "Instagram post",
  materials: "Materials",
  poster: "Poster",
};

export const TYPES = ["Workshop", "Talk", "Social", "Competition"];

/** The tag each type carries on the site, so its filter finds the event. */
const TYPE_TAGS = {
  Workshop: "technical",
  Talk: "technical",
  Social: "social",
  Competition: "competition",
};

/** The boxes on the form, plus the tags the site already uses. */
export const KNOWN_TAGS = [
  "beginner-friendly",
  "hands-on",
  "technical",
  "online",
  "free-food",
  "guest-speaker",
  "networking",
  "recruitment",
  "hackathon",
  "social",
  "competition",
  "discussion",
  "conceptual",
  "educational",
  "planning",
];

/** Hosts an image dragged into an issue can come from; nothing else is fetched. */
const POSTER_HOSTS = [
  "github.com",
  "user-images.githubusercontent.com",
  "private-user-images.githubusercontent.com",
];

const escapeRegExp = (/** @type {string} */ text) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Only the form's own headings split the body: a "### " typed into the
 *  description is part of the description. */
const HEADING = new RegExp(
  `^### +(${Object.values(FIELDS).map(escapeRegExp).join("|")}) *$`,
  "m",
);

/**
 * GitHub renders a submitted issue form as "### Label" headings, each
 * followed by the answer, with "_No response_" for a blank optional field.
 * @param {string} body
 * @returns {Record<string, string>} answers by label
 */
export const parseIssueForm = (body) => {
  /** @type {Record<string, string>} */
  const answers = {};
  const parts = (body ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/<!--[\s\S]*?-->/g, "")
    .split(HEADING);
  // parts[0] is anything before the first heading; then label, value, ...
  for (let i = 1; i + 1 < parts.length; i += 2) {
    const value = parts[i + 1].trim();
    answers[parts[i].trim()] = value === "_No response_" ? "" : value;
  }
  return answers;
};

/** Whether a body is a submission of this form at all. */
export const isEventForm = (/** @type {string} */ body) => {
  const answers = parseIssueForm(body);
  return FIELDS.date in answers && FIELDS.description in answers;
};

/** The boxes ticked in a checkboxes field. */
export const ticked = (/** @type {string} */ value) =>
  [...(value ?? "").matchAll(/^\s*- \[[xX]\] (.+?)\s*$/gm)].map((m) => m[1]);

const collapse = (/** @type {string} */ text) =>
  (text ?? "").replace(/\s+/g, " ").trim();

const validDate = (/** @type {string} */ date) => {
  const [y, m, d] = date.split("-").map(Number);
  const probe = new Date(Date.UTC(y, m - 1, d));
  return (
    probe.getUTCFullYear() === y &&
    probe.getUTCMonth() === m - 1 &&
    probe.getUTCDate() === d
  );
};

const MONTH = String.raw`(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?`;
const WEEKDAY = String.raw`(?:mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)[a-z]*\.?,?`;
const NAMES_A_MONTH = new RegExp(`\\b${MONTH}`, "i");

/**
 * YYYY-MM-DD from what someone typed: the ISO form, or a date with its
 * month written out ("October 23", "Oct 23, 2026"). Nothing relative:
 * "Friday" or "next week" would mean something else by the time the
 * issue is edited and read again.
 * @param {string} text
 * @param {string} today YYYY-MM-DD, for a written date without a year
 * @returns {{ date: string, yearGiven: boolean } | null}
 */
export const readDate = (text, today) => {
  const value = collapse(text);
  if (!value) return null;
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value);
  if (iso) {
    const date = `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
    return validDate(date) ? { date, yearGiven: true } : null;
  }
  if (!NAMES_A_MONTH.test(value)) return null;
  const date = dateIn(value, today);
  return date && validDate(date)
    ? { date, yearGiven: /\b\d{4}\b/.test(value) }
    : null;
};

const CLOCK = String.raw`(?:noon|\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)?)`;
const RANGE = String.raw`(?:-|–|—|to|until|till)`;
/** "6pm", "6:00 PM - 7:00 PM", "noon to 2": a time and nothing else. */
const JUST_A_TIME = new RegExp(`^${CLOCK}(?:\\s*${RANGE}\\s*${CLOCK})?$`, "i");

/** "18:00" -> "6:00 pm", only when nothing in the text says am or pm. */
const from24h = (/** @type {string} */ text) =>
  /\b[ap]\.?m\b/i.test(text) || /\bnoon\b/i.test(text)
    ? text
    : text.replace(/\b([01]?\d|2[0-3]):([0-5]\d)\b/g, (_, h, m) => {
        const hour = Number(h);
        if (
          hour < 8 &&
          !/\b(?:0\d|[1-7]):\d{2}\b.*\b(?:1\d|2[0-3]):/.test(text)
        )
          return `${h}:${m}`; // "6:00 - 7:00" is left for the period rule below
        return `${hour % 12 || 12}:${m} ${hour < 12 ? "am" : "pm"}`;
      });

/**
 * "6:00 PM - 7:00" takes the period of its start; "11 AM - 1" crosses noon.
 * @param {string} text
 */
const endPeriod = (text) => {
  const m =
    /^(\d{1,2})(?::\d{2})?\s*([ap])\.?m\.?\s*(-|–|—|to|until|till)\s*(\d{1,2})((?::\d{2})?)$/i.exec(
      text,
    );
  if (!m) return text;
  const [, start, period, sep, end, minutes] = m;
  const crosses = Number(end) % 12 < Number(start) % 12 && Number(end) !== 12;
  const endPeriodLetter = crosses
    ? period.toLowerCase() === "a"
      ? "pm"
      : "am"
    : `${period.toLowerCase()}m`;
  return `${text.slice(0, m.index + m[0].length - end.length - minutes.length)}${end}${minutes} ${endPeriodLetter}`.replace(
    sep,
    "-",
  );
};

/**
 * The time field as events.json writes it: "6:00 PM - 7:00 PM", a start
 * time, "" for all day. Free text ("Sat 10–4, Sun 10–1") is kept as it is,
 * since the site shows such a time as written.
 * @param {string} text
 * @returns {{ time: string, normalized: boolean }}
 */
export const readTime = (text) => {
  const value = collapse(text);
  if (!value || /^(tba|tbd|all day)$/i.test(value))
    return { time: "", normalized: true };
  const candidate = endPeriod(from24h(value));
  if (JUST_A_TIME.test(candidate)) {
    const time = timeIn(candidate);
    const range = new RegExp(`\\s${RANGE}\\s|\\d${RANGE}\\d`, "i").test(
      candidate,
    );
    // A range that came back as a single time lost its end: not normalized.
    if (time && (!range || time.includes(" - ")))
      return { time, normalized: true };
  }
  return { time: value, normalized: false };
};

/** A segment that only says when: "Friday, October 23", "Oct 23, 2026", "2026-10-23". */
const DATE_ONLY = new RegExp(
  `^(?:${WEEKDAY}\\s*)?(?:${MONTH}\\s+\\d{1,2}(?:st|nd|rd|th)?|\\d{1,2}(?:st|nd|rd|th)?\\s+(?:of\\s+)?${MONTH}|\\d{4}-\\d{2}-\\d{2})(?:,?\\s*\\d{4})?$`,
  "i",
);
const LABEL_LINE =
  /^(?:date|time|when|where|location|venue|place|rsvp|register|sign ?up|link|tickets|cost|price)\s*:/i;
/** Emoji and the joiners that build them, which label caption lines. */
const PICTOGRAPHS = /\p{Extended_Pictographic}|\u{FE0F}|\u{200D}|\u{20E3}/gu;
const TRIM = /^[\s\-–—•|:·,]+|[\s\-–—•|:·,]+$/g;

/**
 * A pasted caption without its date, time and place lines: they become
 * fields of their own, so the card should not repeat them. A line is
 * dropped when every piece of it (split at emoji, "|", "•" or a wide gap)
 * is a date, a time or the place.
 * @param {string} raw
 * @param {string[]} places what the place was read as, to drop its line
 */
export const captionBody = (raw, places) => {
  const known = places.map((p) => collapse(p).toLowerCase()).filter(Boolean);
  return (raw ?? "")
    .split("\n")
    .filter((line) => {
      if (/^\s*📍/u.test(line)) return false;
      const pieces = line
        .replace(PICTOGRAPHS, "|")
        .split(/\s*[|•·]\s*|\s{2,}/)
        .map((piece) => piece.replace(TRIM, "").trim())
        .filter(Boolean);
      if (pieces.length === 0) return true; // keeps paragraph breaks
      if (LABEL_LINE.test(pieces.join(" "))) return false;
      return !pieces.every(
        (piece) =>
          DATE_ONLY.test(piece) ||
          JUST_A_TIME.test(piece) ||
          known.includes(piece.toLowerCase()),
      );
    })
    .join("\n");
};

/** The first image link in a textarea: Markdown, HTML or bare. */
export const posterUrlIn = (/** @type {string} */ text) => {
  const value = text ?? "";
  const url =
    /!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/.exec(value)?.[1] ??
    /<img[^>]+src="(https?:\/\/[^"]+)"/i.exec(value)?.[1] ??
    /https?:\/\/\S+/.exec(value)?.[0] ??
    null;
  if (!url) return null;
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === "https:" && POSTER_HOSTS.includes(hostname)
      ? url
      : null;
  } catch {
    return null;
  }
};

const isHttps = (/** @type {string} */ url) => /^https:\/\/\S+$/.test(url);

/** Two links to the same Instagram post, however it was copied. */
const samePost = (/** @type {string} */ a, /** @type {string} */ b) => {
  const key = (/** @type {string} */ url) =>
    url
      .toLowerCase()
      .replace(/^https?:\/\/(www\.)?/, "")
      .replace(/[?#].*$/, "")
      .replace(/\/+$/, "");
  return key(a) === key(b);
};

/** Titles that are the same event: case, punctuation and spacing aside. */
const sameTitle = (/** @type {string} */ a, /** @type {string} */ b) =>
  collapse(a)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "") ===
  collapse(b)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

/** The issue's title without the form's "Event:" prefix. */
export const eventTitle = (/** @type {string} */ issueTitle) =>
  collapse((issueTitle ?? "").replace(/^\s*(?:new\s+)?event\s*:\s*/i, ""));

/**
 * @typedef {object} IssueEvent
 * @property {Record<string, unknown> | null} event the entry for events.json, or null when there are errors
 * @property {string | null} posterUrl the image to download, if one was attached
 * @property {string[]} errors what must change before an event can be drafted
 * @property {string[]} warnings what the drafter should know
 */

/**
 * @param {Record<string, string>} answers from parseIssueForm
 * @param {{ title: string, today: string, events: { id: string, title: string, date: string, instagram?: string }[], issueUrl?: string }} context
 *   title is the issue's title, which is the event's
 * @returns {IssueEvent}
 */
export const eventFromIssue = (
  answers,
  { title: issueTitle, today, events, issueUrl },
) => {
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];
  const get = (/** @type {keyof typeof FIELDS} */ key) =>
    answers[FIELDS[key]] ?? "";

  const title = eventTitle(issueTitle);
  if (!title)
    errors.push("The issue's **title** is the event's title: give it one.");
  else if (title.length > 120)
    errors.push("The **title** is too long (120 characters at most).");

  const dateRead = readDate(get("date"), today);
  const date = dateRead?.date ?? null;
  if (!date)
    errors.push(
      `**${FIELDS.date}** could not be read: write it as YYYY-MM-DD (2026-10-09), or with the month spelled out.`,
    );
  else {
    if (!dateRead?.yearGiven)
      warnings.push(`The date was read as ${date}; write the year to be sure.`);
    if (date < today)
      warnings.push(
        `The date (${date}) has passed; it goes in as a past event.`,
      );
  }

  /** @type {string | undefined} */
  let endDate;
  if (collapse(get("endDate"))) {
    const read = readDate(get("endDate"), today)?.date ?? null;
    if (!read)
      errors.push(
        `**${FIELDS.endDate}** could not be read: write it as YYYY-MM-DD.`,
      );
    else if (date && read < date)
      errors.push(`**${FIELDS.endDate}** is before the date.`);
    else if (date && read === date)
      warnings.push(
        "The last day is the same as the date, so it was left out.",
      );
    else endDate = read;
  }

  const rawDescription = get("description");
  if (!collapse(rawDescription))
    errors.push(`**${FIELDS.description}** is required.`);
  // The description doubles as a caption: anything the other fields left
  // blank is read from it, and its own date, time, place and link lines
  // come out of what the card shows.
  const postedAt = new Date(`${today}T12:00:00-04:00`);
  const parsed = parseCaption(rawDescription, { postedAt });

  const typeAnswer = collapse(get("type"));
  const type = typeAnswer || "Workshop";
  if (!TYPES.includes(type))
    errors.push(`**${FIELDS.type}** must be one of ${TYPES.join(", ")}.`);

  let { time, normalized } = readTime(get("time"));
  if (!normalized) {
    warnings.push(
      `The time was kept as written ("${time}"); the site shows it as is and treats the day as all-day. "6:00 PM - 7:00 PM" gives it exact times.`,
    );
  } else if (!collapse(get("time")) && parsed.time) {
    time = parsed.time;
    warnings.push(`The time (${time}) was read from the description.`);
  }

  let location = collapse(get("location"));
  if (!location && parsed.location) {
    location = parsed.location;
    warnings.push(`The place (${location}) was read from the description.`);
  }

  let rsvpLink = collapse(get("rsvp"));
  if (rsvpLink && !isHttps(rsvpLink))
    errors.push(`**${FIELDS.rsvp}** must be an https link.`);
  if (!rsvpLink && parsed.rsvpLink) {
    rsvpLink = parsed.rsvpLink;
    warnings.push("The RSVP link was read from the description.");
  }

  const instagram = collapse(get("instagram"));
  if (instagram && !/^https:\/\/(www\.)?instagram\.com\/\S+$/.test(instagram))
    errors.push(`**${FIELDS.instagram}** must be an instagram.com link.`);

  const materials = collapse(get("materials"));
  if (materials && !isHttps(materials))
    errors.push(`**${FIELDS.materials}** must be an https link.`);

  const posterAnswer = get("poster");
  const posterUrl = posterUrlIn(posterAnswer);
  if (posterAnswer && !posterUrl)
    warnings.push(
      "No image was found in the Poster box; drag the image file into it so GitHub uploads it. The event goes in without a poster.",
    );

  const chosen = ticked(get("tags"));
  const unknown = chosen.filter((tag) => !KNOWN_TAGS.includes(tag));
  if (unknown.length > 0)
    errors.push(
      `**${FIELDS.tags}** has ${unknown.map((t) => `"${t}"`).join(", ")}, which the site does not use.`,
    );
  const typeTag = TYPE_TAGS[/** @type {keyof typeof TYPE_TAGS} */ (type)];
  const tags = [
    ...new Set([
      ...(chosen.length > 0 ? chosen : tagsIn(rawDescription, type)),
      ...(typeTag ? [typeTag] : []),
    ]),
  ];

  const description =
    parseCaption(captionBody(rawDescription, [location, parsed.location]), {
      postedAt,
    }).description || collapse(rawDescription);

  for (const existing of events) {
    if (
      instagram &&
      existing.instagram &&
      samePost(existing.instagram, instagram)
    )
      errors.push(
        `That Instagram post is already on the site as event #${existing.id} (${existing.title}).`,
      );
    else if (date && existing.date === date && sameTitle(existing.title, title))
      errors.push(
        `"${existing.title}" on ${date} is already on the site as event #${existing.id}.`,
      );
  }

  if (errors.length > 0) return { event: null, posterUrl, errors, warnings };

  return {
    event: {
      id: nextId(events),
      title,
      date,
      time,
      location,
      description,
      type,
      ...(rsvpLink && { rsvpLink }),
      ...(materials && { materials }),
      ...(instagram && { instagram }),
      ...(endDate && { endDate }),
      tags,
      ...(issueUrl && { issue: issueUrl }),
    },
    posterUrl,
    errors,
    warnings,
  };
};

/** A value in a Markdown table cell. */
const cell = (/** @type {unknown} */ value) =>
  String(value ?? "").replace(/\|/g, "\\|");

/**
 * The pull request's description, or the comment that explains why no
 * draft was made.
 * @param {IssueEvent} result
 * @param {{ issueNumber: string | number, poster: "attached" | "none" | "failed" }} context
 */
export const describeDraft = (result, { issueNumber, poster }) => {
  if (!result.event) {
    return [
      "## No event drafted yet",
      "",
      "The form needs a change before an event can be made from it:",
      "",
      ...result.errors.map((e) => `- ${e}`),
      "",
      "Edit the issue (the ··· menu at the top right of its first comment, then Edit) and the check runs again.",
    ].join("\n");
  }
  const e = result.event;
  const lines = [
    `## Event drafted from #${issueNumber}`,
    "",
    "| | |",
    "| --- | --- |",
    `| Title | ${cell(e.title)} |`,
    `| Date | ${e.date}${e.endDate ? ` to ${e.endDate}` : ""} |`,
    `| Time | ${cell(e.time) || "all day"} |`,
    `| Place | ${cell(e.location) || "?"} |`,
    `| Type | ${e.type} |`,
    `| Tags | ${/** @type {string[]} */ (e.tags).join(", ") || "none"} |`,
    `| Poster | ${poster === "attached" ? "attached" : poster === "failed" ? "could not be saved" : "none"} |`,
    "",
    "Check it against the announcement, then merge: the event goes on the calendar, its page and its calendar file are built, and the issue closes. To change something, edit the issue and this pull request is redrafted. If another event's pull request merges first, edit the issue once more so this one takes the next free id.",
  ];
  if (result.warnings.length > 0) {
    lines.push(
      "",
      "Worth a look:",
      "",
      ...result.warnings.map((w) => `- ${w}`),
    );
  }
  lines.push("", `Closes #${issueNumber}`);
  return lines.join("\n");
};
