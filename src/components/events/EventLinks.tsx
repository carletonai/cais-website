import {
  ArrowUpRightIcon,
  CodeIcon,
  ExternalLinkIcon,
  FileTextIcon,
  NotebookPenIcon,
  PlayIcon,
} from "lucide-react";
import type { ElementType } from "react";
import { FaInstagram } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import {
  type ClubEvent,
  type ResourceLink,
  postLink,
  resourceLinks,
  rsvpFor,
} from "@/lib/events";
import { cn } from "@/lib/utils";

const ICONS: Record<ResourceLink["kind"], ElementType> = {
  materials: CodeIcon,
  recording: PlayIcon,
  page: ExternalLinkIcon,
  post: FaInstagram,
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

/**
 * Code, notebooks, recordings and event pages, labelled by where they go;
 * `withPost` adds the Instagram post it was announced in.
 */
export function ResourceLinks({
  event,
  withPost = false,
  className,
}: {
  event: ClubEvent;
  withPost?: boolean;
  className?: string;
}) {
  const post = withPost ? postLink(event) : null;
  const links = post ? [...resourceLinks(event), post] : resourceLinks(event);
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
