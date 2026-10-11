// @ts-check
/**
 * Title, description and preview image for an event's page. The prerender
 * script bakes these into /events/<slug>/index.html for link previews, and
 * RouteMeta applies the same values on client-side navigation.
 */
import { formatEventDate, formatWhen } from "./event-time.js";

/** @typedef {import("./event-time.js").EventLike} EventLike */

/** Cut at a word boundary, never mid-word, with an ellipsis. */
const clip = (/** @type {string} */ text, /** @type {number} */ max) => {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[\s,;:.–-]+$/, "")}…`;
};

/**
 * The tab and search-result title is the event's name; search engines show
 * about sixty characters, and the date leads the description anyway. Link
 * previews in chats get the date in the title too.
 * @param {EventLike} event
 */
export const eventPageMeta = (event) => {
  const when = formatWhen(event, { year: true });
  const where = event.location ? ` · ${event.location}` : "";
  return {
    title: event.title,
    ogTitle: `${event.title} · ${formatEventDate(event.date, { year: true })}`,
    description: clip(`${when}${where}. ${event.description}`, 160),
    image: event.poster ?? null,
  };
};
