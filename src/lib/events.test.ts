import {
  academicYear,
  allEvents,
  clubNumbers,
  eventStatus,
  eventsWithResources,
  findEventBySlug,
  isLive,
  isUpcoming,
  nextEvent,
  posterThumb,
  postLink,
  resourceLinks,
  rsvpFor,
  seasonNow,
  type ClubEvent,
} from "./events";

const event = (overrides: Partial<ClubEvent> = {}): ClubEvent => ({
  id: "66",
  title: "Intro to Agentic AI",
  date: "2026-10-09",
  time: "6:00 PM - 7:00 PM",
  location: "CS Seminar Room, Herzberg",
  description: "",
  type: "Workshop",
  tags: [],
  ...overrides,
});

// Ottawa is UTC-4 in October.
const at = (iso: string) => new Date(iso);

describe("eventStatus", () => {
  it.each([
    ["2026-09-22T16:00:00Z", "later", "Fri, Oct 9"],
    ["2026-10-01T16:00:00Z", "soon", "In 8 days"],
    ["2026-10-08T16:00:00Z", "tomorrow", "Tomorrow · 6:00 PM"],
    ["2026-10-09T13:00:00Z", "today", "Today · 6:00 PM"],
    ["2026-10-09T21:35:00Z", "today", "Starts in 25 min"],
    ["2026-10-09T22:30:00Z", "live", "Happening now · until 7:00 PM"],
    ["2026-10-09T23:00:00Z", "past", "Past event"],
  ])("at %s it is %s: %s", (now, phase, label) => {
    const status = eventStatus(event(), at(now));
    expect(status.phase).toBe(phase);
    expect(status.label).toBe(label);
  });

  it("counts down to the start", () => {
    expect(eventStatus(event(), at("2026-10-09T21:00:00Z")).startsIn).toBe(
      60 * 60_000,
    );
  });

  it("uses Ottawa's date, not the visitor's, for today and tomorrow", () => {
    // 11:30 PM in Ottawa on Oct 8 is already Oct 9 in UTC.
    expect(eventStatus(event(), at("2026-10-09T03:30:00Z")).phase).toBe(
      "tomorrow",
    );
  });

  it("says all-day events are on today", () => {
    const allDay = event({ time: "" });
    expect(eventStatus(allDay, at("2026-10-09T13:00:00Z")).label).toBe(
      "Happening today",
    );
  });
});

describe("upcoming and next", () => {
  it("keeps an event upcoming until it has ended", () => {
    expect(isUpcoming(event(), at("2026-10-09T22:59:00Z"))).toBe(true);
    expect(isUpcoming(event(), at("2026-10-09T23:01:00Z"))).toBe(false);
  });

  it("picks the soonest event that is not over, whatever the data's order", () => {
    const later = event({ id: "2", title: "Later", date: "2026-10-16" });
    const sooner = event({ id: "1", title: "Sooner" });
    const list = [later, sooner];
    expect(nextEvent(list, at("2026-10-08T16:00:00Z"))?.title).toBe("Sooner");
    expect(nextEvent(list, at("2026-10-10T16:00:00Z"))?.title).toBe("Later");
    expect(nextEvent(list, at("2026-10-17T16:00:00Z"))).toBeUndefined();
  });

  it("is live from the first minute to the last", () => {
    expect(isLive(event(), at("2026-10-09T21:59:59Z"))).toBe(false);
    expect(isLive(event(), at("2026-10-09T22:00:00Z"))).toBe(true);
    expect(isLive(event(), at("2026-10-09T23:00:00Z"))).toBe(false);
  });
});

describe("seasons", () => {
  it("turn over on September 1st, Ottawa time", () => {
    // 10 PM on Aug 31 in Ottawa is already Sep 1 in UTC.
    expect(seasonNow(at("2026-09-01T02:00:00Z"))).toBe("2025–26");
    expect(seasonNow(at("2026-09-01T04:00:00Z"))).toBe("2026–27");
  });

  it("call the founding spring by its year alone", () => {
    expect(academicYear({ date: "2019-03-06" })).toBe("2019");
    expect(academicYear({ date: "2019-09-10" })).toBe("2019–20");
    expect(academicYear({ date: "2026-03-21" })).toBe("2025–26");
  });
});

describe("rsvpFor", () => {
  const before = at("2026-10-08T16:00:00Z");

  it("names Luma, and drops placeholders and past events", () => {
    const luma = event({ rsvpLink: "https://lu.ma/cais-agentic" });
    expect(rsvpFor(luma, before)).toEqual({
      href: "https://lu.ma/cais-agentic",
      label: "Register on Luma",
    });
    expect(rsvpFor(event({ rsvpLink: "https://forms.gle/x" }), before)).toEqual(
      { href: "https://forms.gle/x", label: "RSVP" },
    );
    expect(rsvpFor(event({ rsvpLink: "#" }), before)).toBeNull();
    expect(rsvpFor(event(), before)).toBeNull();
    expect(rsvpFor(luma, at("2026-10-10T16:00:00Z"))).toBeNull();
  });
});

test("posterThumb names the 600px copy kept beside a poster", () => {
  expect(posterThumb("/assets/events/intro-to-agentic-ai-2026.jpg")).toBe(
    "/assets/events/intro-to-agentic-ai-2026-600.jpg",
  );
  expect(posterThumb("/assets/events/old.jpeg")).toBe(
    "/assets/events/old-600.jpeg",
  );
});

describe("findEventBySlug", () => {
  it("finds an event by the id at the front of its slug", () => {
    expect(findEventBySlug("63-machine-learning-workshop")?.title).toBe(
      "Machine Learning Workshop at Hack the Hill III",
    );
    expect(findEventBySlug("999-nothing")).toBeUndefined();
    expect(findEventBySlug("no-id")).toBeUndefined();
  });
});

describe("resourceLinks", () => {
  it("names links by where they go", () => {
    const hth = findEventBySlug("63")!;
    expect(resourceLinks(hth)).toEqual([
      {
        kind: "materials",
        href: "https://github.com/carletonai/cais-workshop-hth-iii",
        label: "Code on GitHub",
      },
      { kind: "page", href: "https://hackthehill.com", label: "Event page" },
    ]);
  });

  it("keeps the Instagram post for the event's own page", () => {
    const chatbot = findEventBySlug("11")!;
    expect(resourceLinks(chatbot).map((link) => link.kind)).toEqual([
      "materials",
    ]);
    expect(postLink(chatbot)).toEqual({
      kind: "post",
      href: "https://www.instagram.com/p/DU39kwqDryE/",
      label: "Instagram post",
    });
    expect(postLink(findEventBySlug("67")!)).toBeNull();
  });

  it("lists past events with code or a recording, newest first", () => {
    const list = eventsWithResources(allEvents, at("2026-10-08T16:00:00Z"));
    expect(list[0].title).toBe(
      "Machine Learning Workshop at Hack the Hill III",
    );
    expect(list.every((e) => e.materials || e.recording)).toBe(true);
  });
});

test("clubNumbers counts only what the data holds", () => {
  const numbers = clubNumbers();
  expect(numbers.events).toBe(allEvents.length);
  expect(numbers.since).toBe(2019);
  expect(numbers.workshops).toBe(
    allEvents.filter((e) => e.type === "Workshop").length,
  );
});

test("labels slide decks as slides, not code", () => {
  const coffee = allEvents.find((e) => e.id === "39")!;
  expect(resourceLinks(coffee)[0].label).toBe("Slides (PDF)");
});

test("says a multi-day event is on until its last day", () => {
  const hackathon = allEvents.find((e) => e.id === "62")!;
  expect(eventStatus(hackathon, at("2026-03-22T14:00:00Z")).label).toBe(
    "On now · until Sun, Mar 22",
  );
});
