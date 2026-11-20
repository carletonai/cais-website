import curriculum from "@/data/curriculum.json";
import { type ClubEvent, allEvents, eventWindow } from "@/lib/events";

/**
 * One session of a series in src/data/curriculum.json: an event that has
 * run (or is scheduled), or a session still to be announced, which has a
 * title and no event yet. `blurb` replaces the event's own description on
 * the curriculum page when the description reads as an announcement.
 */
export interface CurriculumEntry {
  event?: string;
  title?: string;
  blurb?: string;
}

export interface CurriculumSeries {
  id: string;
  title: string;
  /** "Fall 2026", "2021–22". */
  season: string;
  lede: string;
  modules: CurriculumEntry[];
}

/** A session as the page shows it: its event, if it has one, and its copy. */
export interface Module {
  /** Its place in the series, from 1. */
  number: number;
  title: string;
  blurb: string;
  event?: ClubEvent;
}

export interface Series {
  id: string;
  title: string;
  season: string;
  lede: string;
  modules: Module[];
}

const data: {
  series: CurriculumSeries[];
  standalone: { title: string; lede: string; events: string[] };
} = curriculum;

const eventById = new Map(allEvents.map((event) => [event.id, event]));

/** The event an entry names. Throws on an unknown id: the tests catch it. */
const eventFor = (entry: CurriculumEntry) => {
  if (entry.event === undefined) return undefined;
  const event = eventById.get(entry.event);
  if (!event)
    throw new Error(`curriculum.json: no event with id ${entry.event}`);
  return event;
};

const resolve = (series: CurriculumSeries): Series => ({
  id: series.id,
  title: series.title,
  season: series.season,
  lede: series.lede,
  modules: series.modules.map((entry, i) => {
    const event = eventFor(entry);
    const title = entry.title ?? event?.title;
    if (!title)
      throw new Error(`curriculum.json: ${series.id} #${i + 1} has no title`);
    return {
      number: i + 1,
      title,
      blurb: entry.blurb ?? event?.description ?? "",
      event,
    };
  }),
});

/** Every series, newest first, as the data file lists them. */
export const allSeries: readonly Series[] = data.series.map(resolve);

/** The series the club is running (or about to run) now: the first listed. */
export const currentSeries = allSeries[0];

/** Workshops run outside any series, newest first. */
export const standaloneWorkshops = {
  title: data.standalone.title,
  lede: data.standalone.lede,
  events: data.standalone.events
    .map((id) => {
      const event = eventById.get(id);
      if (!event) throw new Error(`curriculum.json: no event with id ${id}`);
      return event;
    })
    .sort((a, b) => b.date.localeCompare(a.date)),
};

export type ModuleState = "done" | "scheduled" | "planned";

/** Whether a session has run, is on the calendar, or is still to be dated. */
export const moduleState = (module: Module, now: Date): ModuleState => {
  if (!module.event) return "planned";
  return eventWindow(module.event).end.getTime() <= now.getTime()
    ? "done"
    : "scheduled";
};

/**
 * The series an event is a session of, with its place in it, or undefined
 * for an event outside every series. `anchor` is where /workshops shows it:
 * the current series' heading, or an earlier series' own <details>.
 */
export const seriesOf = (eventId: string) => {
  for (const series of allSeries) {
    const module = series.modules.find((m) => m.event?.id === eventId);
    if (module) {
      const anchor =
        series === currentSeries ? "current-series-heading" : series.id;
      return { series, module, href: `/workshops#${anchor}` };
    }
  }
  return undefined;
};

/**
 * Past events to suggest under a past event's page. The other sessions of
 * its series come first, nearest in the series first; then events of the
 * same type, those sharing more tags first and then those nearest in date.
 * Picking by closeness, not recency, gives each page its own suggestions:
 * the three newest workshops used to be linked from every old one.
 */
export const relatedEvents = (
  event: ClubEvent,
  past: readonly ClubEvent[],
  count = 3,
): ClubEvent[] => {
  const candidates = past.filter((e) => e.id !== event.id);
  const picked: ClubEvent[] = [];
  const place = seriesOf(event.id);
  if (place) {
    const siblings = place.series.modules
      .filter((m) => m.event && m.event.id !== event.id)
      .sort(
        (a, b) =>
          Math.abs(a.number - place.module.number) -
          Math.abs(b.number - place.module.number),
      )
      .map((m) => candidates.find((e) => e.id === m.event?.id))
      .filter((e): e is ClubEvent => e !== undefined);
    picked.push(...siblings.slice(0, count));
  }
  const shared = (e: ClubEvent) =>
    e.tags.filter((tag) => event.tags.includes(tag)).length;
  const distance = (e: ClubEvent) =>
    Math.abs(Date.parse(e.date) - Date.parse(event.date));
  const rest = candidates
    .filter((e) => e.type === event.type && !picked.includes(e))
    .sort((a, b) => shared(b) - shared(a) || distance(a) - distance(b));
  return [...picked, ...rest].slice(0, count);
};

/** The ids of every event the curriculum refers to, for the tests. */
export const curriculumEventIds = () => [
  ...data.series.flatMap((series) =>
    series.modules.flatMap((entry) => (entry.event ? [entry.event] : [])),
  ),
  ...data.standalone.events,
];
