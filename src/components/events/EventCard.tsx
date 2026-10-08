import { Link } from "react-router-dom";
import { EventCover } from "./EventArt";
import { EventMeta } from "./EventMeta";
import { ResourceLinks, RsvpButton } from "./EventLinks";
import {
  type ClubEvent,
  academicYear,
  eventPath,
  eventStatus,
} from "@/lib/events";
import { cn } from "@/lib/utils";

type EventCardProps = {
  event: ClubEvent;
  now: Date;
  headingLevel?: "h2" | "h3";
};

/**
 * One event, everywhere it is listed. The title is a link stretched over the
 * whole card, so the card opens the event's page; the RSVP and resource links
 * sit above that layer and stay separately clickable.
 */
export function EventCard({ event, now, headingLevel = "h3" }: EventCardProps) {
  const status = eventStatus(event, now);
  const Heading = headingLevel;
  const live = status.phase === "live";
  const past = status.phase === "past";
  const currentSeason =
    academicYear(event) ===
    academicYear({
      date: now.toISOString().slice(0, 10),
    });

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-colors duration-150 hover:border-input",
        "has-[[data-card-link]:focus-visible]:outline-3 has-[[data-card-link]:focus-visible]:outline-offset-2 has-[[data-card-link]:focus-visible]:outline-ring has-[[data-card-link]:focus-visible]:outline-solid",
        live ? "border-mark" : "border-border",
      )}
    >
      <EventCover event={event} />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="label-mono text-muted-foreground">
          {live && (
            <span
              aria-hidden="true"
              className="live-pulse mr-2 inline-block size-2 rounded-full bg-mark align-middle"
            />
          )}
          {event.type} ·{" "}
          <span className={cn(live && "text-primary")}>
            {past ? academicYear(event) : status.label}
          </span>
        </p>
        <Heading className="text-xl leading-snug">
          <Link
            to={eventPath(event)}
            data-card-link
            className="after:absolute after:inset-0 focus-visible:outline-none group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4"
          >
            {event.title}
          </Link>
        </Heading>
        <EventMeta event={event} on="card" withYear={!currentSeason} />
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {event.description}
        </p>
        <div className="relative z-10 mt-auto flex flex-wrap gap-2 pt-1 empty:hidden">
          <RsvpButton event={event} now={now} />
          <ResourceLinks event={event} />
        </div>
      </div>
    </article>
  );
}
