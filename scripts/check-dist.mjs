// Checks what the build wrote, after scripts/prerender-routes.mjs: every page
// the site promises exists with its own <head>, every calendar file is there,
// the sitemap lists exactly those pages, and nothing in a page's <head> points
// at a file that was not built. It fails the build otherwise, so a regression
// in the prerender step cannot ship while CI stays green (og:image:alt once
// went unreplaced on every poster page for days before anyone looked).
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { eventPath } from "../src/lib/shared/event-time.js";
import { eventPageMeta } from "../src/lib/shared/event-meta.js";
import { FEED_PATH, feedEvents, icsPath } from "../src/lib/shared/ics.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const readJson = (...path) =>
  JSON.parse(readFileSync(join(root, ...path), "utf8"));
const seo = readJson("src", "data", "seo.json");
const { events } = readJson("src", "data", "events.json");

const problems = [];
const check = (ok, message) => {
  if (!ok) problems.push(message);
};

const escape = (s) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const fullTitle = (title) =>
  title === seo.siteName ? title : `${title} | ${seo.siteName}`;
const absolute = (path) => `${seo.siteUrl}${path === "/" ? "/" : path}`;
const attribute = (html, pattern) => pattern.exec(html)?.[1];
const meta = (html, name, by = "property") =>
  attribute(html, new RegExp(`<meta\\s+${by}="${name}"\\s+content="([^"]*)"`));

const pages = [
  ...Object.entries(seo.routes).map(([path, route]) => ({
    path,
    title: fullTitle(route.title),
    ogTitle: fullTitle(route.title),
    description: route.description,
    jsonLd: path === "/" ? "Organization" : null,
  })),
  ...events.map((event) => {
    const page = eventPageMeta(event);
    return {
      path: eventPath(event),
      title: fullTitle(page.title),
      ogTitle: page.ogTitle,
      description: page.description,
      jsonLd: "Event",
      event,
    };
  }),
];

const titles = new Map();
for (const page of pages) {
  const file = join(dist, page.path, "index.html");
  if (!existsSync(file)) {
    problems.push(`${page.path}: no index.html`);
    continue;
  }
  const html = readFileSync(file, "utf8");
  const titleTags = html.match(/<title>[^<]*<\/title>/g) ?? [];
  check(
    titleTags.length === 1,
    `${page.path}: ${titleTags.length} <title> tags`,
  );
  check(
    titleTags[0] === `<title>${escape(page.title)}</title>`,
    `${page.path}: title is ${titleTags[0]}, expected ${page.title}`,
  );
  check(
    !titles.has(page.title),
    `${page.path}: same title as ${titles.get(page.title)}`,
  );
  titles.set(page.title, page.path);
  check(page.description.length > 0, `${page.path}: no description to write`);
  check(
    meta(html, "description", "name") === escape(page.description),
    `${page.path}: description not written`,
  );
  check(
    attribute(html, /<link rel="canonical" href="([^"]*)"/) ===
      absolute(page.path),
    `${page.path}: canonical URL not written`,
  );
  check(meta(html, "og:url") === absolute(page.path), `${page.path}: og:url`);
  check(
    meta(html, "og:title") === escape(page.ogTitle),
    `${page.path}: og:title is ${meta(html, "og:title")}`,
  );
  check(
    !html.includes('content=""'),
    `${page.path}: a placeholder was left empty`,
  );

  const blocks = [
    ...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs),
  ].map((m) => m[1]);
  if (page.jsonLd) {
    check(blocks.length === 1, `${page.path}: ${blocks.length} JSON-LD blocks`);
    try {
      const data = JSON.parse(blocks[0] ?? "");
      check(
        data["@type"] === page.jsonLd,
        `${page.path}: JSON-LD is ${data["@type"]}, expected ${page.jsonLd}`,
      );
    } catch {
      problems.push(`${page.path}: JSON-LD does not parse`);
    }
  } else {
    check(blocks.length === 0, `${page.path}: unexpected JSON-LD`);
  }

  // Everything the head loads from this site must have been built.
  for (const [, href] of html.matchAll(
    /<(?:link|script)\b[^>]*\b(?:href|src)="(\/[^"?#]+)"/g,
  )) {
    check(existsSync(join(dist, href)), `${page.path}: ${href} was not built`);
  }

  if (page.event) {
    const { event } = page;
    if (event.poster) {
      check(
        meta(html, "og:image") === escape(`${seo.siteUrl}${event.poster}`),
        `${page.path}: og:image is not the poster`,
      );
      check(
        meta(html, "og:image:alt") === escape(`Poster for ${event.title}`),
        `${page.path}: og:image:alt not written`,
      );
    }
    const ics = join(dist, icsPath(event));
    if (!existsSync(ics)) {
      problems.push(`${page.path}: no calendar file`);
    } else {
      const text = readFileSync(ics, "utf8");
      check(
        text.includes(`UID:event-${event.id}@carletonai.com`) &&
          text.includes("DTSTART"),
        `${page.path}: calendar file is incomplete`,
      );
    }
  }
}

const feed = join(dist, FEED_PATH);
if (!existsSync(feed)) {
  problems.push(`${FEED_PATH} was not built`);
} else {
  const count = (readFileSync(feed, "utf8").match(/BEGIN:VEVENT/g) ?? [])
    .length;
  const expected = feedEvents(events, new Date()).length;
  check(
    count === expected,
    `${FEED_PATH}: ${count} events, expected ${expected}`,
  );
}

const sitemap = join(dist, "sitemap.xml");
if (!existsSync(sitemap)) {
  problems.push("sitemap.xml was not built");
} else {
  const locs = [
    ...readFileSync(sitemap, "utf8").matchAll(/<loc>([^<]*)<\/loc>/g),
  ]
    .map((m) => m[1])
    .sort();
  const wanted = pages.map((page) => absolute(page.path)).sort();
  check(
    JSON.stringify(locs) === JSON.stringify(wanted),
    `sitemap.xml lists ${locs.length} URLs; the build wrote ${wanted.length} pages`,
  );
}

const notFound = join(dist, "404.html");
if (!existsSync(notFound)) {
  problems.push("404.html was not built");
} else {
  const html = readFileSync(notFound, "utf8");
  const faces = [...html.matchAll(/src: url\(([^)]+)\)/g)].map((m) => m[1]);
  check(faces.length > 0, "404.html has no @font-face");
  for (const face of faces) {
    check(existsSync(join(dist, face)), `404.html: ${face} was not built`);
  }
}

check(!existsSync(join(dist, ".vite")), "dist/.vite should not be deployed");

if (problems.length > 0) {
  console.error(`check-dist: ${problems.length} problem(s)`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}
console.log(
  `check-dist: ${pages.length} pages, ${events.length} calendar files, ${FEED_PATH}, sitemap.xml and 404.html look right`,
);
