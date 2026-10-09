import {
  ArrowUpRightIcon,
  CodeIcon,
  ExternalLinkIcon,
  FileTextIcon,
  NotebookPenIcon,
  PlayIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type ClubEvent,
  type ResourceLink,
  resourceLinks,
  rsvpFor,
} from "@/lib/events";
import { cn } from "@/lib/utils";

const ICONS: Record<ResourceLink["kind"], typeof CodeIcon> = {
  materials: CodeIcon,
  recording: PlayIcon,
  page: ExternalLinkIcon,
};

export function RsvpButton({
  event,
  now,
  className,
}: {
  event: ClubEvent;
  now: Date;
  className?: string;
}) {
  const rsvp = rsvpFor(event, now);
  if (!rsvp) return null;
  return (
    <Button asChild className={className}>
      <a href={rsvp.href} target="_blank" rel="noopener noreferrer">
        {rsvp.label}
        <ArrowUpRightIcon aria-hidden="true" />
        <span className="sr-only"> for {event.title} (opens in a new tab)</span>
      </a>
    </Button>
  );
}

/** Code, notebooks, recordings and event pages, labelled by where they go. */
export function ResourceLinks({
  event,
  className,
}: {
  event: ClubEvent;
  className?: string;
}) {
  const links = resourceLinks(event);
  if (links.length === 0) return null;
  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {links.map((link) => {
        const Icon =
          link.label === "Notebook on Kaggle"
            ? NotebookPenIcon
            : link.label === "Slides (PDF)"
              ? FileTextIcon
              : ICONS[link.kind];
        return (
          <li key={link.kind}>
            <Button asChild variant="outline" size="sm">
              <a href={link.href} target="_blank" rel="noopener noreferrer">
                <Icon aria-hidden="true" />
                {link.label}
                <span className="sr-only">
                  {" "}
                  for {event.title} (opens in a new tab)
                </span>
              </a>
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
