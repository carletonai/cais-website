#!/usr/bin/env node
// @ts-check
/**
 * Instagram → events.json.
 *
 * Reads the club's recent posts (its own, plus posts it is tagged in, which
 * is how collaborations arrive), works out which ones announce an event,
 * downloads their posters and appends draft entries to src/data/events.json.
 * The GitHub Action in .github/workflows/instagram-sync.yml runs this daily
 * and opens a pull request with the result; nothing reaches the site until
 * a person merges it. See CONTRIBUTING.md, "Instagram sync".
 *
 *   IG_ACCESS_TOKEN=… node scripts/instagram-sync.mjs [--dry-run] [--limit 25]
 *                                                     [--summary-file out.md]
 *   node scripts/instagram-sync.mjs --fixture posts.json --dry-run   (no network)
 *
 * With ANTHROPIC_API_KEY set, a small Claude model double-checks each
 * caption the heuristics flag, which catches dates written in prose and
 * posts that only sound like events. Without it the heuristics stand alone.
 */
import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseCaption } from "../src/lib/shared/instagram-caption.js";
import {
  candidates,
  draftEvent,
  nextId,
  posterName,
  posterSource,
  summarize,
} from "../src/lib/shared/instagram-sync-core.js";
import { savePoster } from "./lib/poster.mjs";

/** @typedef {import("../src/lib/shared/instagram-sync-core.js").Media} Media */
/** @typedef {import("../src/lib/shared/instagram-sync-core.js").Outcome} Outcome */
/** @typedef {import("../src/lib/shared/instagram-caption.js").ParsedCaption} ParsedCaption */

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const flag = (/** @type {string} */ name) => args.includes(name);
const option = (
  /** @type {string} */ name,
  /** @type {string | null} */ fallback,
) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const dryRun = flag("--dry-run");
const fixture = option("--fixture", null);
const limit = Number(option("--limit", "25"));
const summaryFile = option("--summary-file", null);

const API = `https://graph.instagram.com/${process.env.IG_API_VERSION ?? "v23.0"}`;
const FIELDS =
  "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,children{media_type,media_url}";
const eventsPath = join(root, "src/data/events.json");
const seenPath = join(root, "src/data/instagram-seen.json");
/** Decisions older than this are forgotten; the posts are too old to matter. */
const REMEMBER_DAYS = 180;

const fail = (/** @type {string} */ message) => {
  console.error(`instagram-sync: ${message}`);
  process.exit(1);
};
const readJson = (/** @type {string} */ path) =>
  JSON.parse(readFileSync(path, "utf8"));
const redact = (/** @type {string} */ url) =>
  url.replace(/access_token=[^&]+/, "access_token=…");

/** YYYY-MM-DD in Ottawa. */
const clubDate = (/** @type {Date} */ date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

const fetchJson = async (/** @type {string} */ url) => {
  const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (!response.ok) {
    throw new Error(
      `${response.status} ${response.statusText} for ${redact(url)}`,
    );
  }
  return response.json();
};

/** The club's own recent posts plus the ones it is tagged in. */
const fetchMedia = async (/** @type {string} */ token) => {
  const own = await fetchJson(
    `${API}/me/media?fields=${FIELDS}&limit=${limit}&access_token=${token}`,
  );
  /** @type {Media[]} */
  let tagged = [];
  try {
    const result = await fetchJson(
      `${API}/me/tags?fields=${FIELDS}&limit=${limit}&access_token=${token}`,
    );
    tagged = result.data ?? [];
  } catch (error) {
    console.warn(
      `instagram-sync: could not read the posts the club is tagged in (collaborations): ${/** @type {Error} */ (error).message}`,
    );
  }
  const byId = new Map();
  for (const item of [...(own.data ?? []), ...tagged]) byId.set(item.id, item);
  return [...byId.values()];
};

/**
 * Asks Claude to read the caption too, when a key is set. The model's answer
 * can veto a post or fill in what the heuristics missed; it never invents a
 * date the caption does not carry.
 * @param {string} caption
 * @param {ParsedCaption} parsed
 * @param {string} posted YYYY-MM-DD
 */
const refineWithClaude = async (caption, parsed, posted) => {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { parsed, veto: null };
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      signal: AbortSignal.timeout(30_000),
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL ?? "claude-haiku-5-5",
        max_tokens: 600,
        system:
          "You read Instagram captions from a university AI club and extract event announcements. Reply with JSON only, no prose: " +
          '{"is_event": boolean, "reason": string, "title": string, "date": "YYYY-MM-DD" | null, "time": "h:mm AM - h:mm PM" | "h:mm AM" | "", "location": string, "rsvp_link": string | null}. ' +
          "is_event is true only for a dated event still to come that people can attend. Use the posting date to resolve relative dates. Never invent a date, time or place the caption does not give.",
        messages: [
          {
            role: "user",
            content: `Posted on ${posted} (Ottawa).\n\nCaption:\n${caption}`,
          },
        ],
      }),
    });
    if (!response.ok)
      throw new Error(`${response.status} ${response.statusText}`);
    const result = await response.json();
    const text =
      result.content
        ?.map((/** @type {{ text?: string }} */ c) => c.text ?? "")
        .join("") ?? "";
    const json = JSON.parse(
      text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1),
    );
    if (json.is_event === false)
      return {
        parsed,
        veto: json.reason || "the model read it as not an event",
      };
    const refined = { ...parsed };
    if (typeof json.title === "string" && json.title.trim())
      refined.title = json.title.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(json.date ?? "")) refined.date = json.date;
    if (
      /^(\d{1,2}:\d{2} [AP]M( - \d{1,2}:\d{2} [AP]M)?|)$/.test(json.time ?? "")
    )
      refined.time = json.time;
    if (typeof json.location === "string")
      refined.location = json.location.trim();
    if (/^https:\/\//.test(json.rsvp_link ?? ""))
      refined.rsvpLink = json.rsvp_link;
    refined.isEvent = Boolean(refined.date);
    refined.confidence =
      refined.time && refined.location
        ? "high"
        : refined.time || refined.location
          ? "medium"
          : "low";
    return { parsed: refined, veto: null };
  } catch (error) {
    console.warn(
      `instagram-sync: Claude check skipped: ${/** @type {Error} */ (error).message}`,
    );
    return { parsed, veto: null };
  }
};

const main = async () => {
  /** @type {{ events: any[] }} */
  const eventsFile = readJson(eventsPath);
  /** @type {{ seen: import("../src/lib/shared/instagram-sync-core.js").Seen[] }} */
  const seenFile = readJson(seenPath);
  const events = eventsFile.events;
  const now = new Date();
  const today = clubDate(now);
  const seen = seenFile.seen.filter(
    (s) => Date.parse(s.at) >= now.getTime() - REMEMBER_DAYS * 86_400_000,
  );

  /** @type {Media[]} */
  let media;
  if (fixture) {
    const data = readJson(resolve(fixture));
    media = Array.isArray(data) ? data : (data.data ?? []);
  } else {
    const token = process.env.IG_ACCESS_TOKEN;
    if (!token)
      return fail(
        "IG_ACCESS_TOKEN is not set (see CONTRIBUTING.md, Instagram sync)",
      );
    media = await fetchMedia(token);
  }

  const todo = candidates(media, { seen, events, now }).sort(
    (a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp),
  );
  console.error(
    `instagram-sync: ${media.length} posts read, ${todo.length} new`,
  );

  /** @type {Outcome[]} */
  const outcomes = [];
  /** The full draft for each post that became one, for the dry-run report. */
  const drafted = new Map();
  let id = Number(nextId(events));
  for (const item of todo) {
    const caption = item.caption ?? "";
    const posted = clubDate(new Date(item.timestamp));
    let parsed = parseCaption(caption, { postedAt: new Date(item.timestamp) });
    /** @type {string | null} */
    let reason = null;
    if (!caption.trim()) reason = "no caption";
    else if (parsed.recap) reason = "a recap, not an announcement";
    else if (!parsed.date) reason = "no date in the caption";
    else if (!parsed.isEvent) reason = "dated, but nothing says it is an event";
    if (!reason && !dryRun) {
      const refined = await refineWithClaude(caption, parsed, posted);
      parsed = refined.parsed;
      if (refined.veto) reason = refined.veto;
    }
    if (!reason && parsed.date && parsed.date < today)
      reason = `dated ${parsed.date}, already past`;

    if (reason) {
      outcomes.push({ media: item, parsed, decision: "skipped", reason });
      seen.push({
        id: item.id,
        permalink: item.permalink,
        decision: "skipped",
        reason,
        at: today,
      });
      continue;
    }

    const draft = draftEvent(item, parsed, String(id));
    id += 1;
    const { tags, ...rest } = draft;
    /** @type {Record<string, unknown>} */
    let event = { ...rest, tags };
    const source = posterSource(item);
    if (!dryRun && source) {
      try {
        const poster = await savePoster(
          source,
          posterName(draft.title, draft.date),
          { root, log: (m) => console.warn(`instagram-sync: ${m}`) },
        );
        event = { ...rest, ...poster, tags };
      } catch (error) {
        console.warn(
          `instagram-sync: ${item.id}: ${/** @type {Error} */ (error).message}; the event goes in without a poster`,
        );
      }
    }
    events.push(event);
    drafted.set(item.id, event);
    outcomes.push({
      media: item,
      parsed,
      decision: "event",
      event: { id: draft.id, title: draft.title, date: draft.date },
    });
    seen.push({
      id: item.id,
      permalink: item.permalink,
      decision: "event",
      eventId: draft.id,
      at: today,
    });
  }

  const summary = summarize(outcomes);
  const added = outcomes.filter((o) => o.decision === "event").length;
  if (dryRun) {
    console.log(
      JSON.stringify(
        outcomes.map((o) => ({
          post: o.media.permalink,
          decision: o.decision,
          reason: o.reason,
          event: drafted.get(o.media.id),
          confidence: o.parsed.confidence,
        })),
        null,
        2,
      ),
    );
  } else {
    writeFileSync(eventsPath, `${JSON.stringify({ events }, null, 2)}\n`);
    writeFileSync(seenPath, `${JSON.stringify({ seen }, null, 2)}\n`);
    execFileSync(
      "pnpm",
      ["exec", "prettier", "--write", eventsPath, seenPath],
      { cwd: root, stdio: "ignore" },
    );
  }
  console.log(summary);
  if (summaryFile) writeFileSync(summaryFile, `${summary}\n`);
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`);
  if (process.env.GITHUB_OUTPUT)
    appendFileSync(process.env.GITHUB_OUTPUT, `added=${added}\n`);
};

main().catch((error) => fail(error.message));
