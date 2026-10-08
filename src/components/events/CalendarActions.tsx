import { useState } from "react";
import {
  CalendarPlusIcon,
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
  Rss,
  Share2Icon,
} from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { type ClubEvent, eventPath, formatWhen } from "@/lib/events";
import {
  FEED_PATH,
  SITE_URL,
  googleCalendarUrl,
  googleSubscribeUrl,
  icsPath,
  outlookCalendarUrl,
  webcalFeedUrl,
} from "@/lib/shared/ics.js";
import { cn } from "@/lib/utils";

const FEED_URL = `${SITE_URL}${FEED_PATH}`;

/** A full-width row in the calendar dialogs. */
function Choice({
  href,
  external = false,
  icon: Icon,
  title,
  detail,
}: {
  href: string;
  external?: boolean;
  icon: typeof DownloadIcon;
  title: string;
  detail: string;
}) {
  return (
    <li>
      <a
        href={href}
        {...(external && { target: "_blank", rel: "noopener noreferrer" })}
        className="flex min-h-14 items-center gap-4 rounded-xl border border-border px-4 py-3 transition-colors hover:border-input hover:bg-accent"
      >
        <Icon aria-hidden="true" className="size-5 shrink-0 text-primary" />
        <span className="flex flex-col">
          <span className="font-semibold">{title}</span>
          <span className="text-sm text-muted-foreground">{detail}</span>
        </span>
        {external && <span className="sr-only"> (opens in a new tab)</span>}
      </a>
    </li>
  );
}

/** Copies the feed URL, for calendar apps that ask for one. */
function CopyFeedUrl() {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <code className="min-w-0 flex-1 truncate rounded-lg border border-border bg-background px-3 py-2.5 font-mono text-sm">
        {FEED_URL}
      </code>
      <Button
        variant="outline"
        size="sm"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(FEED_URL);
            setCopied(true);
          } catch {
            setCopied(false);
          }
        }}
      >
        {copied ? (
          <CheckIcon aria-hidden="true" />
        ) : (
          <CopyIcon aria-hidden="true" />
        )}
        {copied ? "Copied" : "Copy link"}
      </Button>
      <span role="status" className="sr-only">
        {copied ? "Calendar link copied" : ""}
      </span>
    </div>
  );
}

function SubscribeChoices() {
  return (
    <>
      <ul className="space-y-2">
        <Choice
          href={webcalFeedUrl()}
          icon={Rss}
          title="Apple Calendar or Outlook"
          detail="Subscribe once; new events appear on their own"
        />
        <Choice
          href={googleSubscribeUrl()}
          external
          icon={ExternalLinkIcon}
          title="Google Calendar"
          detail="Adds the CAIS calendar to your Google account"
        />
      </ul>
      <p className="mt-4 text-sm text-muted-foreground">
        Any other app: subscribe by URL.
      </p>
      <div className="mt-2">
        <CopyFeedUrl />
      </div>
    </>
  );
}

/** "Subscribe to the calendar": every CAIS event in the visitor's own app. */
export function SubscribeButton({
  variant = "outline",
  className,
  label = "Subscribe to the calendar",
}: {
  variant?: ButtonProps["variant"];
  className?: string;
  label?: string;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={variant} className={className}>
          <Rss aria-hidden="true" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md">
        <DialogTitle className="pr-10 text-2xl">
          Never miss a CAIS event
        </DialogTitle>
        <DialogDescription className="mb-5 mt-2">
          Subscribe to our calendar and every workshop, talk and social shows up
          in yours, updated as we announce them.
        </DialogDescription>
        <SubscribeChoices />
      </DialogContent>
    </Dialog>
  );
}

/** Add one event to a calendar: a file for most apps, or Google/Outlook.com. */
export function AddToCalendarButton({
  event,
  variant = "outline",
  className,
}: {
  event: ClubEvent;
  variant?: ButtonProps["variant"];
  className?: string;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={variant} className={className}>
          <CalendarPlusIcon aria-hidden="true" />
          Add to calendar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto">
        <DialogTitle className="pr-10 text-2xl">
          Add to your calendar
        </DialogTitle>
        <DialogDescription className="mb-5 mt-2">
          {event.title}: {formatWhen(event, { year: true })}
        </DialogDescription>
        <ul className="space-y-2">
          <Choice
            href={icsPath(event)}
            icon={DownloadIcon}
            title="Apple Calendar, Outlook or other apps"
            detail="Downloads an .ics file with a reminder an hour before"
          />
          <Choice
            href={googleCalendarUrl(event)}
            external
            icon={ExternalLinkIcon}
            title="Google Calendar"
            detail="Opens Google Calendar with the event filled in"
          />
          <Choice
            href={outlookCalendarUrl(event)}
            external
            icon={ExternalLinkIcon}
            title="Outlook.com"
            detail="Opens Outlook on the web with the event filled in"
          />
        </ul>
        <div className="mt-6 border-t border-border pt-5">
          <p className="font-semibold">Want every event?</p>
          <p className="mb-3 text-sm text-muted-foreground">
            Subscribe once and new CAIS events land in your calendar on their
            own.
          </p>
          <SubscribeChoices />
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Shares the event's page: the phone's share sheet, or a copied link. */
export function ShareButton({
  event,
  variant = "outline",
  className,
}: {
  event: ClubEvent;
  variant?: ButtonProps["variant"];
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = `${window.location.origin}${eventPath(event)}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: `${event.title}: ${formatWhen(event)}`,
          url,
        });
      } catch {
        // Dismissed share sheets reject; nothing to do.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        className={cn(className)}
        onClick={share}
        aria-label={`Share ${event.title}`}
      >
        {copied ? (
          <CheckIcon aria-hidden="true" />
        ) : (
          <Share2Icon aria-hidden="true" />
        )}
        {copied ? "Link copied" : "Share"}
      </Button>
      <span role="status" className="sr-only">
        {copied ? "Link to the event copied" : ""}
      </span>
    </>
  );
}
