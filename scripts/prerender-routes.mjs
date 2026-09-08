// GitHub Pages serves 404.html (with a 404 status) for any path that is not a
// real file, so SPA deep links like /contact only worked via the redirect
// bounce in public/404.html — bad for crawlers and for anyone reading status
// codes. Copying the built index.html to <route>/index.html makes Pages answer
// those paths with a 200 directly; 404.html stays as the fallback for URLs
// that genuinely do not exist.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const appSource = join(root, "src", "app", "App.tsx");

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
  .filter((p) => p !== "*" && p !== "/");

if (routes.length === 0) {
  console.error("prerender-routes: no routes found in src/app/App.tsx.");
  process.exit(1);
}

const html = readFileSync(index, "utf8");
for (const route of routes) {
  const dir = join(dist, route);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), html);
}

console.log(
  `prerender-routes: wrote ${routes.length} route pages (${routes.join(", ")})`,
);
