import { eventPageMeta } from "./event-meta.js";

const event = {
  id: "66",
  title: "Intro to Agentic AI",
  date: "2026-10-09",
  time: "6:00 PM - 7:00 PM",
  location: "CS Seminar Room, Herzberg",
  description:
    "Learn how AI agents plan, use tools, and get work done. ".repeat(6),
  type: "Workshop",
  tags: [],
  poster: "/assets/events/intro-to-agentic-ai-2026.jpg",
};

describe("eventPageMeta", () => {
  it("titles the tab with the event and the preview with its date", () => {
    const meta = eventPageMeta(event);
    expect(meta.title).toBe("Intro to Agentic AI");
    expect(meta.ogTitle).toBe("Intro to Agentic AI · Fri, Oct 9, 2026");
    expect(meta.image).toBe("/assets/events/intro-to-agentic-ai-2026.jpg");
  });

  it("leads the description with when and where, within a search snippet", () => {
    const { description } = eventPageMeta(event);
    expect(description).toMatch(
      /^Fri, Oct 9, 2026 · 6:00–7:00 PM · CS Seminar Room, Herzberg\. Learn/,
    );
    expect(description.length).toBeLessThanOrEqual(160);
    expect(description).toMatch(/\S…$/);
  });
});
