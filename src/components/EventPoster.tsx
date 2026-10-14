import { Maximize2Icon } from "lucide-react";
import { Lightbox } from "@/components/Lightbox";
import { EventArt } from "@/components/events/EventArt";
import type { ClubEvent } from "@/lib/events";

type EventPosterProps = {
  event: ClubEvent;
};

/**
 * The poster on an event's page, whole and at its own aspect ratio. Clicking
 * it shows it alone over the page, as large as the screen allows. Events that
 * never had a poster get the generated cover instead, which does not open.
 */
export function EventPoster({ event }: EventPosterProps) {
  const { poster, posterWidth, posterHeight, title } = event;

  if (!poster) {
    return (
      <div className="aspect-[4/5] overflow-hidden rounded-2xl border border-border">
        <EventArt event={event} />
      </div>
    );
  }

  return (
    <Lightbox
      src={poster}
      alt={`Poster for ${title}`}
      title={title}
      openLabel={`Enlarge poster for ${title}`}
      closeLabel="Close poster"
      className="rounded-2xl border border-border"
    >
      <img
        src={poster}
        alt={`Poster for ${title}`}
        width={posterWidth}
        height={posterHeight}
        fetchPriority="high"
        decoding="async"
        className="block h-auto w-full"
      />
      <span className="absolute right-3 top-3 rounded-full bg-background/80 p-2.5 text-foreground transition-colors group-hover:bg-background">
        <Maximize2Icon aria-hidden="true" className="size-4" />
      </span>
    </Lightbox>
  );
}
