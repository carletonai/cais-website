// Renders a page of the site to HTML at build time, for
// scripts/prerender-routes.mjs to write into that page's #root. Built by
// "vite build --ssr" into dist-ssr/, which is not deployed.
//
// prerenderToNodeStream, unlike renderToString, waits for the lazy() route
// modules and so returns each page's content rather than its loading
// fallback. src/main.tsx then hydrates that HTML with the same providers and
// the same starting time.
import { prerenderToNodeStream } from "react-dom/static";
import { StaticRouter } from "react-router";
import { AppProviders, AppShell } from "./app/App";

/** The body HTML of the page at `url`, as rendered at `now`. */
export async function render(url: string, now: Date): Promise<string> {
  const errors: unknown[] = [];
  const { prelude } = await prerenderToNodeStream(
    <AppProviders now={now}>
      <StaticRouter location={url}>
        <AppShell />
      </StaticRouter>
    </AppProviders>,
    {
      onError: (error) => void errors.push(error),
      // Write every page's content in place. With the default chunk size a
      // boundary over ~12 kB is written as its loading fallback plus a hidden
      // copy that an inline <script> swaps in, which crawlers see as a
      // spinner and the site's CSP (script-src 'self') does not let run.
      progressiveChunkSize: Number.POSITIVE_INFINITY,
    },
  );
  let html = "";
  for await (const chunk of prelude) html += chunk;
  // A component that throws renders its Suspense fallback instead; a page
  // built that way would ship a spinner to crawlers, so fail the build.
  if (errors.length > 0) {
    throw new Error(`rendering ${url} failed: ${String(errors[0])}`, {
      cause: errors[0],
    });
  }
  return html;
}
