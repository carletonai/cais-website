import { type ReactNode, useRef } from "react";
import {
  ArrowRightIcon,
  CalendarIcon,
  ClockIcon,
  CodeIcon,
  ExternalLinkIcon,
  MapPinIcon,
  PlayCircleIcon,
  RepeatIcon,
} from "lucide-react";
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
  isUpcoming,
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
  const upcoming = isUpcoming(event);

  return (
    <>
      {event.poster && (
        <img
          src={event.poster}
          alt={`Poster for ${event.title}`}
          className="mx-auto mb-5 max-h-72 rounded-lg"
        />
      )}
      <p className="mb-2 flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide">
        <span className="rounded-full bg-brand/20 px-2 py-0.5 text-primary">
          {event.type}
        </span>
        <span className="text-muted-foreground">
          {upcoming ? "Upcoming" : "Past event"}
        </span>
      </p>
      <DialogTitle className="pr-10 text-xl leading-snug">
        {event.title}
      </DialogTitle>
      <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
        <Fact icon={CalendarIcon}>{longDate.format(eventDate(event))}</Fact>
        {event.time && <Fact icon={ClockIcon}>{event.time}</Fact>}
        {event.location && <Fact icon={MapPinIcon}>{event.location}</Fact>}
      </ul>
      <DialogDescription className="mt-4 text-base text-foreground">
        {event.description}
      </DialogDescription>
      <div className="mt-4 flex flex-wrap gap-2">
        {event.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-brand/10 px-2 py-1 text-xs text-primary"
          >
            {tag}
          </span>
        ))}
      </div>
      {((upcoming && event.rsvpLink) ||
        event.recording ||
        event.materials ||
        event.page) && (
        <div className="mt-5 flex flex-wrap gap-3">
          {upcoming && event.rsvpLink && (
            <Button asChild>
              <a
                href={event.rsvpLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                RSVP
                <ArrowRightIcon />
              </a>
            </Button>
          )}
          {event.recording && (
            <Button asChild variant="outline">
              <a
                href={event.recording}
                target="_blank"
                rel="noopener noreferrer"
              >
                <PlayCircleIcon />
                Watch the recording
              </a>
            </Button>
          )}
          {event.page && (
            <Button asChild variant="outline">
              <a href={event.page} target="_blank" rel="noopener noreferrer">
                <ExternalLinkIcon />
                Event page
              </a>
            </Button>
          )}
          {event.materials && (
            <Button asChild variant="outline">
              <a
                href={event.materials}
                target="_blank"
                rel="noopener noreferrer"
              >
                <CodeIcon />
                Workshop materials
              </a>
            </Button>
          )}
        </div>
      )}
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
