import {
  allEvents,
  clubNumbers,
  eventStatus,
  eventsWithResources,
  findEventBySlug,
  isUpcoming,
  nextEvent,
  resourceLinks,
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
  image: "",
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

  it("picks the soonest event that is not over", () => {
    expect(nextEvent(allEvents, at("2026-10-08T16:00:00Z"))?.title).toBe(
      "Intro to Agentic AI",
    );
    expect(nextEvent(allEvents, at("2026-10-10T16:00:00Z"))?.title).toBe(
      "Grok Bot Meetup – Ottawa",
    );
  });
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
