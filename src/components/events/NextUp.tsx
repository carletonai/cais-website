import { Link } from "react-router";
import { ArrowRightIcon } from "lucide-react";
import { FaDiscord } from "react-icons/fa";
import { Ring } from "@/components/brand/Ring";
import { Button } from "@/components/ui/button";
import {
  type ClubEvent,
  allEvents,
  eventPath,
  eventStatus,
  nextEvent,
  posterThumb,
  rsvpFor,
} from "@/lib/events";
import { useClockSettled, useNow } from "@/lib/useNow";
import { cn } from "@/lib/utils";
import { DISCORD_URL } from "@/lib/links";
import {
  AddToCalendarButton,
  ShareButton,
  SubscribeButton,
} from "./CalendarActions";
import { Countdown } from "./Countdown";
import { EventMeta } from "./EventMeta";
import { RsvpButton } from "./EventLinks";

/** The countdown only shows while the wait is short enough to matter. */
const COUNTDOWN_WINDOW = 21 * 24 * 60 * 60 * 1000;

type NextUpProps = {
  events?: readonly ClubEvent[];
  headingLevel?: "h2" | "h3";
  /** The ticket's own ring; off where the page already has one behind it. */
  ring?: boolean;
  className?: string;
};

/**
 * The next event as a cream poster "ticket": what, when, where, how long to
 * go, and the one action that matters. While it runs, it says so.
 */
export function NextUp({
  events = allEvents,
  headingLevel = "h2",
  ring = true,
  className,
}: NextUpProps) {
  const now = useNow(15_000);
  const settled = useClockSettled();
  const event = nextEvent(events, now);
  const Heading = headingLevel;

  if (!event) {
    return (
      <article
        data-surface="paper"
        aria-labelledby="next-up-title"
        className={cn(
          "relative overflow-hidden rounded-3xl bg-background p-6 shadow-2xl shadow-black/40 sm:p-8",
          className,
        )}
      >
        <p className="label-mono text-muted-foreground">Next up</p>
        <Heading
          id="next-up-title"
          className="font-display mt-3 text-4xl leading-[0.92]"
        >
          Nothing on the calendar yet
        </Heading>
        <p className="mt-4 text-muted-foreground">
          New events are announced on Instagram and Discord. Subscribe and they
          will land in your calendar on their own.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <SubscribeButton variant="default" />
          <Button asChild variant="outline">
            <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer">
              <FaDiscord aria-hidden="true" />
              Join the Discord
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </Button>
        </div>
      </article>
    );
  }

  const status = eventStatus(event, now, { relative: settled });
  const live = status.phase === "live";
  // Saying it is on now waits for the clock, like the label: a page built
  // during an event would otherwise say so until the next deploy.
  const onNow = live && settled;
  const path = eventPath(event);
  const hasRsvp = rsvpFor(event, now) !== null;
  const thumb = event.poster ? posterThumb(event.poster) : null;
  // The poster takes the ring's corner when the event has one.
  const showRing = ring && !thumb;

  return (
    <article
      data-surface="paper"
      aria-labelledby="next-up-title"
      className={cn(
        "relative overflow-hidden rounded-3xl bg-background p-6 shadow-2xl shadow-black/40 sm:p-8",
        className,
      )}
    >
      {/* The ring lives in a gutter the text never enters. */}
      {showRing && (
        <Ring
          draw
          className="absolute -right-14 -top-14 hidden w-40 sm:block"
        />
      )}
      <div
        className={cn(
          "flex items-start gap-5 sm:gap-8",
          showRing && "sm:pr-24",
        )}
      >
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "label-mono flex flex-wrap items-center gap-x-2 gap-y-1",
              onNow ? "text-primary" : "text-muted-foreground",
            )}
          >
            {onNow && (
              <span
                aria-hidden="true"
                className="live-pulse inline-block size-2.5 rounded-full bg-mark"
              />
            )}
            <span>{onNow ? status.label : `Next up · ${status.label}`}</span>
          </p>
          <Heading
            id="next-up-title"
            className="font-display mt-3 text-[2.25rem] leading-[0.92] sm:text-5xl"
          >
            <span className="sr-only">{onNow ? "On now: " : "Next up: "}</span>
            <Link
              to={path}
              className="decoration-mark decoration-4 underline-offset-[6px] hover:underline"
            >
              {event.title}
            </Link>
          </Heading>
          <p className="mt-3 line-clamp-3 text-muted-foreground">
            {event.description}
          </p>
        </div>
        {thumb && (
          // The poster repeats the title's link, so it is not a second tab stop.
          <Link
            to={path}
            tabIndex={-1}
            aria-hidden="true"
            className="w-24 shrink-0 overflow-hidden rounded-xl shadow-lg shadow-black/25 sm:w-40 sm:rounded-2xl"
          >
            <img
              src={thumb}
              alt=""
              width={event.posterWidth}
              height={event.posterHeight}
              decoding="async"
              className="block h-auto w-full"
            />
          </Link>
        )}
      </div>

      <EventMeta event={event} size="lg" weekdays className="mt-6" />

      {!live && status.startsIn < COUNTDOWN_WINDOW && (
        <Countdown ms={settled ? status.startsIn : null} className="mt-6" />
      )}

      <div className="mt-7 flex flex-wrap gap-3">
        {hasRsvp ? (
          <RsvpButton event={event} now={now} />
        ) : (
          !live && <AddToCalendarButton event={event} variant="default" />
        )}
        {hasRsvp && !live && <AddToCalendarButton event={event} />}
        <ShareButton event={event} />
        <Button asChild variant="ghost">
          <Link to={path}>
            Details
            <ArrowRightIcon aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
