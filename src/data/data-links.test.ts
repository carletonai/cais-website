import { existsSync } from "node:fs";
import { join } from "node:path";
import events from "./events.json";
import meetings from "./meetings.json";
import oldTeams from "./old-teams.json";
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

const all = fields({ events, meetings, oldTeams, projects, team });

describe("data files", () => {
  // The production CSP is img-src 'self' data:, and it is only sent on
  // carletonai.com: an off-site poster would show on every preview and then
  // be blocked on the live site.
  it("serves every image from this site", () => {
    const images = all.filter(([key]) => /^(image|poster)$/.test(key));
    expect(images.length).toBeGreaterThan(0);
    for (const [key, value] of images) {
      expect(`${key}: ${value}`).toMatch(/^\w+: \/(?!\/)/);
    }
  });

  // Cards show posters at about 160px wide from a 600px copy kept beside the
  // full file (see CONTRIBUTING); a missing copy would 404 on every card.
  it("keeps a 600px copy of every poster", () => {
    const posters = all.filter(([key]) => key === "poster");
    expect(posters.length).toBeGreaterThan(0);
    for (const [, poster] of posters) {
      const thumb = poster.replace(/\.jpe?g$/i, (ext) => `-600${ext}`);
      expect(existsSync(join(__dirname, "../../public", thumb))).toBe(true);
    }
  });

  it("links only to https pages or to this site", () => {
    const links = all.filter(([key]) =>
      /^(link|rsvpLink|page|recording|materials|linkedinURL)$/.test(key),
    );
    expect(links.length).toBeGreaterThan(0);
    for (const [key, value] of links) {
      expect(`${key}: ${value}`).toMatch(/^\w+: (https:\/\/|\/(?!\/))/);
    }
  });
});
