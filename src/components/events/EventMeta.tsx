import {
  type ClubEvent,
  formatDateRange,
  formatTimeRange,
  weekdayOf,
} from "@/lib/events";
import { cn } from "@/lib/utils";

const WEEK = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

/** Mo Tu We Th [Fr] Sa Su, the event's day circled, as on the posters. The
 *  date already names the day, so this is hidden from assistive tech. */
export function WeekdayStrip({ date }: { date: string }) {
  // weekdayOf counts from Sunday; the strip starts on Monday.
  const day = (weekdayOf(date) + 6) % 7;
  return (
    <span
      aria-hidden="true"
      className="inline-flex gap-1 font-mono text-[0.7rem] text-muted-foreground"
    >
      {WEEK.map((name, i) => (
        <span
          key={name}
          className={cn(
            "inline-flex size-6 items-center justify-center rounded-full",
            i === day && "border-2 border-mark font-medium text-foreground",
          )}
        >
          {name}
        </span>
      ))}
    </span>
  );
}

type EventMetaProps = {
  event: Pick<ClubEvent, "date" | "time" | "location" | "endDate">;
  size?: "sm" | "lg";
  /** Add the year, for events outside the current season. */
  withYear?: boolean;
  weekdays?: boolean;
  /** The surface behind the list, so the bullets hide the line under them. */
  on?: "background" | "card";
  className?: string;
};

/**
 * Date, time and place as the posters lay them out: a "transit line" of red
 * ring stops joined by a grey line.
 */
export function EventMeta({
  event,
  size = "sm",
  withYear = false,
  weekdays = false,
  on = "background",
  className,
}: EventMetaProps) {
  const time = formatTimeRange(event.time);
  const stops = [
    {
      key: "date",
      label: "Date",
      value: (
        <time dateTime={event.date}>
          {formatDateRange(event, { year: withYear })}
        </time>
      ),
    },
    ...(time ? [{ key: "time", label: "Time", value: time }] : []),
    ...(event.location
      ? [
          {
            key: "place",
            label: "Place",
            value: event.location,
          },
        ]
      : []),
  ];
  const large = size === "lg";

  return (
    <ul
      className={cn(
        "relative",
        large ? "space-y-3 text-lg font-medium" : "space-y-1.5 text-sm",
        // The line joining the stops runs behind the ring bullets.
        stops.length > 1 &&
          "before:absolute before:bottom-[0.8em] before:top-[0.8em] before:w-[3px] before:bg-circuit",
        large ? "before:left-[7px]" : "before:left-[5.5px]",
        className,
      )}
    >
      {stops.map(({ key, label, value }) => (
        <li
          key={key}
          className={cn(
            "relative flex flex-wrap items-center gap-x-3 gap-y-1.5",
            large ? "pl-8" : "pl-6",
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              // Level with the first line, even when the weekday strip wraps.
              "absolute left-0 rounded-full border-mark",
              on === "card" ? "bg-card" : "bg-background",
              large
                ? "top-[5.5px] size-[17px] border-[4px]"
                : "top-[3px] size-[14px] border-[3px]",
            )}
          />
          <span className="sr-only">{label}: </span>
          {/* Dates and times never break mid-way; long places may wrap. */}
          <span className={key === "place" ? undefined : "whitespace-nowrap"}>
            {value}
          </span>
          {key === "date" && weekdays && !event.endDate && (
            <WeekdayStrip date={event.date} />
          )}
        </li>
      ))}
    </ul>
  );
}
