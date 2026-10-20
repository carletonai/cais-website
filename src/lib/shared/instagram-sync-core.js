// @ts-check
/**
 * The decisions behind scripts/instagram-sync.mjs, kept free of I/O so they
 * can be tested: which posts to look at, what a draft event looks like, and
 * how the run is summarized for the pull request.
 */

/** @typedef {import("./instagram-caption.js").ParsedCaption} ParsedCaption */

/**
 * @typedef {object} Media an item from the Instagram API
 * @property {string} id
 * @property {string} [caption]
 * @property {"IMAGE" | "VIDEO" | "CAROUSEL_ALBUM"} media_type
 * @property {string} [media_url]
 * @property {string} [thumbnail_url]
 * @property {string} permalink
 * @property {string} timestamp ISO 8601
 * @property {{ data: { media_type: string; media_url?: string }[] }} [children]
 */

/**
 * @typedef {object} Seen a post the sync has already decided about
 * @property {string} id
 * @property {string} permalink
 * @property {"event" | "skipped"} decision
 * @property {string} [eventId]
 * @property {string} [reason]
 * @property {string} at ISO date of the decision
 */

/** Posts older than this are not announcements of anything to come. */
export const MAX_AGE_DAYS = 60;

/**
 * The code that names an Instagram post, wherever its link was copied from:
 * instagram.com/p/<code>/, /reel/<code>/ and /tv/<code>/, with or without
 * the account's name in front (instagram.com/carletonaisociety/p/<code>/),
 * a query or a trailing slash. Codes are case-sensitive. Null for anything
 * that is not a post link.
 */
export const instagramPostCode = (/** @type {string} */ url) =>
  /^https?:\/\/(?:www\.)?instagram\.com\/(?:[\w.]+\/)?(?:p|reels?|tv)\/([\w-]+)/i.exec(
    url.trim(),
  )?.[1] ?? null;

/** Two links to the same post, however each was copied. */
export const samePost = (/** @type {string} */ a, /** @type {string} */ b) => {
  const code = instagramPostCode(a);
  if (code) return code === instagramPostCode(b);
  const bare = (/** @type {string} */ url) =>
    url
      .trim()
      .replace(/[?#].*$/, "")
      .replace(/\/+$/, "");
  return bare(a) === bare(b);
};

/**
 * The posts worth reading: not decided before, not already an event on the
 * site, and recent enough to announce something.
 * @param {Media[]} media
 * @param {{ seen: Seen[], events: { instagram?: string }[], now: Date }} context
 */
export const candidates = (media, { seen, events, now }) => {
  const decided = new Set(seen.map((s) => s.id));
  const cutoff = now.getTime() - MAX_AGE_DAYS * 86_400_000;
  return media.filter(
    (m) =>
      !decided.has(m.id) &&
      !events.some((e) => e.instagram && samePost(e.instagram, m.permalink)) &&
      Date.parse(m.timestamp) >= cutoff,
  );
};

/** The next free event id: one past the highest in use. */
export const nextId = (/** @type {{ id: string }[]} */ events) =>
  String(Math.max(0, ...events.map((e) => Number(e.id) || 0)) + 1);

/** The still image to use as the poster: a video's thumbnail, a carousel's first photo. */
export const posterSource = (/** @type {Media} */ media) => {
  if (media.media_type === "VIDEO") return media.thumbnail_url ?? null;
  if (media.media_type === "CAROUSEL_ALBUM") {
    const photo = media.children?.data.find(
      (child) => child.media_type === "IMAGE" && child.media_url,
    );
    return photo?.media_url ?? media.media_url ?? null;
  }
  return media.media_url ?? null;
};

/** "intro-to-agentic-ai-2026", the way posters are named in public/assets/events. */
export const posterName = (
  /** @type {string} */ title,
  /** @type {string} */ date,
) => {
  const slug = title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/, "");
  return `${slug || "event"}-${date.slice(0, 4)}`;
};

/**
 * A draft entry for events.json. The poster fields are added once the image
 * is on disk; everything else comes from the caption.
 * @param {Media} media
 * @param {ParsedCaption} parsed
 * @param {string} id
 */
export const draftEvent = (media, parsed, id) => {
  if (!parsed.date) throw new Error(`post ${media.id} has no date`);
  return {
    id,
    title: parsed.title || "Untitled event",
    date: parsed.date,
    time: parsed.time,
    location: parsed.location,
    description: parsed.description,
    type: parsed.type,
    ...(parsed.rsvpLink && { rsvpLink: parsed.rsvpLink }),
    instagram: media.permalink,
    tags: parsed.tags,
  };
};

/**
 * @typedef {object} Outcome
 * @property {Media} media
 * @property {ParsedCaption} parsed
 * @property {"event" | "skipped"} decision
 * @property {string} [reason]
 * @property {{ id: string, title: string, date: string }} [event]
 */

/** The run, as the pull request will describe it. */
export const summarize = (/** @type {Outcome[]} */ outcomes) => {
  const added = outcomes.filter((o) => o.decision === "event");
  const skipped = outcomes.filter((o) => o.decision === "skipped");
  const lines = ["## Instagram sync", ""];
  if (added.length === 0) lines.push("No new event announcements found.");
  else {
    lines.push(
      `${added.length} new ${added.length === 1 ? "event" : "events"} drafted from Instagram. Check the dates, times and places against the posts before merging; the parser reads captions, it does not understand them.`,
      "",
      "| Event | Date | Time | Place | Confidence | Post |",
      "| --- | --- | --- | --- | --- | --- |",
      ...added.map(
        (o) =>
          `| ${o.event?.title} (#${o.event?.id}) | ${o.parsed.date} | ${o.parsed.time || "all day"} | ${o.parsed.location || "?"} | ${o.parsed.confidence} | [post](${o.media.permalink}) |`,
      ),
    );
  }
  if (skipped.length > 0) {
    lines.push(
      "",
      `<details><summary>${skipped.length} ${skipped.length === 1 ? "post" : "posts"} skipped</summary>`,
      "",
      ...skipped.map(
        (o) => `- [${o.media.id}](${o.media.permalink}): ${o.reason}`,
      ),
      "",
      "</details>",
    );
  }
  return lines.join("\n");
};
