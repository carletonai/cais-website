import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeftIcon } from "lucide-react";
import { Ring } from "@/components/brand/Ring";
import { EventPoster } from "@/components/EventPoster";
import { EventCard } from "@/components/events/EventCard";
import { EventMeta } from "@/components/events/EventMeta";
import { ResourceLinks, RsvpButton } from "@/components/events/EventLinks";
import {
  AddToCalendarButton,
  ShareButton,
  SubscribeButton,
} from "@/components/events/CalendarActions";
import { Countdown } from "@/components/events/Countdown";
import {
  allEvents,
  eventPath,
  eventSlug,
  eventStatus,
  findEventBySlug,
  pastEvents,
  upcomingEvents,
} from "@/lib/events";
import { useNow } from "@/lib/useNow";
import { cn } from "@/lib/utils";

const COUNTDOWN_WINDOW = 21 * 24 * 60 * 60 * 1000;

/** /events/<id>-<title>: one event, shareable, with its own link preview. */
const EventPage = () => {
  const { slug = "" } = useParams();
  const now = useNow(15_000);
  const event = findEventBySlug(slug);

  if (!event) return <Navigate to="/events" replace />;
  // An old or hand-typed slug still works; settle on the current one.
  if (slug !== eventSlug(event)) {
    return <Navigate to={eventPath(event)} replace />;
  }

  const status = eventStatus(event, now);
  const live = status.phase === "live";
  const past = status.phase === "past";
  const others = past
    ? pastEvents(allEvents, now)
        .filter((e) => e.id !== event.id && e.type === event.type)
        .slice(0, 3)
    : upcomingEvents(allEvents, now)
        .filter((e) => e.id !== event.id)
        .slice(0, 3);

  return (
    <article className="relative">
      <div className="relative overflow-hidden border-b border-border bg-dots">
        <Ring
          draw
          className="absolute -right-24 -top-32 w-56 lg:-right-20 lg:-top-44 lg:w-[30rem]"
        />
        <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-4 pb-14 pt-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-14 lg:pb-20 lg:pt-12">
          <div>
            <Link
              to="/events"
              className="label-mono inline-flex min-h-11 items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeftIcon aria-hidden="true" className="size-4" />
              All events
            </Link>
            <p
              className={cn(
                "label-mono mt-6",
                live ? "text-primary" : "text-muted-foreground",
              )}
            >
              {live && (
                <span
                  aria-hidden="true"
                  className="live-pulse mr-2 inline-block size-2.5 rounded-full bg-mark align-middle"
                />
              )}
              {event.type} · {status.label}
            </p>
            <h1
              id="event-title"
              tabIndex={-1}
              className="font-display mt-4 max-w-[16ch] text-title focus:outline-none"
            >
              {event.title}
            </h1>
            <EventMeta
              event={event}
              size="lg"
              weekdays
              withYear
              className="mt-8"
            />
            {!past && !live && status.startsIn < COUNTDOWN_WINDOW && (
              <Countdown ms={status.startsIn} className="mt-8" />
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              <RsvpButton event={event} now={now} />
              {!past && (
                <AddToCalendarButton
                  event={event}
                  variant={event.rsvpLink ? "outline" : "default"}
                />
              )}
              <ShareButton event={event} />
            </div>
            <p className="mt-10 text-lg leading-relaxed">{event.description}</p>
            {event.tags.length > 0 && (
              <ul aria-label="Tags" className="mt-6 flex flex-wrap gap-2">
                {event.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full border border-border px-3 py-1 font-mono text-xs text-muted-foreground"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            )}
            <ResourceLinks event={event} className="mt-8" />
          </div>
          <div className="lg:pt-24">
            <EventPoster event={event} />
          </div>
        </div>
      </div>

      <section
        aria-labelledby="more-events"
        className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6"
      >
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <h2 id="more-events" className="text-3xl">
            {past ? `More ${event.type.toLowerCase()}s` : "Also coming up"}
          </h2>
          <SubscribeButton />
        </div>
        {others.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {others.map((other) => (
              <EventCard key={other.id} event={other} now={now} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">
            Nothing else is scheduled yet.{" "}
            <Link
              to="/events"
              className="text-primary underline underline-offset-4"
            >
              Browse every event
            </Link>
            .
          </p>
        )}
      </section>
    </article>
  );
};

export default EventPage;
