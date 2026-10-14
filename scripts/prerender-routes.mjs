// Static hosts answer a path with its index.html, so writing one per route
// gives every page a 200 and its own title, description, canonical URL and
// social tags, all visible to crawlers and link previews without running any
// JavaScript. src/components/RouteMeta.tsx applies the same values on
// client-side navigation; both read src/data/seo.json, and event pages read
// the same helpers in src/lib/shared/.
//
// Each page also preloads the JS chunk its route is split into (read from the
// build manifest) and, on event pages, the poster, so a direct hit does not
// wait for the main bundle to run before it learns what else to fetch. Event
// pages carry schema.org Event data and the home page the Organization.
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
  rmSync,
} from "node:fs";
import { dirname, join, posix, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  eventPath,
  eventSlug,
  eventWindow,
} from "../src/lib/shared/event-time.js";
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

// Read the routes, and which page module each one loads, off the router
// itself so this cannot drift from App.tsx. Routes with parameters
// (/events/:slug) are expanded from the data below.
const app = readFileSync(appSource, "utf8");
// Every <Route> must be read, or a page would silently stop being built and
// 404 on Vercel while CI stays green; only the catch-all is exempt.
const routeElements = new Map();
// A tag ends at a "/>" that is not the page element's own ("<Page />}").
const tags = [...app.matchAll(/<Route\b[\s\S]*?\/>(?!\})/g)].map((m) => m[0]);
if (tags.length !== (app.match(/<Route\b/g) ?? []).length)
  fail("could not read every <Route> in src/app/App.tsx");
for (const tag of tags) {
  const path = /\bpath="([^"]+)"/.exec(tag)?.[1];
  if (!path) fail(`App.tsx has a <Route> without a path: ${tag}`);
  if (path === "*") continue;
  const element = /\belement={<(\w+)[^>]*\/>}/.exec(tag)?.[1];
  if (!element)
    fail(
      `App.tsx route ${path}: write it as <Route path="…" element={<Page />} />`,
    );
  routeElements.set(path, element);
}
const lazyModules = new Map(
  [...app.matchAll(/const (\w+) = lazy\(\(\) => import\("([^"]+)"\)\)/g)].map(
    (m) => [m[1], m[2]],
  ),
);
const routes = [...routeElements.keys()].filter((p) => !p.includes(":"));

if (routes.length === 0) fail("no routes found in src/app/App.tsx.");

const missing = routes.filter((r) => !seo.routes[r]);
if (missing.length > 0) fail(`no seo.json entry for ${missing.join(", ")}`);
const unrouted = Object.keys(seo.routes).filter((r) => !routeElements.has(r));
if (unrouted.length > 0)
  fail(`seo.json lists ${unrouted.join(", ")}, which App.tsx does not route`);

const escape = (s) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const assets = readdirSync(join(dist, "assets"));
const builtAsset = (prefix, extension) => {
  const file = assets.find(
    (a) => a.startsWith(prefix) && a.endsWith(`.${extension}`),
  );
  if (!file) fail(`no built file matching ${prefix}*.${extension}`);
  return `/assets/${file}`;
};
const builtFont = (prefix) => builtAsset(prefix, "woff2");

// The variable faces, which 404.html also needs (see the end of this file).
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

// The body and heading faces are needed for the first paint, and the mono
// face labels the hero and the navigation; without a preload they queue
// behind the stylesheet and the headline rewraps late.
const preloads = [
  ...FONTS.map(({ file }) => file),
  builtFont("ibm-plex-mono-latin-500-normal-"),
]
  .map(
    (file) =>
      `<link rel="preload" href="${file}" as="font" type="font/woff2" crossorigin />`,
  )
  .join("\n    ");

const template = readFileSync(index, "utf8").replace(
  "</head>",
  () => `  ${preloads}\n  </head>`,
);

// Vite's manifest maps each lazily imported page module to its chunk and the
// chunks that one imports. It is a build detail, not a page, so it is read
// here and removed from dist.
const manifestFile = join(dist, ".vite", "manifest.json");
if (!existsSync(manifestFile))
  fail(
    "dist/.vite/manifest.json missing — vite.config.ts must set build.manifest.",
  );
const manifest = JSON.parse(readFileSync(manifestFile, "utf8"));
rmSync(join(dist, ".vite"), { recursive: true, force: true });

// What index.html already loads or preloads; a page only adds what its own
// route needs on top.
const alreadyLoaded = new Set(
  [
    ...template.matchAll(
      /<(?:script|link)[^>]*(?:src|href)="(\/assets\/[^"]+\.js)"/g,
    ),
  ].map((m) => m[1]),
);

/** The hashed JS chunks a route's page needs: its own and its static imports. */
const chunksFor = (route) => {
  const module = lazyModules.get(routeElements.get(route));
  if (!module) return []; // part of the main bundle
  const source = posix.join("src/app", module);
  const key = ["tsx", "ts"]
    .map((ext) => `${source}.${ext}`)
    .find((k) => manifest[k]);
  if (!key) fail(`no manifest entry for ${module} (route ${route})`);
  const files = new Set();
  const visit = (k) => {
    const entry = manifest[k];
    if (!entry || files.has(entry.file)) return;
    files.add(entry.file);
    for (const dep of entry.imports ?? []) visit(dep);
  };
  visit(key);
  return [...files]
    .map((f) => `/${f}`)
    .filter((f) => f.endsWith(".js") && !alreadyLoaded.has(f));
};

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

/** A JSON-LD block. "<" is escaped so no value can end the script early. */
const jsonLd = (data) =>
  `<script type="application/ld+json">${JSON.stringify(data).replace(
    /</g,
    "\\u003c",
  )}</script>`;

const absolute = (path) => `${seo.siteUrl}${path === "/" ? "/" : path}`;

const organization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: seo.siteName,
  alternateName: "CAIS",
  url: absolute("/"),
  logo: `${seo.siteUrl}/brand/cais-logo.svg`,
  sameAs: seo.sameAs,
};

/** schema.org Event data for an event's page. */
const eventData = (event, image) => {
  const window = eventWindow(event);
  const online = /^online\b/i.test(event.location);
  const url = absolute(eventPath(event));
  const endDate = window.multiDay
    ? event.endDate
    : !window.allDay && window.endKnown
      ? window.end.toISOString()
      : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description,
    url,
    startDate: window.allDay ? event.date : window.start.toISOString(),
    ...(endDate && { endDate }),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: online
      ? "https://schema.org/OnlineEventAttendanceMode"
      : "https://schema.org/OfflineEventAttendanceMode",
    ...(online
      ? { location: { "@type": "VirtualLocation", url } }
      : event.location && {
          location: {
            "@type": "Place",
            name: event.location,
            address: {
              "@type": "PostalAddress",
              addressLocality: "Ottawa",
              addressRegion: "ON",
              addressCountry: "CA",
            },
          },
        }),
    ...(image && { image: [`${seo.siteUrl}${image.url}`] }),
    organizer: {
      "@type": "Organization",
      name: seo.siteName,
      url: absolute("/"),
    },
  };
};

/**
 * The built HTML with this page's metadata in place of the placeholders.
 * @param {{ path: string, title: string, ogTitle?: string, description: string,
 *   image?: { url: string, width: number, height: number, alt: string },
 *   head?: string[] }} page
 */
const render = ({ path, title, ogTitle, description, image, head = [] }) => {
  const fullTitle =
    title === seo.siteName ? title : `${title} | ${seo.siteName}`;
  const url = absolute(path);
  const t = escape(fullTitle);
  const preview = escape(ogTitle ?? fullTitle);
  const d = escape(description);

  // Replacer functions, not strings: a replacement string would read "$2",
  // "$&" or "$'" in a title or description as a pattern, not as text. Every
  // placeholder must be found, or a page would ship the template's values.
  const set = (html, pattern, value) => {
    if (!pattern.test(html)) fail(`index.html has nothing matching ${pattern}`);
    return html.replace(pattern, (_, open, close) => `${open}${value}${close}`);
  };
  const meta = (attribute, name) =>
    new RegExp(`(<meta\\s+${attribute}="${name}"\\s+content=")[^"]*(")`);

  if (!/<title>[^<]*<\/title>/.test(template))
    fail("index.html has no <title>");
  let html = template.replace(
    /<title>[^<]*<\/title>/,
    () => `<title>${t}</title>`,
  );
  html = set(html, meta("name", "description"), d);
  html = set(html, /(<link rel="canonical" href=")[^"]*(")/, url);
  html = set(html, meta("property", "og:title"), preview);
  html = set(html, meta("property", "og:description"), d);
  html = set(html, meta("property", "og:url"), url);
  html = set(html, meta("name", "twitter:title"), preview);
  html = set(html, meta("name", "twitter:description"), d);
  const extra = [...head];
  if (image) {
    const src = escape(`${seo.siteUrl}${image.url}`);
    html = set(html, meta("property", "og:image"), src);
    html = set(html, meta("name", "twitter:image"), src);
    html = set(html, meta("property", "og:image:width"), String(image.width));
    html = set(html, meta("property", "og:image:height"), String(image.height));
    html = set(html, meta("property", "og:image:alt"), escape(image.alt));
    // The poster is the largest thing on the page and the HTML already knows
    // it; without this it is only requested once the page's JS has rendered.
    extra.push(
      `<link rel="preload" as="image" href="${escape(image.url)}" fetchpriority="high" />`,
    );
  }
  for (const chunk of chunksFor(
    path.includes("/events/") ? "/events/:slug" : path,
  )) {
    extra.push(`<link rel="modulepreload" crossorigin href="${chunk}" />`);
  }
  if (extra.length > 0) {
    html = html.replace(
      "</head>",
      () => `  ${extra.join("\n    ")}\n  </head>`,
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
  write(
    route,
    render({
      path: route,
      ...seo.routes[route],
      head: route === "/" ? [jsonLd(organization)] : [],
    }),
  );
}

// One page and one calendar file per event. The id is the key in every URL
// and calendar file (CONTRIBUTING), so it must be a whole number nothing
// else uses: anything else builds a page the app cannot look up.
const ids = new Set();
const slugs = new Set();
const now = new Date();
for (const event of events) {
  if (!/^\d+$/.test(event.id))
    fail(`event ${JSON.stringify(event.id)}: ids are whole numbers`);
  if (ids.has(event.id)) fail(`two events share the id ${event.id}`);
  ids.add(event.id);
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
    if (event.posterWidth !== size.width || event.posterHeight !== size.height)
      fail(
        `event ${event.id}: ${event.poster} is ${size.width}×${size.height}; ` +
          `set "posterWidth": ${size.width}, "posterHeight": ${size.height} in events.json`,
      );
    image = { url: event.poster, ...size, alt: `Poster for ${event.title}` };
  }
  for (const photo of event.photos ?? []) {
    const file = join(root, "public", photo.src);
    if (!existsSync(file)) fail(`event ${event.id}: no file for ${photo.src}`);
    const size = jpegSize(file);
    if (!size) fail(`event ${event.id}: ${photo.src} is not a readable JPEG`);
    if (photo.width !== size.width || photo.height !== size.height)
      fail(
        `event ${event.id}: ${photo.src} is ${size.width}×${size.height}; ` +
          `set "width": ${size.width}, "height": ${size.height} in events.json`,
      );
    if (!photo.alt?.trim())
      fail(`event ${event.id}: ${photo.src} needs "alt", what the photo shows`);
  }
  const meta = eventPageMeta(event);
  write(
    eventPath(event),
    render({
      path: eventPath(event),
      title: meta.title,
      ogTitle: meta.ogTitle,
      description: meta.description,
      image,
      head: [jsonLd(eventData(event, image))],
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
    html.replace("<!--FONT-FACE-->", () => `<style>\n${faces}\n    </style>`),
  );
}

// No <lastmod>: the only honest value would be the last change to each
// page's content, which the build does not know, and a build date on every
// URL is a signal search engines learn to ignore.
const pages = [...routes, ...events.map(eventPath)];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((r) => `  <url>\n    <loc>${absolute(r)}</loc>\n  </url>`).join("\n")}
</urlset>
`;
writeFileSync(join(dist, "sitemap.xml"), sitemap);

console.log(
  `prerender-routes: ${routes.length} routes, ${events.length} event pages and calendar files, ${FEED_PATH}, sitemap.xml`,
);
