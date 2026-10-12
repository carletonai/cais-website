#!/usr/bin/env node
// @ts-check
/**
 * A "New event" issue → events.json.
 *
 * Reads the submitted issue form, drafts the event into src/data/events.json
 * with its poster saved beside the others, and writes what happened for the
 * pull request (or, when the form needs fixing, for a comment on the issue).
 * .github/workflows/event-intake.yml runs this when such an issue is opened
 * or edited. See CONTRIBUTING.md, "Adding an event from GitHub".
 *
 *   ISSUE_NUMBER=12 ISSUE_TITLE="Event: ML 101" ISSUE_URL=… ISSUE_BODY="$(cat issue.md)" \
 *     node scripts/event-from-issue.mjs [--dry-run] [--summary-file out.md]
 *   node scripts/event-from-issue.mjs --body issue.md --title "ML 101" --dry-run   (local)
 */
import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  describeDraft,
  eventFromIssue,
  parseIssueForm,
} from "../src/lib/shared/event-issue.js";
import { posterName } from "../src/lib/shared/instagram-sync-core.js";
import { freePosterName, savePoster } from "./lib/poster.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const flag = (/** @type {string} */ name) => args.includes(name);
const option = (/** @type {string} */ name) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : null;
};
const dryRun = flag("--dry-run");
const bodyFile = option("--body");
const summaryFile = option("--summary-file");

const eventsPath = join(root, "src/data/events.json");
/** Posters wider than this are scaled down; the site's are about 1236px. */
const MAX_POSTER_WIDTH = 1600;

const fail = (/** @type {string} */ message) => {
  console.error(`event-from-issue: ${message}`);
  process.exit(1);
};

/** YYYY-MM-DD in Ottawa. */
const clubDate = (/** @type {Date} */ date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

const output = (/** @type {string} */ name, /** @type {string} */ value) => {
  if (process.env.GITHUB_OUTPUT)
    appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
};

const main = async () => {
  const body = bodyFile
    ? readFileSync(resolve(bodyFile), "utf8")
    : (process.env.ISSUE_BODY ?? "");
  const title = option("--title") ?? process.env.ISSUE_TITLE ?? "";
  const issueNumber = process.env.ISSUE_NUMBER ?? "0";
  const issueUrl = process.env.ISSUE_URL;
  if (!body.trim()) return fail("no issue body (ISSUE_BODY or --body)");

  /** @type {{ events: any[] }} */
  const file = JSON.parse(readFileSync(eventsPath, "utf8"));
  const events = file.events;
  const today = clubDate(new Date());

  const answers = parseIssueForm(body);
  const result = eventFromIssue(answers, { title, today, events, issueUrl });

  /** @type {"attached" | "none" | "failed"} */
  let posterState = result.posterUrl ? "attached" : "none";
  /** @type {{ poster: string, posterWidth: number, posterHeight: number } | null} */
  let poster = null;
  if (result.event && result.posterUrl && !dryRun) {
    try {
      poster = await savePoster(
        result.posterUrl,
        freePosterName(
          root,
          posterName(String(result.event.title), String(result.event.date)),
        ),
        { root, normalize: true, maxWidth: MAX_POSTER_WIDTH },
      );
    } catch (error) {
      posterState = "failed";
      result.warnings.push(
        `The poster could not be saved (${/** @type {Error} */ (error).message}); the event goes in without one. Add it by hand to the pull request if you want it.`,
      );
    }
  }

  if (result.event) {
    const { tags, ...rest } = result.event;
    const event = poster ? { ...rest, ...poster, tags } : { ...rest, tags };
    events.push(event);
    if (dryRun) console.log(JSON.stringify(event, null, 2));
    else {
      writeFileSync(eventsPath, `${JSON.stringify({ events }, null, 2)}\n`);
      execFileSync("pnpm", ["exec", "prettier", "--write", eventsPath], {
        cwd: root,
        stdio: "ignore",
      });
    }
    output("added", "1");
    output("event_id", String(event.id));
    output("title", String(event.title).replace(/[\r\n]/g, " "));
  } else {
    output("added", "0");
  }

  const summary = describeDraft(result, { issueNumber, poster: posterState });
  console.log(summary);
  if (summaryFile) writeFileSync(summaryFile, `${summary}\n`);
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`);
  console.error(
    result.event
      ? `event-from-issue: drafted event #${result.event.id} from issue #${issueNumber}`
      : `event-from-issue: issue #${issueNumber} needs ${result.errors.length} ${result.errors.length === 1 ? "fix" : "fixes"}`,
  );
};

main().catch((error) => fail(error.message));
