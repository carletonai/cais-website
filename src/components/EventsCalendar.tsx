import { useId, useMemo, useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  MapPinIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type CalendarEntry,
  CalendarEntryDialog,
} from "@/components/CalendarEntryDialog";
import { cn } from "@/lib/utils";
import {
  type ClubEvent,
  type Meeting,
  eventDate,
  meetsOn,
  upcomingEvents,
} from "@/lib/events";

const WEEKDAYS = [
  ["Sun", "Sunday"],
  ["Mon", "Monday"],
  ["Tue", "Tuesday"],
  ["Wed", "Wednesday"],
  ["Thu", "Thursday"],
  ["Fri", "Friday"],
  ["Sat", "Saturday"],
] as const;

const monthName = new Intl.DateTimeFormat("en-CA", {
  month: "long",
  year: "numeric",
});
const shortMonth = new Intl.DateTimeFormat("en-CA", { month: "short" });
const weekdayName = new Intl.DateTimeFormat("en-CA", { weekday: "short" });
const shortDate = new Intl.DateTimeFormat("en-CA", {
  weekday: "short",
  month: "short",
  day: "numeric",
});

/** Opens on the next event's month, so the grid leads with something to attend. */
const openingMonth = (events: readonly ClubEvent[]) => {
  const next = upcomingEvents(events)[0];
  const date = next ? eventDate(next) : new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

/** Every day of the month, as local-midnight dates. */
const daysOf = (month: Date) => {
  const count = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();

  return Array.from(
    { length: count },
    (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1),
  );
};

/** Sunday-first weeks, padded with nulls at both ends. */
const weeksOf = (days: Date[]) => {
  const cells: (Date | null)[] = [
    ...Array<null>(days[0].getDay()).fill(null),
    ...days,
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return Array.from({ length: cells.length / 7 }, (_, week) =>
    cells.slice(week * 7, week * 7 + 7),
  );
};

/**
 * Every month that has an event, oldest first and grouped by year, so any
 * past event is two clicks away (year, then month) rather than dozens.
 */
const monthsWithEvents = (events: readonly ClubEvent[]) => {
  const byMonth = new Map<number, { month: Date; count: number }>();
  for (const event of events) {
    const date = eventDate(event);
    const month = new Date(date.getFullYear(), date.getMonth(), 1);
    const entry = byMonth.get(month.getTime()) ?? { month, count: 0 };
    entry.count += 1;
    byMonth.set(month.getTime(), entry);
  }

  const byYear = new Map<number, { month: Date; count: number }[]>();
  for (const [, entry] of [...byMonth].sort(([a], [b]) => a - b)) {
    const year = entry.month.getFullYear();
    byYear.set(year, [...(byYear.get(year) ?? []), entry]);
  }
  return [...byYear];
};

type EventsCalendarProps = {
  events: readonly ClubEvent[];
  /** Calendar-only entries: shown in the grid, never listed as events. */
  meetings: readonly Meeting[];
};

/**
 * Month view of the same events the cards above list, plus club meetings.
 * Titles only fit in the cells from `md` up; below that each entry is a dot,
 * and the agenda under the grid carries the details at every width. Any
 * entry, in the grid or the agenda, opens its full details.
 */
export function EventsCalendar({ events, meetings }: EventsCalendarProps) {
  const [month, setMonth] = useState(() => openingMonth(events));
  const [selected, setSelected] = useState<CalendarEntry | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const headingId = useId();
  const shortcuts = useMemo(() => monthsWithEvents(events), [events]);

  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const days = daysOf(month);
  const today = new Date();

  const monthEvents = events
    .filter((event) => {
      const date = eventDate(event);
      return date.getFullYear() === year && date.getMonth() === monthIndex;
    })
    .sort((a, b) => eventDate(a).getTime() - eventDate(b).getTime());

  const monthMeetings = meetings.filter((meeting) =>
    days.some((day) => meetsOn(meeting, day)),
  );

  const entriesOn = (
    day: Date,
  ): { key: string; title: string; entry: CalendarEntry }[] => [
    ...monthEvents
      .filter((event) => eventDate(event).getDate() === day.getDate())
      .map((event) => ({
        key: `event-${event.id}`,
        title: event.title,
        entry: { kind: "event" as const, event },
      })),
    ...monthMeetings
      .filter((meeting) => meetsOn(meeting, day))
      .map((meeting) => ({
        key: `meeting-${meeting.id}`,
        title: meeting.title,
        entry: { kind: "meeting" as const, meeting, date: day },
      })),
  ];

  const isToday = (day: Date) => day.toDateString() === today.toDateString();

  const showMonth = (offset: number) =>
    setMonth(new Date(year, monthIndex + offset, 1));

  const showDetails = (entry: CalendarEntry) => {
    setSelected(entry);
    setDetailsOpen(true);
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Previous month"
          onClick={() => showMonth(-1)}
        >
          <ChevronLeftIcon />
        </Button>
        <h3
          id={headingId}
          aria-live="polite"
          className="whitespace-nowrap text-lg font-semibold sm:text-2xl"
        >
          {monthName.format(month)}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Next month"
          onClick={() => showMonth(1)}
        >
          <ChevronRightIcon />
        </Button>
      </div>

      <nav aria-label="Months with events" className="mb-5 space-y-3">
        <div className="flex flex-wrap gap-2">
          {shortcuts.map(([shortcutYear, months]) => {
            const current = shortcutYear === year;
            const count = months.reduce((sum, m) => sum + m.count, 0);

            return (
              <Button
                key={shortcutYear}
                size="sm"
                variant={current ? "default" : "outline"}
                aria-current={current ? "true" : undefined}
                // A year jumps to its latest month with events.
                onClick={() => setMonth(months[months.length - 1].month)}
                // An sr-only span would be read "2021 , 3 events": it is
                // out of flow, so name computation pads it with a space.
                aria-label={`${shortcutYear}, ${count} ${count === 1 ? "event" : "events"}`}
                className="rounded-full px-4"
              >
                {shortcutYear}
              </Button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            shortcuts.find(([shortcutYear]) => shortcutYear === year)?.[1] ?? []
          ).map(({ month: shortcut, count }) => {
            const current = shortcut.getTime() === month.getTime();

            return (
              <Button
                key={shortcut.getTime()}
                size="sm"
                variant={current ? "default" : "outline"}
                aria-current={current ? "true" : undefined}
                onClick={() => setMonth(shortcut)}
                className="gap-1.5 rounded-full px-3"
              >
                {shortMonth.format(shortcut)}
                <span className="sr-only"> {year},</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 text-xs",
                    // A light tint over the brand fill drops below 7:1.
                    current ? "bg-black/30" : "bg-current/20",
                  )}
                >
                  {count}
                </span>
                <span className="sr-only">
                  {count === 1 ? " event" : " events"}
                </span>
              </Button>
            );
          })}
        </div>
      </nav>

      <table
        aria-labelledby={headingId}
        className="w-full table-fixed border-collapse"
      >
        <thead>
          <tr>
            {WEEKDAYS.map(([short, full]) => (
              <th
                key={short}
                scope="col"
                className="pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                <abbr title={full} className="no-underline">
                  {short}
                </abbr>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeksOf(days).map((week, weekIndex) => (
            <tr key={weekIndex}>
              {week.map((day, dayIndex) => {
                const entries = day ? entriesOn(day) : [];
                const hasEvent = entries.some(
                  ({ entry }) => entry.kind === "event",
                );

                return (
                  <td
                    key={dayIndex}
                    className={cn(
                      "h-14 border border-border p-1 align-top md:h-24 md:p-1.5",
                      hasEvent && "bg-brand/10",
                    )}
                  >
                    {day && (
                      <>
                        <span
                          className={cn(
                            "inline-flex h-7 w-7 items-center justify-center rounded-full text-sm",
                            isToday(day)
                              ? "bg-brand font-semibold text-brand-foreground"
                              : hasEvent
                                ? "font-semibold text-foreground"
                                : "text-muted-foreground",
                          )}
                        >
                          {day.getDate()}
                        </span>
                        {isToday(day) && (
                          <span className="sr-only">(today)</span>
                        )}
                        {entries.length > 0 && (
                          <ul className="mt-0.5 space-y-0.5 md:mt-1 md:space-y-1">
                            {entries.map(({ key, title, entry }) => (
                              <li key={key}>
                                <button
                                  type="button"
                                  onClick={() => showDetails(entry)}
                                  className={cn(
                                    "flex h-6 w-full items-center justify-center rounded focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring md:block md:h-auto md:px-1.5 md:py-0.5 md:text-left md:text-xs md:leading-snug md:hover:ring-1 md:hover:ring-primary/60",
                                    entry.kind === "meeting"
                                      ? "md:border md:border-border md:text-muted-foreground"
                                      : "md:bg-brand/20 md:font-medium md:text-primary",
                                  )}
                                >
                                  <span
                                    aria-hidden="true"
                                    className={cn(
                                      "block h-2 w-2 rounded-full md:hidden",
                                      entry.kind === "meeting"
                                        ? "bg-muted-foreground"
                                        : "bg-primary",
                                    )}
                                  />
                                  <span className="sr-only md:not-sr-only md:line-clamp-2">
                                    {title}
                                  </span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 space-y-3">
        {monthEvents.length === 0 ? (
          <p className="text-center text-muted-foreground">
            No events scheduled in {monthName.format(month)}.
          </p>
        ) : (
          <ul className="space-y-3">
            {monthEvents.map((event) => {
              const date = eventDate(event);

              return (
                <li key={event.id}>
                  <button
                    type="button"
                    onClick={() => showDetails({ kind: "event", event })}
                    className="flex w-full gap-4 rounded-lg border border-border bg-background/60 p-4 text-left transition-colors hover:border-primary/50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <time
                      dateTime={event.date}
                      className="flex w-12 shrink-0 flex-col items-center"
                    >
                      <span className="text-xs font-medium uppercase text-primary">
                        {weekdayName.format(date)}
                      </span>
                      <span className="text-2xl font-bold leading-tight">
                        {date.getDate()}
                      </span>
                    </time>
                    <span className="block min-w-0">
                      <span className="block font-semibold">{event.title}</span>
                      <span className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        {event.time && (
                          <span className="inline-flex items-center gap-1">
                            <ClockIcon className="h-4 w-4" />
                            {event.time}
                          </span>
                        )}
                        {event.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPinIcon className="h-4 w-4" />
                            {event.location}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {monthMeetings.length > 0 && (
          <ul className="space-y-2">
            {monthMeetings.map((meeting) => (
              <li key={meeting.id}>
                <button
                  type="button"
                  onClick={() => showDetails({ kind: "meeting", meeting })}
                  className="flex w-full flex-wrap gap-x-4 gap-y-1 rounded-lg border border-dashed border-border px-4 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-primary/50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="font-medium text-foreground">
                    {meeting.title}
                  </span>
                  <span>
                    {meeting.weekly
                      ? `${WEEKDAYS[eventDate(meeting).getDay()][1]}s`
                      : shortDate.format(eventDate(meeting))}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <ClockIcon className="h-4 w-4" />
                    {meeting.time}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPinIcon className="h-4 w-4" />
                    {meeting.location}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <CalendarEntryDialog
        entry={selected}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  );
}
