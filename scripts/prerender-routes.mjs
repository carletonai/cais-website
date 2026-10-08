// Static hosts answer a path with its index.html, so writing one per route
// gives every page a 200 and its own title, description, canonical URL and
// social tags, all visible to crawlers and link previews without running any
// JavaScript. src/components/RouteMeta.tsx applies the same values on
// client-side navigation; both read src/data/seo.json, and event pages read
// the same helpers in src/lib/shared/.
//
// This script also writes, for every event:
//   /events/<slug>/index.html   its page, previewing with its poster
//   /events/<slug>.ics          a calendar file with a reminder
// plus /events.ics, the feed people subscribe to, and sitemap.xml.
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { eventPath, eventSlug } from "../src/lib/shared/event-time.js";
import { eventPageMeta } from "../src/lib/shared/event-meta.js";
import {
  FEED_PATH,
  feedEvents,
  icsPath,
  vcalendar,
} from "../src/lib/shared/ics.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const appSource = join(root, "src", "app", "App.tsx");
const readJson = (...path) =>
  JSON.parse(readFileSync(join(root, ...path), "utf8"));
const seo = readJson("src", "data", "seo.json");
const { events } = readJson("src", "data", "events.json");

const fail = (message) => {
  console.error(`prerender-routes: ${message}`);
  process.exit(1);
};

const index = join(dist, "index.html");
if (!existsSync(index)) fail("dist/index.html missing — run the build first.");

// Read the routes off the router itself so this cannot drift from App.tsx.
// Routes with parameters (/events/:slug) are expanded from the data below.
const routes = [
  ...readFileSync(appSource, "utf8").matchAll(/<Route\s+path="([^"]+)"/g),
]
  .map((m) => m[1])
  .filter((p) => p !== "*" && !p.includes(":"));

if (routes.length === 0) fail("no routes found in src/app/App.tsx.");

const missing = routes.filter((r) => !seo.routes[r]);
if (missing.length > 0) fail(`no seo.json entry for ${missing.join(", ")}`);

const escape = (s) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const assets = readdirSync(join(dist, "assets"));
const builtFont = (prefix) => {
  const file = assets.find((a) => a.startsWith(prefix) && a.endsWith(".woff2"));
  if (!file) fail(`no built font matching ${prefix}*.woff2`);
  return `/assets/${file}`;
};

const FONTS = [
  {
    family: "Inter Variable",
    file: builtFont("inter-latin-wght-normal-"),
    weight: "100 900",
  },
  {
    family: "Space Grotesk Variable",
    file: builtFont("space-grotesk-latin-wght-normal-"),
    weight: "300 700",
  },
];

// The body and heading faces are needed for the first paint; without a
// preload they queue behind the stylesheet and the headline rewraps late.
const preloads = FONTS.map(
  ({ file }) =>
    `<link rel="preload" href="${file}" as="font" type="font/woff2" crossorigin />`,
).join("\n    ");

const template = readFileSync(index, "utf8").replace(
  "</head>",
  `  ${preloads}\n  </head>`,
);

/** Width and height of a JPEG, from its start-of-frame marker. */
const jpegSize = (file) => {
  const data = readFileSync(file);
  let i = 2;
  while (i < data.length) {
    if (data[i] !== 0xff) return null;
    const marker = data[i + 1];
    const length = data.readUInt16BE(i + 2);
    // SOF0-SOF15, except DHT (C4), JPG (C8) and DAC (CC).
    if (
      marker >= 0xc0 &&
      marker <= 0xcf &&
      ![0xc4, 0xc8, 0xcc].includes(marker)
    ) {
      return {
        height: data.readUInt16BE(i + 5),
        width: data.readUInt16BE(i + 7),
      };
    }
    i += 2 + length;
  }
  return null;
};

/**
 * The built HTML with this page's metadata in place of the placeholders.
 * @param {{ path: string, title: string, description: string,
 *   image?: { url: string, width: number, height: number, alt: string } }} page
 */
const render = ({ path, title, description, image }) => {
  const fullTitle =
    title === seo.siteName ? title : `${title} | ${seo.siteName}`;
  const url = `${seo.siteUrl}${path === "/" ? "/" : path}`;
  const t = escape(fullTitle);
  const d = escape(description);

  // Replacer functions, not strings: a replacement string would read "$2",
  // "$&" or "$'" in a title or description as a pattern, not as text.
  const set = (html, pattern, value) =>
    html.replace(pattern, (_, open, close) => `${open}${value}${close}`);

  let html = template.replace(
    /<title>[^<]*<\/title>/,
    () => `<title>${t}</title>`,
  );
  html = set(html, /(<meta name="description" content=")[^"]*(")/, d);
  html = set(html, /(<link rel="canonical" href=")[^"]*(")/, url);
  html = set(html, /(<meta property="og:title" content=")[^"]*(")/, t);
  html = set(html, /(<meta property="og:description" content=")[^"]*(")/, d);
  html = set(html, /(<meta property="og:url" content=")[^"]*(")/, url);
  html = set(html, /(<meta name="twitter:title" content=")[^"]*(")/, t);
  html = set(html, /(<meta name="twitter:description" content=")[^"]*(")/, d);
  if (image) {
    const src = escape(`${seo.siteUrl}${image.url}`);
    html = set(html, /(<meta property="og:image" content=")[^"]*(")/, src);
    html = set(html, /(<meta name="twitter:image" content=")[^"]*(")/, src);
    html = set(
      html,
      /(<meta property="og:image:width" content=")[^"]*(")/,
      String(image.width),
    );
    html = set(
      html,
      /(<meta property="og:image:height" content=")[^"]*(")/,
      String(image.height),
    );
    html = set(
      html,
      /(<meta property="og:image:alt" content=")[^"]*(")/,
      escape(image.alt),
    );
  }
  return html;
};

const write = (path, html) => {
  if (path === "/") return writeFileSync(index, html);
  const dir = join(dist, path);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), html);
};

for (const route of routes) {
  write(route, render({ path: route, ...seo.routes[route] }));
}

// One page and one calendar file per event.
const slugs = new Set();
const now = new Date();
for (const event of events) {
  const slug = eventSlug(event);
  if (slugs.has(slug)) fail(`two events share the slug ${slug}`);
  slugs.add(slug);

  let image;
  if (event.poster) {
    const file = join(root, "public", event.poster);
    if (!existsSync(file))
      fail(`event ${event.id}: no file for ${event.poster}`);
    const size = jpegSize(file);
    if (!size)
      fail(`event ${event.id}: ${event.poster} is not a readable JPEG`);
    image = { url: event.poster, ...size, alt: `Poster for ${event.title}` };
  }
  const meta = eventPageMeta(event);
  write(
    eventPath(event),
    render({
      path: eventPath(event),
      title: meta.title,
      description: meta.description,
      image,
    }),
  );
  writeFileSync(join(dist, icsPath(event)), vcalendar([event], { now }));
}
writeFileSync(
  join(dist, FEED_PATH),
  vcalendar(feedEvents(events, now), { now, feed: true }),
);

// public/404.html is served on its own, without the app's CSS, so it has no
// way to reach the webfonts. Point it at the hashed files vite already emitted
// rather than shipping a second copy.
const notFoundPage = join(dist, "404.html");
if (existsSync(notFoundPage)) {
  const faces = FONTS.map(
    ({ family, file, weight }) => `      @font-face {
        font-family: "${family}";
        font-style: normal;
        font-display: swap;
        font-weight: ${weight};
        src: url(${file}) format("woff2-variations");
      }`,
  ).join("\n");

  const html = readFileSync(notFoundPage, "utf8");
  if (!html.includes("<!--FONT-FACE-->"))
    fail("404.html is missing its <!--FONT-FACE--> marker.");
  writeFileSync(
    notFoundPage,
    html.replace("<!--FONT-FACE-->", `<style>\n${faces}\n    </style>`),
  );
}

const today = now.toISOString().slice(0, 10);
const pages = [...routes, ...events.map(eventPath)];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (r) =>
      `  <url>\n    <loc>${seo.siteUrl}${r === "/" ? "/" : r}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`,
  )
  .join("\n")}
</urlset>
`;
writeFileSync(join(dist, "sitemap.xml"), sitemap);

console.log(
  `prerender-routes: ${routes.length} routes, ${events.length} event pages and calendar files, ${FEED_PATH}, sitemap.xml`,
);
