import eventsData from "@/data/events.json";
import { feedEvents, googleCalendarUrl, icsPath, vcalendar } from "./ics.js";

const agentic = eventsData.events.find((event) => event.id === "66")!;
const now = new Date("2026-10-08T12:00:00Z");

const unfold = (ics: string) => ics.replace(/\r\n /g, "");

describe("vcalendar", () => {
  it("writes a timed event in UTC with a reminder", () => {
    const ics = vcalendar([agentic], { now });
    const text = unfold(ics);

    expect(text).toContain("DTSTART:20261009T220000Z");
    expect(text).toContain("DTEND:20261009T230000Z");
    expect(text).toContain("SUMMARY:Intro to Agentic AI");
    expect(text).toContain("LOCATION:CS Seminar Room\\, Herzberg");
    expect(text).toContain("UID:event-66@carletonai.com");
    expect(text).toContain(
      "URL:https://carletonai.com/events/66-intro-to-agentic-ai",
    );
    expect(text).toContain("TRANSP:OPAQUE");
    expect(text).toContain("TRIGGER:-PT1H");
    expect(text).not.toContain("X-WR-CALNAME");
  });

  it("follows the format's line rules", () => {
    const ics = vcalendar(eventsData.events, { now, feed: true });
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    // Every line, continuation lines included, fits in 75 octets.
    for (const line of ics.split("\r\n")) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
    expect(ics.match(/BEGIN:VEVENT/g)?.length).toBe(eventsData.events.length);
    expect(ics.match(/END:VEVENT/g)?.length).toBe(eventsData.events.length);
  });

  it("never marks subscribers busy", () => {
    const text = unfold(vcalendar([agentic], { now, feed: true }));
    expect(text).toContain("X-WR-CALNAME:CAIS Events");
    expect(text).toContain("TRANSP:TRANSPARENT");
    expect(text).not.toContain("VALARM");
  });

  it("writes days without a clock time as all-day events", () => {
    const pitchNight = eventsData.events.find((event) => event.id === "61")!;
    const text = unfold(vcalendar([pitchNight], { now }));
    expect(text).toContain("DTSTART;VALUE=DATE:20260319");
    expect(text).toContain("DTEND;VALUE=DATE:20260320");
  });

  it("links an event's materials in its description", () => {
    const hth = eventsData.events.find((event) => event.id === "63")!;
    expect(unfold(vcalendar([hth], { now }))).toContain(
      "Workshop materials: https://github.com/carletonai/cais-workshop-hth-iii",
    );
  });
});

describe("feedEvents", () => {
  it("holds everything upcoming and the last year", () => {
    const feed = feedEvents(eventsData.events, now);
    const ids = feed.map((event) => event.id);
    expect(ids).toContain("66");
    expect(ids).toContain("67");
    expect(ids).toContain("62"); // March 2026
    expect(ids).not.toContain("19"); // 2019
  });
});

describe("links", () => {
  it("puts single-event files next to the event page", () => {
    expect(icsPath(agentic)).toBe("/events/66-intro-to-agentic-ai.ics");
  });

  it("prefills Google Calendar", () => {
    const url = new URL(googleCalendarUrl(agentic));
    expect(url.hostname).toBe("calendar.google.com");
    expect(url.searchParams.get("text")).toBe("Intro to Agentic AI");
    expect(url.searchParams.get("dates")).toBe(
      "20261009T220000Z/20261009T230000Z",
    );
    expect(url.searchParams.get("ctz")).toBe("America/Toronto");
  });
});
