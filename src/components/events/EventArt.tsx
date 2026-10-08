import { Ring } from "@/components/brand/Ring";
import type { ClubEvent } from "@/lib/events";
import { cn } from "@/lib/utils";

/** Longer titles step down a size so three lines always fit. */
const titleSize = (title: string) =>
  title.length <= 22
    ? "text-[1.6rem]"
    : title.length <= 44
      ? "text-[1.3rem]"
      : "text-[1.05rem]";

/**
 * A poster-style cover for the many events that never had a poster: dot grid,
 * red ring, uppercase title. Socials get the posters' cream variant. Costs no
 * bytes and repeats the card's own text, so it is hidden from assistive tech.
 */
export function EventArt({ event }: { event: ClubEvent }) {
  const paper = event.type === "Social";
  return (
    <div
      aria-hidden="true"
      data-surface={paper ? "paper" : undefined}
      className="relative size-full overflow-hidden bg-background bg-dots"
    >
      <Ring className="absolute -right-8 -top-8 w-28" />
      <div className="absolute inset-x-0 bottom-0 p-4 pr-6">
        <p className="label-mono text-[0.625rem] text-muted-foreground">
          {event.type}
        </p>
        <p
          className={cn(
            "font-display mt-1 line-clamp-3 leading-[0.95] text-foreground",
            titleSize(event.title),
          )}
        >
          {event.title}
        </p>
      </div>
    </div>
  );
}

/** A portrait poster inside a landscape frame: contained, over a blurred copy
 *  of itself that fills the spare width. */
export function PosterThumb({ poster }: { poster: string }) {
  return (
    <div className="relative size-full overflow-hidden bg-background">
      <img
        src={poster}
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 size-full scale-110 object-cover opacity-40 blur-xl"
      />
      <img
        src={poster}
        alt=""
        loading="lazy"
        decoding="async"
        className="relative mx-auto h-full w-auto object-contain"
      />
    </div>
  );
}

/** The 16:9 artwork at the top of an event card. */
export function EventCover({ event }: { event: ClubEvent }) {
  return (
    <div className="aspect-video overflow-hidden">
      {event.poster ? (
        <PosterThumb poster={event.poster} />
      ) : (
        <EventArt event={event} />
      )}
    </div>
  );
}
