import { metaFor, routePaths, siteName, titleFor } from "./seo";

describe("metaFor", () => {
  it("ignores the trailing slash a static host adds", () => {
    expect(metaFor("/contact/")).toBe(metaFor("/contact"));
    expect(metaFor("/contact").title).toBe("Contact");
  });

  it("describes an event page from its data, by the id in the slug", () => {
    expect(metaFor("/events/66-intro-to-agentic-ai").title).toBe(
      "Intro to Agentic AI · 2026",
    );
    expect(metaFor("/events/66").ogTitle).toBe(
      "Intro to Agentic AI · Fri, Oct 9, 2026",
    );
    expect(metaFor("/events/66-an-old-title")).toEqual(metaFor("/events/66"));
  });

  it("falls back to the home entry for anything unknown", () => {
    expect(metaFor("/nope")).toBe(metaFor("/"));
    expect(metaFor("/events/999-nothing")).toBe(metaFor("/"));
  });
});

describe("titleFor", () => {
  it("gives the home page the bare site name and every other page a suffix", () => {
    expect(titleFor(metaFor("/"))).toBe(siteName);
    expect(titleFor(metaFor("/events"))).toBe("Events | Carleton AI Society");
    expect(titleFor(metaFor("/events/66"))).toBe(
      "Intro to Agentic AI · 2026 | Carleton AI Society",
    );
  });
});

test("every route has a title and a description that fits a search result", () => {
  expect(routePaths).toContain("/");
  for (const path of routePaths) {
    const meta = metaFor(path);
    expect(meta.title).not.toBe("");
    expect(meta.description.length).toBeGreaterThan(50);
    expect(meta.description.length).toBeLessThanOrEqual(160);
  }
});
