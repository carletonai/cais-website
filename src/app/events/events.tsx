import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CalendarIcon,
  MapPinIcon,
  ArrowRightIcon,
  ChevronDownIcon,
} from "lucide-react";
import { EventPoster } from "@/components/EventPoster";
import { EventsCalendar } from "@/components/EventsCalendar";
import {
  type CalendarEntry,
  CalendarEntryDialog,
} from "@/components/CalendarEntryDialog";
import eventsData from "@/data/events.json";
import meetingsData from "@/data/meetings.json";
import {
  type ClubEvent,
  academicYear,
  eventDate,
  pastEvents,
  upcomingEvents,
} from "@/lib/events";

const events = eventsData.events;

/** An event whose type is not decided yet; it shows under "All" only. */
const UNDECIDED_TYPE = "TBA";

/** Most-used first, so the common filters lead and none is ever empty. */
const byUse = (values: string[]) => {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.keys()].sort(
    (a, b) => counts.get(b)! - counts.get(a)! || a.localeCompare(b),
  );
};

const eventTypes = [
  "All",
  ...byUse(
    events.map((event) => event.type).filter((type) => type !== UNDECIDED_TYPE),
  ),
];
const eventTags = byUse(events.flatMap((event) => event.tags));

/** Past events shown as full cards; older ones go to the archive below them. */
const RECENT_PAST = 6;

const archiveDate = new Intl.DateTimeFormat("en-CA", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

/** Newest academic year first, keeping each year's events newest first. */
const byAcademicYear = (events: readonly ClubEvent[]) => {
  const years = new Map<string, ClubEvent[]>();
  for (const event of events) {
    const year = academicYear(event);
    years.set(year, [...(years.get(year) ?? []), event]);
  }
  return [...years];
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15,
    },
  },
};

const filterContainer = {
  hidden: { opacity: 0, y: -20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15,
      staggerChildren: 0.1,
    },
  },
};

const filterItem = {
  hidden: { opacity: 0, scale: 0.8 },
  show: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15,
    },
  },
};

const EventsPage = () => {
  const [selectedType, setSelectedType] = useState("All");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const filtering = selectedType !== "All" || selectedTag !== null;

  const filteredEvents = events.filter(
    (event) =>
      (selectedType === "All" || event.type === selectedType) &&
      (selectedTag === null || event.tags.includes(selectedTag)),
  );

  const upcoming = upcomingEvents(filteredEvents);
  const past = pastEvents(filteredEvents);
  const recentPast = past.slice(0, RECENT_PAST);
  const archive = byAcademicYear(past.slice(RECENT_PAST));

  const [selected, setSelected] = useState<CalendarEntry | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const showDetails = (event: ClubEvent) => {
    setSelected({ kind: "event", event });
    setDetailsOpen(true);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-glow opacity-30" />
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/20 to-background" />

      {/* Hero section */}
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--color-primary)_0%,_transparent_65%)] opacity-20" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="container mx-auto text-center relative z-10 px-4"
        >
          <motion.h1
            className="text-7xl sm:text-8xl font-bold mb-6 text-glow bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/90 to-primary/75"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            Events
          </motion.h1>
          <motion.p
            className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Join us for immersive workshops, hackathon sessions, and socials
            exploring the future of artificial intelligence.
          </motion.p>
        </motion.div>
      </section>

      {/* Filter section */}
      <section className="relative z-10 py-8">
        <div className="container mx-auto px-4">
          <motion.div
            variants={filterContainer}
            initial="hidden"
            animate="show"
            role="group"
            aria-label="Filter by type"
            className="flex flex-wrap gap-3 justify-center mb-6"
          >
            {eventTypes.map((type) => (
              <motion.div key={type} variants={filterItem}>
                <Button
                  variant={selectedType === type ? "default" : "outline"}
                  aria-pressed={selectedType === type}
                  onClick={() => setSelectedType(type)}
                  className={cn(
                    "px-6 py-2 rounded-full transition-all duration-300 hover:scale-105",
                    selectedType === type &&
                      "scale-105 shadow-lg shadow-brand/20",
                  )}
                >
                  {type}
                </Button>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            role="group"
            aria-label="Filter by tag"
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-auto sm:max-w-4xl sm:flex-wrap sm:justify-center sm:overflow-visible"
          >
            {[null, ...eventTags].map((tag) => {
              const selected = selectedTag === tag;

              return (
                <Button
                  key={tag ?? "all-tags"}
                  size="sm"
                  variant={selected ? "default" : "outline"}
                  aria-pressed={selected}
                  onClick={() => setSelectedTag(tag)}
                  className="shrink-0 rounded-full px-4"
                >
                  {tag ?? "All tags"}
                </Button>
              );
            })}
          </motion.div>

          {/* Present from the start, so changes to it are announced. */}
          <p role="status" className="sr-only">
            {filtering
              ? `${upcoming.length} upcoming and ${past.length} past ${past.length === 1 ? "event" : "events"} match these filters.`
              : "Showing all events."}
          </p>
        </div>
      </section>

      {/* Events section */}
      <section className="relative z-10 py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-glow">Upcoming Events</h2>

          {upcoming.length === 0 ? (
            <p className="text-muted-foreground mb-16">
              {filtering
                ? "No upcoming events match these filters."
                : "No upcoming events are currently scheduled. Check back soon for updates."}
            </p>
          ) : (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20"
            >
              <AnimatePresence>
                {upcoming.map((event) => (
                  <motion.div
                    key={event.id}
                    variants={item}
                    exit={{ opacity: 0, y: 20 }}
                    whileHover={{
                      scale: 1.02,
                      transition: {
                        type: "spring" as const,
                        stiffness: 400,
                        damping: 10,
                      },
                    }}
                    className="group relative bg-card rounded-xl overflow-hidden border border-border/50 hover:border-primary/50 transition-colors"
                  >
                    <EventPoster
                      image={event.image}
                      poster={event.poster}
                      title={event.title}
                      zoomOnHover
                    />

                    <div className="p-6">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <span className="inline-flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4" />
                          {event.date}
                        </span>
                        {event.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPinIcon className="w-4 h-4" />
                            {event.location}
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                        {event.title}
                      </h3>

                      <p className="text-muted-foreground mb-4 line-clamp-none md:line-clamp-4">
                        {event.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex gap-2 flex-wrap">
                          {event.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 text-xs rounded-full bg-brand/10 text-primary"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <div className="flex shrink-0 items-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => showDetails(event)}
                            aria-label={`Details: ${event.title}`}
                          >
                            Details
                          </Button>
                          {event.rsvpLink && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="group/btn"
                              asChild
                            >
                              <a
                                href={event.rsvpLink}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                RSVP
                                <ArrowRightIcon className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          <h2 className="text-3xl font-bold mb-8 text-glow">Past Events</h2>

          {past.length === 0 && (
            <p className="text-muted-foreground">
              {filtering
                ? "No past events match these filters."
                : "No past events yet."}
            </p>
          )}

          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            <AnimatePresence>
              {recentPast.map((event) => (
                <motion.div
                  key={event.id}
                  variants={item}
                  exit={{ opacity: 0, y: 20 }}
                  className="group relative bg-card/70 rounded-xl overflow-hidden border border-border/50 opacity-80"
                >
                  <EventPoster
                    image={event.image}
                    poster={event.poster}
                    title={event.title}
                  />

                  <div className="p-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <span className="inline-flex items-center gap-1">
                        <CalendarIcon className="w-4 h-4" />
                        {event.date}
                      </span>
                      {event.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPinIcon className="w-4 h-4" />
                          {event.location}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-semibold mb-2">
                      {event.title}
                    </h3>

                    <p className="text-muted-foreground mb-4 line-clamp-none md:line-clamp-4">
                      {event.description}
                    </p>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex gap-2 flex-wrap">
                        {event.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 text-xs rounded-full bg-brand/10 text-primary"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => showDetails(event)}
                        aria-label={`Details: ${event.title}`}
                      >
                        Details
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {archive.length > 0 && (
            <section aria-labelledby="archive-heading" className="mt-20">
              <h3
                id="archive-heading"
                className="text-2xl font-bold mb-2 text-glow"
              >
                Event Archive
              </h3>
              <p className="text-muted-foreground mb-6">
                Everything else we have run, by academic year.
              </p>
              <div className="space-y-3">
                {archive.map(([year, yearEvents], index) => (
                  <details
                    key={year}
                    open={index === 0}
                    className="group rounded-xl border border-border bg-card/60"
                  >
                    <summary
                      aria-label={`${year}, ${yearEvents.length} ${yearEvents.length === 1 ? "event" : "events"}`}
                      className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-5 py-3 font-semibold focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden"
                    >
                      <span>
                        {year}{" "}
                        <span className="ml-1 font-normal text-muted-foreground">
                          {yearEvents.length}{" "}
                          {yearEvents.length === 1 ? "event" : "events"}
                        </span>
                      </span>
                      <ChevronDownIcon className="h-4 w-4 shrink-0 text-primary transition-transform group-open:rotate-180" />
                    </summary>
                    <ul className="divide-y divide-border border-t border-border">
                      {yearEvents.map((event) => (
                        <li key={event.id}>
                          <button
                            type="button"
                            onClick={() => showDetails(event)}
                            aria-label={`${archiveDate.format(eventDate(event))}, ${event.title}, ${event.type}`}
                            className="flex w-full flex-wrap items-baseline gap-x-4 gap-y-1 px-5 py-3 text-left transition-colors hover:bg-brand/10 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                          >
                            <time
                              dateTime={event.date}
                              className="w-28 shrink-0 text-sm text-muted-foreground"
                            >
                              {archiveDate.format(eventDate(event))}
                            </time>
                            <span className="min-w-0 flex-1 font-medium">
                              {event.title}
                            </span>
                            <span className="text-xs font-medium uppercase tracking-wide text-primary">
                              {event.type}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </details>
                ))}
              </div>
            </section>
          )}

          <CalendarEntryDialog
            entry={selected}
            open={detailsOpen}
            onOpenChange={setDetailsOpen}
          />
        </div>
      </section>

      {/* Calendar section */}
      <section className="relative z-10 py-16 px-4 mb-16">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4 text-glow">
              Events Calendar
            </h2>
            <p className="text-lg text-muted-foreground">
              Browse our upcoming and past events
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-4xl mx-auto rounded-lg overflow-hidden border border-primary/10 bg-card/50 backdrop-blur-xs"
          >
            <EventsCalendar events={events} meetings={meetingsData.meetings} />
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default EventsPage;
