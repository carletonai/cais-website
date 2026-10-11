import { parseCaption } from "./instagram-caption.js";
import {
  candidates,
  draftEvent,
  nextId,
  posterName,
  posterSource,
  summarize,
} from "./instagram-sync-core.js";

const now = new Date("2026-10-11T12:00:00Z");

const post = (
  id: string,
  caption: string,
  overrides: Record<string, unknown> = {},
) => ({
  id,
  caption,
  media_type: "IMAGE" as const,
  media_url: `https://cdn.example/${id}.jpg`,
  permalink: `https://www.instagram.com/p/${id}/`,
  timestamp: "2026-10-01T20:00:00+0000",
  ...overrides,
});

describe("candidates", () => {
  it("leaves out posts already decided, already on the site, or too old", () => {
    const fresh = post("A", "new");
    const decided = post("B", "seen before");
    const onSite = post("C", "already an event");
    const old = post("D", "ancient", { timestamp: "2026-06-01T20:00:00+0000" });
    const chosen = candidates([fresh, decided, onSite, old], {
      seen: [
        {
          id: "B",
          permalink: decided.permalink,
          decision: "skipped",
          at: "2026-10-02",
        },
      ],
      events: [{ instagram: "https://www.instagram.com/p/C" }],
      now,
    });
    expect(chosen.map((m) => m.id)).toEqual(["A"]);
  });
});

test("nextId is one past the highest id in use", () => {
  expect(nextId([{ id: "3" }, { id: "67" }, { id: "12" }])).toBe("68");
  expect(nextId([])).toBe("1");
});

describe("posterSource", () => {
  it("uses the photo, a video's thumbnail, or a carousel's first photo", () => {
    expect(posterSource(post("A", ""))).toBe("https://cdn.example/A.jpg");
    expect(
      posterSource(
        post("V", "", {
          media_type: "VIDEO",
          thumbnail_url: "https://cdn.example/V-thumb.jpg",
        }),
      ),
    ).toBe("https://cdn.example/V-thumb.jpg");
    expect(
      posterSource(
        post("C", "", {
          media_type: "CAROUSEL_ALBUM",
          children: {
            data: [
              {
                media_type: "VIDEO",
                media_url: "https://cdn.example/clip.mp4",
              },
              {
                media_type: "IMAGE",
                media_url: "https://cdn.example/slide2.jpg",
              },
            ],
          },
        }),
      ),
    ).toBe("https://cdn.example/slide2.jpg");
  });
});

test("posterName follows the existing poster files", () => {
  expect(posterName("Intro to Agentic AI", "2026-10-09")).toBe(
    "intro-to-agentic-ai-2026",
  );
  expect(posterName("Grok Bot Meetup – Ottawa", "2026-10-17")).toBe(
    "grok-bot-meetup-ottawa-2026",
  );
  expect(posterName("???", "2026-01-01")).toBe("event-2026");
});

describe("draftEvent", () => {
  it("fills an events.json entry from the caption, with the post linked", () => {
    const media = post(
      "A",
      "🚀 Intro to Agentic AI 🚀\nJoin us Friday, October 9 from 6:00-7:00 PM in Herzberg 5345. Free pizza!\nRegister: https://luma.com/abc123",
    );
    const parsed = parseCaption(media.caption, {
      postedAt: new Date(media.timestamp),
    });
    expect(draftEvent(media, parsed, "68")).toEqual({
      id: "68",
      title: "Intro to Agentic AI",
      date: "2026-10-09",
      time: "6:00 PM - 7:00 PM",
      location: "Herzberg 5345",
      description: expect.stringMatching(/^Intro to Agentic AI Join us/),
      type: "Workshop",
      rsvpLink: "https://luma.com/abc123",
      instagram: "https://www.instagram.com/p/A/",
      tags: expect.arrayContaining(["free-food", "technical"]),
    });
  });

  it("refuses a post with no date", () => {
    const media = post("B", "Applications are open!");
    const parsed = parseCaption(media.caption, {
      postedAt: new Date(media.timestamp),
    });
    expect(() => draftEvent(media, parsed, "69")).toThrow(/no date/);
  });
});

test("summarize writes the pull request body", () => {
  const media = post("A", "Workshop Friday, October 9 at 6pm in Herzberg 5345");
  const parsed = parseCaption(media.caption, {
    postedAt: new Date(media.timestamp),
  });
  const text = summarize([
    {
      media,
      parsed,
      decision: "event",
      event: { id: "68", title: "Workshop", date: "2026-10-09" },
    },
    {
      media: post("B", "thanks all"),
      parsed,
      decision: "skipped",
      reason: "a recap, not an announcement",
    },
  ]);
  expect(text).toContain("1 new event drafted");
  expect(text).toContain(
    "| Workshop (#68) | 2026-10-09 | 6:00 PM | Herzberg 5345 | high |",
  );
  expect(text).toContain("1 post skipped");
  expect(text).toContain("a recap, not an announcement");
  expect(summarize([])).toContain("No new event announcements found.");
});
