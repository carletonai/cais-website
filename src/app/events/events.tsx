import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDownIcon,
  CodeIcon,
  FileTextIcon,
  PlayIcon,
} from "lucide-react";
import { PageHeader } from "@/components/brand/PageHeader";
import { Section, SectionHeader } from "@/components/brand/Section";
import { EventCard } from "@/components/events/EventCard";
import { NextUp } from "@/components/events/NextUp";
import { SubscribeButton } from "@/components/events/CalendarActions";
import { EventsCalendar } from "@/components/EventsCalendar";
import { Button } from "@/components/ui/button";
import meetingsData from "@/data/meetings.json";
import {
  type ClubEvent,
  academicYear,
  allEvents,
  eventPath,
  formatShortDate,
  isPdf,
  pastEvents,
  upcomingEvents,
} from "@/lib/events";
import { useNow } from "@/lib/useNow";
import { cn } from "@/lib/utils";

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
    allEvents
      .map((event) => event.type)
      .filter((type) => type !== UNDECIDED_TYPE),
  ),
];
const eventTags = byUse(allEvents.flatMap((event) => event.tags));

/** Newest academic year first, keeping each year's events newest first. */
const byAcademicYear = (events: readonly ClubEvent[]) => {
  const years = new Map<string, ClubEvent[]>();
  for (const event of events) {
    const year = academicYear(event);
    years.set(year, [...(years.get(year) ?? []), event]);
  }
  return [...years];
};

const countOf = (n: number) => `${n} ${n === 1 ? "event" : "events"}`;

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      size="sm"
      variant={selected ? "default" : "outline"}
      aria-pressed={selected}
      onClick={onClick}
      className="shrink-0"
    >
      {children}
    </Button>
  );
}

/** One past event as a compact row: date, title, type, what is online. */
function ArchiveRow({ event }: { event: ClubEvent }) {
  return (
    <li>
      <Link
        to={eventPath(event)}
        className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-1 px-5 py-3 transition-colors hover:bg-accent sm:grid-cols-[7.5rem_1fr_auto]"
      >
        <time
          dateTime={event.date}
          className="font-mono text-xs text-muted-foreground sm:text-sm"
        >
          {formatShortDate(event.date)}
        </time>
        <span className="label-mono text-right text-[0.625rem] text-muted-foreground sm:order-last">
          {event.type}
        </span>
        <span className="col-span-2 font-medium sm:col-span-1">
          {event.title}
          {event.materials &&
            (isPdf(event.materials) ? (
              <FileTextIcon
                aria-label="slides online"
                role="img"
                className="ml-2 inline size-4 align-[-2px] text-primary"
              />
            ) : (
              <CodeIcon
                aria-label="code online"
                role="img"
                className="ml-2 inline size-4 align-[-2px] text-primary"
              />
            ))}
          {event.recording && (
            <PlayIcon
              aria-label="recording online"
              role="img"
              className="ml-2 inline size-4 align-[-2px] text-primary"
            />
          )}
        </span>
      </Link>
    </li>
  );
}

const EventsPage = () => {
  const now = useNow();
  const [selectedType, setSelectedType] = useState("All");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [onlyResources, setOnlyResources] = useState(false);
  const filtering =
    selectedType !== "All" || selectedTag !== null || onlyResources;

  const later = upcomingEvents(allEvents, now).slice(1);
  const past = pastEvents(allEvents, now).filter(
    (event) =>
      (selectedType === "All" || event.type === selectedType) &&
      (selectedTag === null || event.tags.includes(selectedTag)) &&
      (!onlyResources || event.materials || event.recording),
  );
  const [current, ...earlier] = byAcademicYear(past);
  const thisSeason = academicYear({ date: now.toISOString().slice(0, 10) });
  // Cards for this season's events; every earlier year is a list of rows.
  const cards = current && current[0] === thisSeason ? current[1] : [];
  const years =
    current && current[0] === thisSeason ? earlier : byAcademicYear(past);

  return (
    <>
      <PageHeader
        label="Events"
        title="Events"
        lede="Workshops, talks and socials for anyone interested in AI and machine learning, with past events on record back to 2019."
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <SubscribeButton variant="default" />
          <Button asChild variant="outline">
            <a href="#calendar-heading">Month calendar</a>
          </Button>
        </div>
      </PageHeader>

      <Section labelledBy="upcoming-heading" className="pb-8 sm:pb-10">
        <SectionHeader
          id="upcoming-heading"
          label="What's on"
          title="Upcoming"
        />
        <NextUp headingLevel="h3" className="max-w-3xl" />
        {later.length > 0 && (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {later.map((event) => (
              <EventCard key={event.id} event={event} now={now} />
            ))}
          </div>
        )}
      </Section>

      <Section
        id="past-events"
        labelledBy="past-heading"
        className="scroll-mt-20"
      >
        <SectionHeader
          id="past-heading"
          label="Since 2019"
          title="Past events"
          lede="Slides, code and recordings are linked wherever they exist."
        />

        <div className="space-y-4">
          <div
            role="group"
            aria-label="Filter by type"
            className="flex flex-wrap gap-2"
          >
            {eventTypes.map((type) => (
              <Chip
                key={type}
                selected={selectedType === type}
                onClick={() => setSelectedType(type)}
              >
                {type}
              </Chip>
            ))}
            <Chip
              selected={onlyResources}
              onClick={() => setOnlyResources((on) => !on)}
            >
              <CodeIcon aria-hidden="true" />
              Slides, code or video
            </Chip>
          </div>
          <div
            role="group"
            aria-label="Filter by tag"
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
          >
            {[null, ...eventTags].map((tag) => (
              <Chip
                key={tag ?? "all-tags"}
                selected={selectedTag === tag}
                onClick={() => setSelectedTag(tag)}
              >
                {tag ?? "All tags"}
              </Chip>
            ))}
          </div>
          {/* Present from the start, so changes to it are announced. */}
          <p role="status" className="label-mono text-muted-foreground">
            {filtering
              ? `${countOf(past.length)} match`
              : `${countOf(past.length)}`}
          </p>
        </div>

        {past.length === 0 && (
          <p className="mt-8 text-muted-foreground">
            No past events match these filters.
          </p>
        )}

        {cards.length > 0 && (
          <>
            <h3 className="label-mono mb-5 mt-10 text-primary">
              This year · {thisSeason}
            </h3>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {cards.map((event) => (
                <EventCard key={event.id} event={event} now={now} />
              ))}
            </div>
          </>
        )}

        {years.length > 0 && (
          <div className="mt-10 space-y-3">
            {years.map(([year, yearEvents], index) => (
              <details
                key={year}
                open={index === 0}
                className="group rounded-2xl border border-border bg-card"
              >
                <summary
                  aria-label={`${year}, ${countOf(yearEvents.length)}`}
                  className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-5 py-3 [&::-webkit-details-marker]:hidden"
                >
                  <span className="font-heading text-lg font-bold">
                    {year}
                    <span className="label-mono ml-3 font-normal text-muted-foreground">
                      {countOf(yearEvents.length)}
                    </span>
                  </span>
                  <ChevronDownIcon
                    aria-hidden="true"
                    className={cn(
                      "size-5 shrink-0 text-muted-foreground transition-transform",
                      "group-open:rotate-180",
                    )}
                  />
                </summary>
                <ul className="divide-y divide-border border-t border-border">
                  {yearEvents.map((event) => (
                    <ArchiveRow key={event.id} event={event} />
                  ))}
                </ul>
              </details>
            ))}
          </div>
        )}
      </Section>

      <Section labelledBy="calendar-heading" className="border-t border-border">
        <SectionHeader
          id="calendar-heading"
          label="By month"
          title="Calendar"
          lede="Events and the weekly exec meeting, month by month."
        />
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <EventsCalendar events={allEvents} meetings={meetingsData.meetings} />
        </div>
      </Section>
    </>
  );
};

export default EventsPage;
