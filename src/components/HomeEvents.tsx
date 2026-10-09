import { Link } from "react-router-dom";
import { ArrowRightIcon } from "lucide-react";
import { Section, SectionHeader } from "@/components/brand/Section";
import { EventCard } from "@/components/events/EventCard";
import { SubscribeButton } from "@/components/events/CalendarActions";
import { Button } from "@/components/ui/button";
import { allEvents, eventsWithResources, upcomingEvents } from "@/lib/events";
import { useNow } from "@/lib/useNow";

/** Everything after the hero ticket's event. Hidden when there is nothing. */
export function ComingUp() {
  const now = useNow();
  const later = upcomingEvents(allEvents, now).slice(1, 4);
  if (later.length === 0) return null;

  return (
    <Section labelledBy="coming-up">
      <SectionHeader
        id="coming-up"
        label="On the calendar"
        title="Coming up"
        action={<SubscribeButton />}
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {later.map((event) => (
          <EventCard key={event.id} event={event} now={now} />
        ))}
      </div>
    </Section>
  );
}

/** Past workshops whose code, notebook or recording is online. */
export function CatchUp() {
  const now = useNow();
  const recent = eventsWithResources(allEvents, now).slice(0, 3);
  if (recent.length === 0) return null;

  return (
    <Section
      labelledBy="catch-up"
      className="border-y border-border bg-card/40"
    >
      <SectionHeader
        id="catch-up"
        label="Code & recordings"
        title="Missed a workshop?"
        lede="Code, notebooks and recordings from many past sessions are online. Pick up where the room left off."
        action={
          <Button asChild variant="outline">
            <Link to="/events#past-events">
              All past events
              <ArrowRightIcon aria-hidden="true" />
            </Link>
          </Button>
        }
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {recent.map((event) => (
          <EventCard key={event.id} event={event} now={now} />
        ))}
      </div>
    </Section>
  );
}
