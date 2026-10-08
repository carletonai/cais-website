import { type ReactNode, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRightIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  RepeatIcon,
} from "lucide-react";
import { EventMeta } from "@/components/events/EventMeta";
import { ResourceLinks, RsvpButton } from "@/components/events/EventLinks";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  type ClubEvent,
  type Meeting,
  eventDate,
  eventPath,
  eventStatus,
} from "@/lib/events";

export type CalendarEntry =
  | { kind: "event"; event: ClubEvent }
  /** `date` is the occurrence that was clicked; absent from the summary row. */
  | { kind: "meeting"; meeting: Meeting; date?: Date };

const longDate = new Intl.DateTimeFormat("en-CA", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});
const weekday = new Intl.DateTimeFormat("en-CA", { weekday: "long" });

type CalendarEntryDialogProps = {
  /** Kept after closing so the exit animation still has content to show. */
  entry: CalendarEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const Fact = ({
  icon: Icon,
  children,
}: {
  icon: typeof ClockIcon;
  children: ReactNode;
}) => (
  <li className="flex items-start gap-2">
    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
    <span>{children}</span>
  </li>
);

const EventDetails = ({ event }: { event: ClubEvent }) => {
  const now = new Date();
  const status = eventStatus(event, now);

  return (
    <>
      <p className="label-mono mb-3 text-muted-foreground">
        <span className="text-primary">{event.type}</span> · {status.label}
      </p>
      <DialogTitle className="pr-10 text-2xl leading-tight">
        {event.title}
      </DialogTitle>
      <EventMeta event={event} on="card" withYear className="mt-4" />
      <DialogDescription className="mt-4 text-base text-foreground">
        {event.description}
      </DialogDescription>
      <div className="mt-5 flex flex-wrap gap-2">
        <RsvpButton event={event} now={now} />
        <Button asChild variant="outline" size="sm">
          <Link to={eventPath(event)}>
            Full details
            <ArrowRightIcon aria-hidden="true" />
          </Link>
        </Button>
      </div>
      <ResourceLinks event={event} className="mt-3" />
    </>
  );
};

const MeetingDetails = ({
  meeting,
  date,
}: {
  meeting: Meeting;
  date?: Date;
}) => {
  const first = eventDate(meeting);

  return (
    <>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Meeting
      </p>
      <DialogTitle className="pr-10 text-xl leading-snug">
        {meeting.title}
      </DialogTitle>
      <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
        {(date || !meeting.weekly) && (
          <Fact icon={CalendarIcon}>{longDate.format(date ?? first)}</Fact>
        )}
        {meeting.weekly && (
          <Fact icon={RepeatIcon}>
            Every {weekday.format(first)}
            {meeting.until &&
              `, until ${longDate.format(eventDate({ date: meeting.until }))}`}
          </Fact>
        )}
        <Fact icon={ClockIcon}>{meeting.time}</Fact>
        <Fact icon={MapPinIcon}>{meeting.location}</Fact>
      </ul>
    </>
  );
};

/** Details for whatever was clicked on the events calendar. */
export function CalendarEntryDialog({
  entry,
  open,
  onOpenChange,
}: CalendarEntryDialogProps) {
  // Opened from plain buttons rather than a DialogTrigger, so Radix has no
  // trigger to hand focus back to on close; return it to whatever opened us.
  const returnFocusTo = useRef<HTMLElement | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {entry && (
        <DialogContent
          overlayClassName="bg-background/60 backdrop-blur-none"
          // Meetings have no description; saying so silences Radix's warning.
          // Events keep the default, which points at their description.
          {...(entry.kind === "meeting" && { "aria-describedby": undefined })}
          onOpenAutoFocus={() => {
            returnFocusTo.current = document.activeElement as HTMLElement;
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            returnFocusTo.current?.focus();
          }}
          className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto"
        >
          {entry.kind === "event" ? (
            <EventDetails event={entry.event} />
          ) : (
            <MeetingDetails meeting={entry.meeting} date={entry.date} />
          )}
        </DialogContent>
      )}
    </Dialog>
  );
}
