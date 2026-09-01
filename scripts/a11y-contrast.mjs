/**
 * WCAG 2.2 Level AAA contrast audit (SC 1.4.6).
 *
 * Static analysis of Tailwind classes cannot answer this site's question,
 * because most text here sits on a stack of gradients, blurred blooms and
 * grid overlays rather than on a flat token colour. So this measures pixels:
 *
 *   1. Render the page and screenshot it with artwork hidden ("ink" pass).
 *   2. Screenshot it again with glyphs made transparent ("backdrop" pass).
 *   3. Diff the two to find the pixels a glyph actually covers.
 *   4. At those pixels, composite the element's *specified* colour over the
 *      backdrop and compare luminance — WCAG's model, on the real backdrop.
 *
 * Gradient text (`bg-clip-text`) has no specified colour, so its rendered ink
 * is read straight from the screenshot; those headings are large enough that
 * glyph interiors reach full coverage.
 *
 * Usage:  node scripts/a11y-contrast.mjs [--base URL] [--width N] [--json FILE]
 * Requires a dev server (`npm run dev`) and Playwright's chromium.
 */
import { writeFileSync } from "node:fs";

const arg = (flag, fallback) => {
  const i = process.argv.indexOf(flag);
  return i > -1 ? process.argv[i + 1] : fallback;
};

const BASE = arg("--base", process.env.BASE || "http://localhost:5173");
const VW = Number(arg("--width", 1280));
const VH = Number(arg("--height", 900));
const JSON_OUT = arg("--json", null);
const ROUTES = arg(
  "--routes",
  "/,/about,/projects,/events,/contact,/team,/governance,/resources,/contribute",
).split(",");

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.error(
    "This audit needs Playwright:  npx playwright install chromium",
  );
  console.error(
    "then:  npx playwright ...  (or add playwright as a devDependency)",
  );
  process.exit(2);
}

/* Decorative animation is pinned at its brightest frame — the worst case for
   light text — so a passing run holds for every frame of the loop. */
const PIN = `*,*::before,*::after{animation-play-state:paused!important;transition:none!important}
.bg-glow::before{animation:none!important;opacity:.8!important;transform:scale(1.1)!important}`;
const NOART = `svg,img,video,canvas{visibility:hidden!important}`;
const NOINK = `${NOART}
*,*::before,*::after{-webkit-text-fill-color:transparent!important;text-shadow:none!important;caret-color:transparent!important}`;

const collect = () => {
  /* getComputedStyle returns oklch() for Tailwind v4 palette colours, so
     resolve every colour through a canvas: painting once on black and once on
     white recovers both the sRGB value and its alpha, whatever the notation. */
  const cv = new OffscreenCanvas(1, 1);
  const cx = cv.getContext("2d", { willReadFrequently: true });
  const cache = new Map();
  const resolve = (css) => {
    if (cache.has(css)) return cache.get(css);
    const on = (bg) => {
      cx.clearRect(0, 0, 1, 1);
      cx.fillStyle = bg;
      cx.fillRect(0, 0, 1, 1);
      cx.fillStyle = css;
      cx.fillRect(0, 0, 1, 1);
      return cx.getImageData(0, 0, 1, 1).data;
    };
    const b = on("#000"),
      w = on("#fff");
    const a = 1 - (w[0] - b[0]) / 255;
    const out =
      a < 0.004
        ? { r: 0, g: 0, b: 0, a: 0 }
        : { r: b[0] / a, g: b[1] / a, b: b[2] / a, a };
    cache.set(css, out);
    return out;
  };

  const out = [];
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
  const path = (el) => {
    const p = [];
    for (
      let n = el;
      n && n.nodeType === 1 && p.length < 3;
      n = n.parentElement
    ) {
      let s = n.tagName.toLowerCase();
      const c = (n.getAttribute("class") || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 3);
      if (c.length) s += "." + c.join(".");
      p.unshift(s);
    }
    return p.join(">");
  };

  for (let el = w.currentNode; el; el = w.nextNode()) {
    const own = [...el.childNodes]
      .filter((n) => n.nodeType === 3 && n.textContent.trim())
      .map((n) => n.textContent.trim())
      .join(" ");
    if (!own) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none") continue;

    let alpha = 1;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      alpha *= parseFloat(getComputedStyle(n).opacity);
    }
    if (alpha < 0.05) continue;

    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    if (
      r.bottom < 0 ||
      r.top > innerHeight ||
      r.right < 0 ||
      r.left > innerWidth
    )
      continue;

    out.push({
      path: path(el),
      text: own.slice(0, 50),
      rgba: resolve(cs.color),
      alpha,
      size: parseFloat(cs.fontSize),
      weight: Number(cs.fontWeight) || 400,
      gradient:
        cs.webkitBackgroundClip === "text" || cs.backgroundClip === "text",
      rect: { x: r.x, y: r.y, w: r.width, h: r.height },
    });
  }
  return out;
};

const measure = async ({ inkB64, bgB64, els }) => {
  const load = async (b64) => {
    const bmp = await createImageBitmap(
      await (await fetch("data:image/png;base64," + b64)).blob(),
    );
    const cv = new OffscreenCanvas(bmp.width, bmp.height);
    const c = cv.getContext("2d", { willReadFrequently: true });
    c.drawImage(bmp, 0, 0);
    return { ctx: c, w: bmp.width, h: bmp.height };
  };
  const ink = await load(inkB64),
    bg = await load(bgB64);
  const s = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const L = (r, g, b) => 0.2126 * s(r) + 0.7152 * s(g) + 0.0722 * s(b);
  const cr = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

  return els.map((e) => {
    const x0 = Math.max(0, Math.floor(e.rect.x)),
      y0 = Math.max(0, Math.floor(e.rect.y));
    const x1 = Math.min(ink.w, bg.w, Math.ceil(e.rect.x + e.rect.w));
    const y1 = Math.min(ink.h, bg.h, Math.ceil(e.rect.y + e.rect.h));
    if (x1 - x0 < 1 || y1 - y0 < 1) return { ...e, skip: "offscreen" };

    const A = ink.ctx.getImageData(x0, y0, x1 - x0, y1 - y0).data;
    const B = bg.ctx.getImageData(x0, y0, x1 - x0, y1 - y0).data;
    const n = A.length / 4;
    const diff = new Uint16Array(n);
    let max = 0;
    for (let i = 0, k = 0; k < n; i += 4, k++) {
      const d =
        Math.abs(A[i] - B[i]) +
        Math.abs(A[i + 1] - B[i + 1]) +
        Math.abs(A[i + 2] - B[i + 2]);
      diff[k] = d;
      if (d > max) max = d;
    }
    if (max < 12) return { ...e, skip: "no-ink" };

    const solid = e.rgba.a > 0 && !e.gradient;
    const alpha = solid ? e.rgba.a * e.alpha : 1;
    const floor = max * 0.75; // core glyph pixels, not AA edges
    let worst = Infinity,
      at = null,
      px = 0;
    for (let k = 0; k < n; k++) {
      if (diff[k] < floor) continue;
      px++;
      const i = k * 4;
      const br = B[i],
        bgc = B[i + 1],
        bb = B[i + 2];
      const fr = solid ? e.rgba.r * alpha + br * (1 - alpha) : A[i];
      const fg = solid ? e.rgba.g * alpha + bgc * (1 - alpha) : A[i + 1];
      const fb = solid ? e.rgba.b * alpha + bb * (1 - alpha) : A[i + 2];
      const ratio = cr(L(fr, fg, fb), L(br, bgc, bb));
      if (ratio < worst) {
        worst = ratio;
        at = { ink: [fr, fg, fb].map(Math.round), bg: [br, bgc, bb] };
      }
    }
    if (!px) return { ...e, skip: "no-ink" };
    return { ...e, worst: Math.round(worst * 100) / 100, px, at };
  });
};

/* PLAYWRIGHT_CHROMIUM_PATH lets the audit reuse a browser that is already on
   the machine instead of a per-project download. */
const browser = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
    : {},
);
const ctx = await browser.newContext({
  viewport: { width: VW, height: VH },
  deviceScaleFactor: 1,
});
const page = await ctx.newPage();
const findings = [];
let total = 0;

for (const route of ROUTES) {
  await page.goto(BASE + route, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: PIN });
  await page.waitForTimeout(3500);
  const height = await page.evaluate(
    () => document.documentElement.scrollHeight,
  );
  const step = Math.floor(VH * 0.85);
  let runs = 0;

  for (let y = 0; y < height; y += step) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(1600); // let whileInView animations land
    const els = await page.evaluate(collect);
    if (!els.length) continue;

    const t1 = await page.addStyleTag({ content: NOART });
    await page.waitForTimeout(120);
    const inkShot = await page.screenshot();
    const t2 = await page.addStyleTag({ content: NOINK });
    await page.waitForTimeout(120);
    const bgShot = await page.screenshot();
    await page.evaluate(
      ([a, b]) => {
        a.remove();
        b.remove();
      },
      [t1, t2],
    );

    const res = await page.evaluate(measure, {
      inkB64: inkShot.toString("base64"),
      bgB64: bgShot.toString("base64"),
      els,
    });
    for (const e of res) {
      if (e.skip) continue;
      runs++;
      total++;
      const large = e.size >= 24 || (e.size >= 18.66 && e.weight >= 700);
      const need = large ? 4.5 : 7; // AAA: 4.5:1 large text, 7:1 otherwise
      if (e.worst < need) findings.push({ route, scroll: y, need, ...e });
    }
  }
  console.error(`  ${route.padEnd(12)} ${String(runs).padStart(4)} text runs`);
}
await browser.close();

if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify(findings, null, 2));
const rgb = (a) => (a ? `rgb(${a.join(",")})` : "?");
console.log(
  `\n${findings.length} failing of ${total} text runs measured at ${VW}px\n`,
);
const seen = new Map();
for (const f of findings.sort((a, b) => a.worst - b.worst)) {
  const k = `${f.route}|${f.path}|${Math.round(f.size)}`;
  if (seen.has(k)) {
    seen.get(k).n++;
    continue;
  }
  seen.set(k, { f, n: 1 });
}
for (const { f, n } of seen.values()) {
  console.log(
    `${String(f.worst).padStart(5)}/${f.need} ${f.route.padEnd(11)} ` +
      `${(f.size + "px/" + f.weight).padEnd(9)} ${rgb(f.at?.ink).padEnd(17)} on ${rgb(f.at?.bg).padEnd(17)} ` +
      `${n > 1 ? "×" + n + " " : ""}${f.path} "${f.text.slice(0, 30)}"`,
  );
}
process.exit(findings.length ? 1 : 0);
