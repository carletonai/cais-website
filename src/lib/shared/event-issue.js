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
  title: "Event title",
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

/** Hosts an image dragged into an issue can come from; nothing else is fetched. */
const POSTER_HOSTS = [
  "github.com",
  "user-images.githubusercontent.com",
  "private-user-images.githubusercontent.com",
];

/**
 * GitHub renders a submitted issue form as "### Label" headings, each
 * followed by the answer, with "_No response_" for a blank optional field.
 * @param {string} body
 * @returns {Record<string, string>} answers by label
 */
export const parseIssueForm = (body) => {
  /** @type {Record<string, string>} */
  const answers = {};
  const parts = (body ?? "").replace(/\r\n/g, "\n").split(/^### +(.+?) *$/m);
  // parts[0] is anything before the first heading; then label, value, ...
  for (let i = 1; i + 1 < parts.length; i += 2) {
    const value = parts[i + 1].trim();
    answers[parts[i].trim()] = value === "_No response_" ? "" : value;
  }
  return answers;
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

/**
 * YYYY-MM-DD from what someone typed: the ISO form, or a written date
 * resolved the way captions are ("Oct 9" is the next October 9th).
 * @param {string} text
 * @param {string} today YYYY-MM-DD
 */
export const readDate = (text, today) => {
  const value = collapse(text);
  if (!value) return null;
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value);
  const date = iso
    ? `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`
    : dateIn(value, today);
  return date && validDate(date) ? date : null;
};

const CLOCK = String.raw`(?:noon|\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)?)`;
/** "6pm", "6:00 PM - 7:00 PM", "noon to 2": a time and nothing else. */
const JUST_A_TIME = new RegExp(
  `^${CLOCK}(?:\\s*(?:-|–|—|to|until|till)\\s*${CLOCK})?$`,
  "i",
);

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
  if (JUST_A_TIME.test(value)) {
    const time = timeIn(value);
    if (time) return { time, normalized: true };
  }
  return { time: value, normalized: false };
};

const MONTH = String.raw`(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?`;
const WEEKDAY = String.raw`(?:mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)[a-z]*\.?,?`;
/** A line that only says when: "Friday, October 23", "Oct 23, 2026", "2026-10-23". */
const DATE_LINE = new RegExp(
  `^(?:${WEEKDAY}\\s*)?(?:${MONTH}\\s+\\d{1,2}(?:st|nd|rd|th)?|\\d{1,2}(?:st|nd|rd|th)?\\s+(?:of\\s+)?${MONTH}|\\d{4}-\\d{2}-\\d{2})(?:,?\\s*\\d{4})?$`,
  "i",
);
const LABEL_LINE =
  /^(?:date|time|when|where|location|venue|place|rsvp|register|sign ?up|link|tickets|cost|price)\s*:/i;
/** Emoji and the joiners that build them, which label caption lines. */
const PICTOGRAPHS = /\p{Extended_Pictographic}|\u{FE0F}|\u{200D}|\u{20E3}/gu;

/**
 * A pasted caption without its date, time and place lines: they become
 * fields of their own, so the card should not repeat them.
 * @param {string} raw
 * @param {string} location what the place was read as, to drop its line
 */
export const captionBody = (raw, location) =>
  (raw ?? "")
    .split("\n")
    .filter((line) => {
      const bare = line
        .replace(PICTOGRAPHS, "")
        .replace(/^[\s\-–—•|:·]+|[\s\-–—•|:·]+$/g, "")
        .trim();
      if (!bare) return true; // keeps paragraph breaks
      if (LABEL_LINE.test(bare)) return false;
      if (DATE_LINE.test(bare) || JUST_A_TIME.test(bare)) return false;
      if (location && bare.toLowerCase() === location.toLowerCase())
        return false;
      return true;
    })
    .join("\n");

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

/** Titles that are the same event: case, punctuation and spacing aside. */
const sameTitle = (/** @type {string} */ a, /** @type {string} */ b) =>
  collapse(a)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "") ===
  collapse(b)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

/**
 * @typedef {object} IssueEvent
 * @property {Record<string, unknown> | null} event the entry for events.json, or null when there are errors
 * @property {string | null} posterUrl the image to download, if one was attached
 * @property {string[]} errors what must change before an event can be drafted
 * @property {string[]} warnings what the drafter should know
 */

/**
 * @param {Record<string, string>} answers from parseIssueForm
 * @param {{ today: string, events: { id: string, title: string, date: string, instagram?: string }[], issueUrl?: string }} context
 * @returns {IssueEvent}
 */
export const eventFromIssue = (answers, { today, events, issueUrl }) => {
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];
  const get = (/** @type {keyof typeof FIELDS} */ key) =>
    answers[FIELDS[key]] ?? "";

  const title = collapse(get("title"));
  if (!title) errors.push(`**${FIELDS.title}** is required.`);
  else if (title.length > 120)
    errors.push(`**${FIELDS.title}** is too long (120 characters at most).`);

  const date = readDate(get("date"), today);
  if (!date)
    errors.push(
      `**${FIELDS.date}** could not be read: write it as YYYY-MM-DD (2026-10-09).`,
    );
  else if (date < today)
    warnings.push(`The date (${date}) has passed; it goes in as a past event.`);

  /** @type {string | undefined} */
  let endDate;
  if (collapse(get("endDate"))) {
    const read = readDate(get("endDate"), today);
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
  const tags = chosen.length > 0 ? chosen : tagsIn(rawDescription, type);

  const description =
    parseCaption(captionBody(rawDescription, location), { postedAt })
      .description || collapse(rawDescription);

  for (const existing of events) {
    if (instagram && existing.instagram === instagram)
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

/**
 * The pull request's description, or the comment that explains why no
 * draft was made.
 * @param {IssueEvent} result
 * @param {{ issueNumber: string | number, poster?: string | null }} context
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
      "Edit the issue (the pencil on the first comment) and the check runs again.",
    ].join("\n");
  }
  const e = result.event;
  const lines = [
    `## Event drafted from #${issueNumber}`,
    "",
    "| | |",
    "| --- | --- |",
    `| Title | ${e.title} |`,
    `| Date | ${e.date}${e.endDate ? ` to ${e.endDate}` : ""} |`,
    `| Time | ${e.time || "all day"} |`,
    `| Place | ${e.location || "?"} |`,
    `| Type | ${e.type} |`,
    `| Tags | ${/** @type {string[]} */ (e.tags).join(", ") || "none"} |`,
    `| Poster | ${poster ? "attached" : result.posterUrl ? "could not be saved" : "none"} |`,
    "",
    "Check it against the announcement, then merge: the event goes on the calendar, its page and its calendar file are built, and this issue closes.",
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
