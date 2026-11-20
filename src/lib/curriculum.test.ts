import curriculumData from "@/data/curriculum.json";
import {
  type CurriculumSeries,
  allSeries,
  currentSeries,
  curriculumEventIds,
  moduleState,
  relatedEvents,
  seriesOf,
  standaloneWorkshops,
} from "./curriculum";
import { allEvents, pastEvents } from "./events";

const curriculum: { series: CurriculumSeries[] } = curriculumData;
const ids = new Set(allEvents.map((event) => event.id));

describe("curriculum.json", () => {
  it("refers only to events that exist, each once", () => {
    const used = curriculumEventIds();
    expect(used.length).toBeGreaterThan(0);
    for (const id of used) expect(ids.has(id)).toBe(true);
    expect(new Set(used).size).toBe(used.length);
  });

  it("gives every session a title and lists each series in the order it ran", () => {
    for (const series of curriculum.series) {
      expect(series.modules.length).toBeGreaterThan(0);
      let last = "";
      for (const entry of series.modules) {
        const event = allEvents.find((e) => e.id === entry.event);
        expect(entry.title ?? event?.title).toBeTruthy();
        if (event) {
          expect(event.date >= last).toBe(true);
          last = event.date;
        }
      }
    }
  });

  it("puts sessions still to be announced after the ones with a date", () => {
    for (const series of curriculum.series) {
      const firstPlanned = series.modules.findIndex((m) => !m.event);
      if (firstPlanned === -1) continue;
      for (const entry of series.modules.slice(firstPlanned)) {
        expect(entry.event).toBeUndefined();
      }
    }
  });

  it("lists only workshops", () => {
    for (const id of curriculumEventIds()) {
      const event = allEvents.find((e) => e.id === id);
      expect(`${id}: ${event?.type}`).toBe(`${id}: Workshop`);
    }
  });
});

describe("allSeries", () => {
  it("numbers the sessions from 1 and takes copy from the event", () => {
    const series = allSeries.find((s) => s.id === "ai-workshops-winter-2026");
    expect(series).toBeDefined();
    expect(series!.modules.map((m) => m.number)).toEqual([1, 2, 3, 4, 5]);
    const chatbot = series!.modules[3];
    expect(chatbot.title).toBe("Building an AI Chatbot!");
    expect(chatbot.blurb).toBe(chatbot.event!.description);
  });

  it("lets a series override the event's description with a blurb", () => {
    const intro = currentSeries.modules[0];
    expect(intro.event?.id).toBe("64");
    expect(intro.blurb).not.toBe(intro.event!.description);
  });

  it("leads with the current series, which still has sessions to come", () => {
    expect(currentSeries).toBe(allSeries[0]);
    expect(currentSeries.modules.some((m) => !m.event)).toBe(true);
  });
});

describe("moduleState", () => {
  const [intro, agentic] = currentSeries.modules;
  // The series' first session still to be announced, whichever it is.
  const unannounced = currentSeries.modules.find((m) => !m.event)!;

  it("tells a session that ran from one on the calendar and one unscheduled", () => {
    const now = new Date("2026-10-05T12:00:00-04:00");
    expect(moduleState(intro, now)).toBe("done");
    expect(moduleState(agentic, now)).toBe("scheduled");
    expect(moduleState(unannounced, now)).toBe("planned");
  });

  it("counts a session as done only once it is over", () => {
    const during = new Date("2026-10-09T18:30:00-04:00");
    expect(moduleState(agentic, during)).toBe("scheduled");
    const after = new Date("2026-10-09T19:00:00-04:00");
    expect(moduleState(agentic, after)).toBe("done");
  });
});

describe("standaloneWorkshops", () => {
  it("runs newest first", () => {
    const dates = standaloneWorkshops.events.map((event) => event.date);
    expect(dates).toEqual([...dates].sort().reverse());
  });
});

describe("seriesOf", () => {
  it("finds an event's series and place, and where /workshops shows it", () => {
    const place = seriesOf("45");
    expect(place?.series.id).toBe("machine-learning-2021-22");
    expect(place?.module.number).toBe(3);
    expect(place?.href).toBe("/workshops#machine-learning-2021-22");
  });

  it("points a session of the current series at its heading", () => {
    expect(seriesOf("66")?.href).toBe("/workshops#current-series-heading");
  });

  it("is undefined for an event outside every series", () => {
    expect(seriesOf("19")).toBeUndefined();
  });
});

describe("relatedEvents", () => {
  const byId = (id: string) => allEvents.find((event) => event.id === id)!;
  const past = pastEvents(allEvents, new Date("2027-01-01T00:00:00Z"));
  const ids = (id: string) => relatedEvents(byId(id), past).map((e) => e.id);

  it("suggests the nearest sessions of the same series first", () => {
    // Session 3 of the 2021-22 series: sessions 2 and 4, then 1 and 5 tie.
    expect(ids("45").slice(0, 2)).toEqual(["43", "47"]);
    expect(ids("45")).toHaveLength(3);
  });

  it("fills up with events of the same type, nearest in date", () => {
    // The 2019 inauguration: the next socials are the nearest ones.
    const related = relatedEvents(byId("19"), past);
    expect(related).toHaveLength(3);
    expect(related.every((e) => e.type === "Social")).toBe(true);
    expect(related.map((e) => e.id)).toContain("24");
  });

  it("gives old pages their own suggestions, not the newest three", () => {
    expect(ids("43")).not.toEqual(ids("29"));
    expect(ids("43")).not.toContain("68");
  });

  it("never suggests the event itself", () => {
    for (const event of past) {
      expect(relatedEvents(event, past).map((e) => e.id)).not.toContain(
        event.id,
      );
    }
  });
});
