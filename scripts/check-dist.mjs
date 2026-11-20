// Checks what the build wrote, after scripts/prerender-routes.mjs: every page
// the site promises exists with its own <head> and its own prerendered
// content, every calendar file is there,
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
import { documentTitle } from "../src/lib/shared/title.js";

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
/** Text React escaped back to what it says, to compare with the data. */
const decode = (s) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
const fullTitle = (meta) => documentTitle(meta, seo.siteName);
const absolute = (path) => `${seo.siteUrl}${path === "/" ? "/" : path}`;
const attribute = (html, pattern) => pattern.exec(html)?.[1];
const meta = (html, name, by = "property") =>
  attribute(html, new RegExp(`<meta\\s+${by}="${name}"\\s+content="([^"]*)"`));

const pages = [
  ...Object.entries(seo.routes).map(([path, route]) => ({
    path,
    title: fullTitle(route),
    ogTitle: fullTitle(route),
    description: route.description,
    jsonLd: path === "/" ? ["Organization", "WebSite"] : [],
  })),
  ...events.map((event) => {
    const page = eventPageMeta(event);
    return {
      path: eventPath(event),
      title: fullTitle(page),
      ogTitle: page.ogTitle,
      description: page.description,
      // Google requires an Event's location, so an event without one has
      // only its breadcrumb trail.
      jsonLd: event.location ? ["Event", "BreadcrumbList"] : ["BreadcrumbList"],
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

  // The page itself, prerendered into #root for crawlers and for anyone
  // without JavaScript: its own content, written in place. A page that
  // threw, or a Suspense boundary written as a spinner plus an inline script
  // to swap it (which the CSP blocks), must not ship.
  const rootAt = html.indexOf('<div id="root"');
  const body = rootAt === -1 ? "" : html.slice(rootAt);
  check(
    body.startsWith(`<div id="root" data-path="${escape(page.path)}"`),
    `${page.path}: #root is not marked as this page's prerender`,
  );
  const headings = [...body.matchAll(/<h1\b[^>]*>(.*?)<\/h1>/gs)].map((m) =>
    decode(m[1].replace(/<[^>]*>/g, "")),
  );
  check(
    headings.length === 1,
    `${page.path}: ${headings.length} <h1> in the prerendered page`,
  );
  if (page.event) {
    check(
      headings[0] === page.event.title,
      `${page.path}: <h1> is ${headings[0]}, expected ${page.event.title}`,
    );
  }
  for (const [marker, what] of [
    ["<script", "an inline script"],
    ["<template", "a streaming placeholder"],
    ["<!--$?-->", "a boundary still loading"],
    ["<!--$!-->", "a boundary that failed to render"],
    ["Loading page", "the loading spinner"],
  ]) {
    check(!body.includes(marker), `${page.path}: page body has ${what}`);
  }

  const blocks = [
    ...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs),
  ].map((m) => m[1]);
  const data = blocks.flatMap((block) => {
    try {
      return [JSON.parse(block)];
    } catch {
      problems.push(`${page.path}: JSON-LD does not parse`);
      return [];
    }
  });
  const types = data.map((d) => d["@type"]).join(", ");
  check(
    types === page.jsonLd.join(", "),
    `${page.path}: JSON-LD is [${types}], expected [${page.jsonLd.join(", ")}]`,
  );
  // Google's required Event properties; a missing one turns a rich result
  // into an error in Search Console.
  for (const event of data.filter((d) => d["@type"] === "Event")) {
    for (const field of ["name", "startDate", "location"]) {
      check(event[field], `${page.path}: Event JSON-LD has no ${field}`);
    }
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
