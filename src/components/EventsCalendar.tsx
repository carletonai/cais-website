import { useId, useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  MapPinIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

type EventsCalendarProps = {
  events: readonly ClubEvent[];
  /** Calendar-only entries: shown in the grid, never listed as events. */
  meetings: readonly Meeting[];
};

/**
 * Month view of the same events the cards above list, plus club meetings.
 * Titles only fit in the cells from `md` up; below that each entry is a dot,
 * and the agenda under the grid carries the details at every width.
 */
export function EventsCalendar({ events, meetings }: EventsCalendarProps) {
  const [month, setMonth] = useState(() => openingMonth(events));
  const headingId = useId();

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

  const entriesOn = (day: Date) => [
    ...monthEvents
      .filter((event) => eventDate(event).getDate() === day.getDate())
      .map((event) => ({ ...event, meeting: false })),
    ...monthMeetings
      .filter((meeting) => meetsOn(meeting, day))
      .map((meeting) => ({ ...meeting, meeting: true })),
  ];

  const isToday = (day: Date) => day.toDateString() === today.toDateString();

  const showMonth = (offset: number) =>
    setMonth(new Date(year, monthIndex + offset, 1));

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
                const hasEvent = entries.some((entry) => !entry.meeting);

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
                          <ul className="mt-1 flex flex-wrap gap-1 md:block md:space-y-1">
                            {entries.map((entry) => (
                              <li
                                key={`${entry.meeting ? "meeting" : "event"}-${entry.id}`}
                                title={entry.title}
                              >
                                <span
                                  aria-hidden="true"
                                  className={cn(
                                    "block h-2 w-2 rounded-full md:hidden",
                                    entry.meeting
                                      ? "bg-muted-foreground"
                                      : "bg-primary",
                                  )}
                                />
                                <span
                                  className={cn(
                                    "sr-only md:not-sr-only md:line-clamp-2 md:rounded md:px-1.5 md:py-0.5 md:text-xs md:leading-snug",
                                    entry.meeting
                                      ? "md:border md:border-border md:text-muted-foreground"
                                      : "md:bg-brand/20 md:font-medium md:text-primary",
                                  )}
                                >
                                  {entry.title}
                                </span>
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
                <li
                  key={event.id}
                  className="flex gap-4 rounded-lg border border-border bg-background/60 p-4 text-left"
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
                  <div className="min-w-0">
                    <p className="font-semibold">{event.title}</p>
                    <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <ClockIcon className="h-4 w-4" />
                        {event.time}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPinIcon className="h-4 w-4" />
                        {event.location}
                      </span>
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {monthMeetings.length > 0 && (
          <ul className="space-y-2">
            {monthMeetings.map((meeting) => (
              <li
                key={meeting.id}
                className="flex flex-wrap gap-x-4 gap-y-1 rounded-lg border border-dashed border-border px-4 py-3 text-left text-sm text-muted-foreground"
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
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
