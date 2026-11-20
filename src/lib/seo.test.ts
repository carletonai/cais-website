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
  it("suffixes a page's title with the site name", () => {
    expect(titleFor(metaFor("/events"))).toBe(
      "Events: AI Workshops, Talks & Socials | Carleton AI Society",
    );
    expect(titleFor(metaFor("/events/66"))).toBe(
      "Intro to Agentic AI · 2026 | Carleton AI Society",
    );
  });

  it("uses a page's full title where seo.json gives one", () => {
    expect(titleFor(metaFor("/"))).toBe(
      "Carleton AI Society | AI Student Club at Carleton University",
    );
    expect(titleFor({ title: siteName, description: "" })).toBe(siteName);
  });
});

// Search results show about 60 characters of a title and 155-160 of a
// description; shorter descriptions leave room a result could have used.
test("every route has a title and a description that fit a search result", () => {
  expect(routePaths).toContain("/");
  for (const path of routePaths) {
    const meta = metaFor(path);
    expect(meta.title).not.toBe("");
    expect(`${path}: ${titleFor(meta).length}`).toBe(
      `${path}: ${Math.min(titleFor(meta).length, 60)}`,
    );
    expect(meta.description.length).toBeGreaterThan(110);
    expect(meta.description.length).toBeLessThanOrEqual(160);
  }
});
