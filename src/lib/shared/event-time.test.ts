import eventsData from "@/data/events.json";
import {
  clubInstant,
  eventSlug,
  eventWindow,
  formatEventDate,
  formatTimeRange,
  formatWhen,
  idFromSlug,
  parseClockTimes,
} from "./event-time.js";

describe("parseClockTimes", () => {
  it.each([
    ["6:00 PM - 7:00 PM", { startMin: 1080, endMin: 1140 }],
    ["10:00 AM - 4:30 PM", { startMin: 600, endMin: 990 }],
    ["12:00 PM - 1:00 PM", { startMin: 720, endMin: 780 }],
    ["1:15 PM", { startMin: 795, endMin: null }],
  ])("reads %s", (text, expected) => {
    expect(parseClockTimes(text)).toEqual(expected);
  });

  it.each([
    "",
    "TBA",
    "Until 4:30 PM",
    "9:00 AM Sat - 1:30 PM Sun",
    "10:00 AM - 4:30 PM (Mar 21); 10:00 AM - 1:00 PM (Mar 22)",
  ])("leaves %j to be shown as written", (text) => {
    expect(parseClockTimes(text)).toBeNull();
  });
});

describe("clubInstant", () => {
  // Ottawa is UTC-4 in summer time and UTC-5 in winter, whatever zone the
  // build machine or the visitor is in.
  it("uses summer time in October", () => {
    expect(clubInstant("2026-10-09", 18 * 60).toISOString()).toBe(
      "2026-10-09T22:00:00.000Z",
    );
  });

  it("uses standard time in February", () => {
    expect(clubInstant("2026-02-26", 18 * 60).toISOString()).toBe(
      "2026-02-26T23:00:00.000Z",
    );
  });

  it("gets the day the clocks change right", () => {
    // 2026-11-01: 2 AM EDT falls back to 1 AM EST.
    expect(clubInstant("2026-11-01", 12 * 60).toISOString()).toBe(
      "2026-11-01T17:00:00.000Z",
    );
  });
});

describe("eventWindow", () => {
  it("spans the announced time", () => {
    const window = eventWindow({
      date: "2026-10-09",
      time: "6:00 PM - 7:00 PM",
    });
    expect(window.allDay).toBe(false);
    expect(window.endKnown).toBe(true);
    expect(window.start.toISOString()).toBe("2026-10-09T22:00:00.000Z");
    expect(window.end.toISOString()).toBe("2026-10-09T23:00:00.000Z");
  });

  it("assumes an hour when only a start was announced", () => {
    const window = eventWindow({ date: "2020-09-08", time: "1:15 PM" });
    expect(window.endKnown).toBe(false);
    expect(window.end.getTime() - window.start.getTime()).toBe(60 * 60_000);
  });

  it("treats anything else as the whole day", () => {
    const window = eventWindow({ date: "2019-11-21", time: "Until 4:30 PM" });
    expect(window.allDay).toBe(true);
    expect(window.start.toISOString()).toBe("2019-11-21T05:00:00.000Z");
    expect(window.end.toISOString()).toBe("2019-11-22T05:00:00.000Z");
  });

  it("reads every event in the data", () => {
    for (const event of eventsData.events) {
      const window = eventWindow(event);
      expect(window.end.getTime()).toBeGreaterThan(window.start.getTime());
    }
  });
});

describe("formatting", () => {
  it("writes dates the way the posters do", () => {
    expect(formatEventDate("2026-10-09")).toBe("Fri, Oct 9");
    expect(formatEventDate("2026-10-09", { year: true })).toBe(
      "Fri, Oct 9, 2026",
    );
    expect(formatEventDate("2026-10-17", { long: true })).toBe(
      "Saturday, October 17",
    );
  });

  it.each([
    ["6:00 PM - 7:00 PM", "6:00–7:00 PM"],
    ["10:00 AM - 4:30 PM", "10:00 AM–4:30 PM"],
    ["1:15 PM", "1:15 PM"],
    ["Until 4:30 PM", "Until 4:30 PM"],
    ["", ""],
  ])("writes %j as %j", (text, expected) => {
    expect(formatTimeRange(text)).toBe(expected);
  });

  it("joins the two", () => {
    expect(formatWhen({ date: "2026-10-09", time: "6:00 PM - 7:00 PM" })).toBe(
      "Fri, Oct 9 · 6:00–7:00 PM",
    );
    expect(formatWhen({ date: "2020-01-17", time: "" })).toBe("Fri, Jan 17");
  });
});

describe("slugs", () => {
  it("keeps the id in front of a readable title", () => {
    expect(eventSlug({ id: "66", title: "Intro to Agentic AI" })).toBe(
      "66-intro-to-agentic-ai",
    );
    expect(eventSlug({ id: "17", title: "FED Meet & Greet" })).toBe(
      "17-fed-meet-and-greet",
    );
    expect(eventSlug({ id: "67", title: "Grok Bot Meetup – Ottawa" })).toBe(
      "67-grok-bot-meetup-ottawa",
    );
  });

  it("is unique, URL-safe and short for every event", () => {
    const slugs = eventsData.events.map(eventSlug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^\d+(-[a-z0-9]+)*$/);
      expect(slug.length).toBeLessThanOrEqual(60);
    }
  });

  it("finds the id again, so a link survives a retitled event", () => {
    expect(idFromSlug("66-intro-to-agentic-ai")).toBe("66");
    expect(idFromSlug("66-an-old-title")).toBe("66");
    expect(idFromSlug("66")).toBe("66");
    expect(idFromSlug("intro-to-agentic-ai")).toBeNull();
  });
});

describe("multi-day events", () => {
  const hackathon = {
    date: "2026-03-21",
    endDate: "2026-03-22",
    time: "10:00 AM - 4:30 PM (Mar 21); 10:00 AM - 1:00 PM (Mar 22)",
  };

  it("run whole days, first to last", () => {
    const window = eventWindow(hackathon);
    expect(window.multiDay).toBe(true);
    expect(window.start.toISOString()).toBe("2026-03-21T04:00:00.000Z");
    expect(window.end.toISOString()).toBe("2026-03-23T04:00:00.000Z");
  });

  it("read as a date range", () => {
    expect(formatWhen(hackathon)).toBe("Sat, Mar 21 – Sun, Mar 22");
    expect(
      formatWhen({ ...hackathon, endDate: "2027-01-03" }, { year: true }),
    ).toBe("Sat, Mar 21, 2026 – Sun, Jan 3, 2027");
  });
});
