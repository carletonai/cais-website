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

/** The ids of every event the curriculum refers to, for the tests. */
export const curriculumEventIds = () => [
  ...data.series.flatMap((series) =>
    series.modules.flatMap((entry) => (entry.event ? [entry.event] : [])),
  ),
  ...data.standalone.events,
];
