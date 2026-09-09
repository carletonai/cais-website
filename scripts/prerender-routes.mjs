// GitHub Pages serves 404.html (with a 404 status) for any path that is not a
// real file, so SPA deep links like /contact only worked via the redirect
// bounce in public/404.html — bad for crawlers and for anyone reading status
// codes. Writing an index.html per route makes Pages answer those paths with a
// 200 directly; 404.html stays as the fallback for URLs that do not exist.
//
// Each page also gets its own title, description, canonical URL and social
// tags baked in, so a crawler sees the right metadata without running any
// JavaScript. src/components/RouteMeta.tsx applies the same values on
// client-side navigation, and both read src/data/seo.json.
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const appSource = join(root, "src", "app", "App.tsx");
const seo = JSON.parse(
  readFileSync(join(root, "src", "data", "seo.json"), "utf8"),
);

const index = join(dist, "index.html");
if (!existsSync(index)) {
  console.error(
    "prerender-routes: dist/index.html missing — run the build first.",
  );
  process.exit(1);
}

// Read the routes off the router itself so this cannot drift from App.tsx.
const routes = [
  ...readFileSync(appSource, "utf8").matchAll(/<Route\s+path="([^"]+)"/g),
]
  .map((m) => m[1])
  .filter((p) => p !== "*");

if (routes.length === 0) {
  console.error("prerender-routes: no routes found in src/app/App.tsx.");
  process.exit(1);
}

const missing = routes.filter((r) => !seo.routes[r]);
if (missing.length > 0) {
  console.error(
    `prerender-routes: no seo.json entry for ${missing.join(", ")}`,
  );
  process.exit(1);
}

const escape = (s) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const template = readFileSync(index, "utf8");

/** Swap the placeholder metadata in the built HTML for this route's values. */
const render = (route) => {
  const { title, description } = seo.routes[route];
  const fullTitle =
    title === seo.siteName ? title : `${title} | ${seo.siteName}`;
  const url = `${seo.siteUrl}${route === "/" ? "/" : route}`;
  const t = escape(fullTitle);
  const d = escape(description);

  return template
    .replace(/<title>[^<]*<\/title>/, `<title>${t}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${d}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${t}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${d}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${t}$2`)
    .replace(
      /(<meta name="twitter:description" content=")[^"]*(")/,
      `$1${d}$2`,
    );
};

for (const route of routes) {
  const html = render(route);
  if (route === "/") {
    writeFileSync(index, html);
  } else {
    const dir = join(dist, route);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "index.html"), html);
  }
}

// public/404.html is served on its own, without the app's CSS, so it has no
// way to reach the webfonts. Point it at the hashed files vite already emitted
// rather than shipping a second copy: the page then renders in the site's own
// typefaces instead of falling back to a system sans.
const FONT_FACES = [
  {
    family: "Inter Variable",
    prefix: "inter-latin-wght-normal-",
    weight: "100 900",
  },
  {
    family: "Manrope Variable",
    prefix: "manrope-latin-wght-normal-",
    weight: "200 800",
  },
];

const notFoundPage = join(dist, "404.html");
if (existsSync(notFoundPage)) {
  const assets = readdirSync(join(dist, "assets"));
  const faces = FONT_FACES.map(({ family, prefix, weight }) => {
    const file = assets.find(
      (a) => a.startsWith(prefix) && a.endsWith(".woff2"),
    );
    if (!file) {
      console.error(
        `prerender-routes: no built font matching ${prefix}*.woff2`,
      );
      process.exit(1);
    }
    return `      @font-face {
        font-family: "${family}";
        font-style: normal;
        font-display: swap;
        font-weight: ${weight};
        src: url(/assets/${file}) format("woff2-variations");
      }`;
  }).join("\n");

  const html = readFileSync(notFoundPage, "utf8");
  if (!html.includes("<!--FONT-FACE-->")) {
    console.error(
      "prerender-routes: 404.html is missing its <!--FONT-FACE--> marker.",
    );
    process.exit(1);
  }
  writeFileSync(
    notFoundPage,
    html.replace("<!--FONT-FACE-->", `<style>\n${faces}\n    </style>`),
  );
}

const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (r) =>
      `  <url>\n    <loc>${seo.siteUrl}${r === "/" ? "/" : r}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`,
  )
  .join("\n")}
</urlset>
`;
writeFileSync(join(dist, "sitemap.xml"), sitemap);

console.log(
  `prerender-routes: ${routes.length} routes with metadata + sitemap.xml (${routes.join(", ")})`,
);
