import { existsSync } from "node:fs";
import { join } from "node:path";
import { type Meeting, eventDate, meetsOn, posterThumb } from "@/lib/events";
import breaks from "./breaks.json";
import events from "./events.json";
import meetings from "./meetings.json";
import oldTeams from "./old-teams.json";
import partners from "./partners.json";
import projects from "./projects.json";
import team from "./team.json";

/** Every string in a data file, paired with the name of the field it sits in. */
const fields = (value: unknown, key = ""): [string, string][] => {
  if (typeof value === "string") return [[key, value]];
  if (Array.isArray(value)) return value.flatMap((item) => fields(item, key));
  if (value && typeof value === "object")
    return Object.entries(value).flatMap(([k, v]) => fields(v, k));
  return [];
};

const all = fields({
  breaks,
  events,
  meetings,
  oldTeams,
  partners,
  projects,
  team,
});

describe("events", () => {
  // The id is the key in every event URL and calendar file (CONTRIBUTING):
  // a whole number nothing else uses, or the page cannot find its event.
  it("gives every event a unique whole-number id", () => {
    const ids = events.events.map((event) => event.id);
    for (const id of ids) expect(id).toMatch(/^\d+$/);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("dates every event as YYYY-MM-DD, ending no earlier than it starts", () => {
    for (const event of events.events) {
      expect(event.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      const endDate = "endDate" in event ? event.endDate : undefined;
      if (endDate !== undefined) {
        expect(endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(endDate >= event.date).toBe(true);
      }
    }
  });
});

describe("breaks", () => {
  // Reading weeks are marked on the events calendar, and weekly meetings skip
  // them, from their first day to their last (CONTRIBUTING).
  it("gives every break a unique id and a first and last day", () => {
    const ids = breaks.breaks.map((termBreak) => termBreak.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const termBreak of breaks.breaks) {
      expect(termBreak.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(termBreak.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(termBreak.endDate >= termBreak.date).toBe(true);
    }
  });
});

describe("meetings", () => {
  const list: readonly Meeting[] = meetings.meetings;

  it("gives every meeting a unique id and dates as YYYY-MM-DD", () => {
    const ids = list.map((meeting) => meeting.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const meeting of list) {
      expect(meeting.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      if (meeting.until !== undefined) {
        expect(meeting.until).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(meeting.until >= meeting.date).toBe(true);
      }
    }
  });

  // A weekly meeting that changes room, time or day is one entry per
  // arrangement, all with its title, each ending with `until` before the
  // next begins (CONTRIBUTING). Entries that overlap would list it twice.
  it("ends each weekly meeting's entry before its next one begins", () => {
    const weekly = list.filter((meeting) => meeting.weekly);
    const overlaps = weekly.flatMap((earlier) =>
      weekly
        .filter(
          (later) =>
            later !== earlier &&
            later.title === earlier.title &&
            later.date >= earlier.date &&
            !(earlier.until !== undefined && earlier.until < later.date),
        )
        .map((later) => `${earlier.id} runs into ${later.id}`),
    );
    expect(overlaps).toEqual([]);
  });

  // A one-off on a day the same meeting already meets would list it twice
  // there, perhaps in two rooms. A weekly meeting skips reading weeks, so a
  // one-off may stand in for it then.
  it("puts no one-off meeting on a day the same meeting already meets", () => {
    const clashes = list
      .filter((oneOff) => !oneOff.weekly)
      .flatMap((oneOff) =>
        list
          .filter(
            (other) =>
              other !== oneOff &&
              other.title === oneOff.title &&
              meetsOn(other, eventDate(oneOff), breaks.breaks),
          )
          .map((other) => `${oneOff.id} falls on a day of ${other.id}`),
      );
    expect(clashes).toEqual([]);
  });
});

describe("data files", () => {
  // The production CSP is img-src 'self' data:, and it is only sent on
  // carletonai.com: an off-site poster would show on every preview and then
  // be blocked on the live site.
  it("serves every image from this site", () => {
    const images = all.filter(([key]) => /^(image|poster|logo|src)$/.test(key));
    expect(images.length).toBeGreaterThan(0);
    for (const [key, value] of images) {
      expect(`${key}: ${value}`).toMatch(/^\w+: \/(?!\/)/);
    }
  });

  it("has a file for every partner logo", () => {
    for (const partner of partners.partners) {
      if (partner.logo) {
        expect(existsSync(join(__dirname, "../../public", partner.logo))).toBe(
          true,
        );
      }
    }
  });

  // Cards show posters at about 160px wide from a 600px copy kept beside the
  // full file (see CONTRIBUTING), and event pages show photos the same way;
  // a missing copy would 404 on every card.
  it("keeps a 600px copy of every poster and photo", () => {
    const posters = all.filter(([key]) => key === "poster");
    const photos = events.events.flatMap((event) =>
      (event.photos ?? []).map((photo) => photo.src),
    );
    expect(posters.length).toBeGreaterThan(0);
    expect(photos.length).toBeGreaterThan(0);
    for (const poster of [...posters.map(([, poster]) => poster), ...photos]) {
      expect(
        existsSync(join(__dirname, "../../public", posterThumb(poster))),
      ).toBe(true);
    }
  });

  it("links only to https pages or to this site", () => {
    const links = all.filter(([key]) =>
      /^(link|rsvpLink|page|recording|materials|linkedinURL|url|instagram|issue)$/.test(
        key,
      ),
    );
    expect(links.length).toBeGreaterThan(0);
    for (const [key, value] of links) {
      expect(`${key}: ${value}`).toMatch(/^\w+: (https:\/\/|\/(?!\/))/);
    }
  });
});
