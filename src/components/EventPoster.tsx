import { useState, type CSSProperties } from "react";
import { Maximize2Icon } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EventArt } from "@/components/events/EventArt";
import type { ClubEvent } from "@/lib/events";

/** Scale the enlarged poster grows from — roughly its size on the page. */
const ZOOM_FROM_SCALE = 0.45;

/**
 * Anchors the enlarge animation to the poster that was clicked, so it grows
 * out of the page and shrinks back into it. The lightbox is centred on the
 * viewport; moving its transform-origin (poster − centre) / (1 − s) off centre
 * puts its first frame, at scale s, right over the poster.
 */
const zoomFrom = (poster: HTMLElement) => {
  const { left, top, width, height } = poster.getBoundingClientRect();
  const offset = (centre: number, viewport: number) =>
    (centre - viewport / 2) / (1 - ZOOM_FROM_SCALE);
  const x = offset(left + width / 2, window.innerWidth);
  const y = offset(top + height / 2, window.innerHeight);

  return {
    transformOrigin: `calc(50% + ${x}px) calc(50% + ${y}px)`,
    "--tw-enter-scale": ZOOM_FROM_SCALE,
    "--tw-exit-scale": ZOOM_FROM_SCALE,
  } as CSSProperties;
};

type EventPosterProps = {
  event: ClubEvent;
};

/**
 * The poster on an event's page, whole and at its own aspect ratio. Clicking
 * it shows it alone over the page, as large as the screen allows. Events that
 * never had a poster get the generated cover instead, which does not open.
 */
export function EventPoster({ event }: EventPosterProps) {
  const [zoomOrigin, setZoomOrigin] = useState<CSSProperties>();
  const { poster, title } = event;

  if (!poster) {
    return (
      <div className="aspect-[4/5] overflow-hidden rounded-2xl border border-border">
        <EventArt event={event} />
      </div>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={`Enlarge poster for ${title}`}
          onClick={(e) => setZoomOrigin(zoomFrom(e.currentTarget))}
          className="group relative block w-full cursor-zoom-in overflow-hidden rounded-2xl border border-border"
        >
          <img
            src={poster}
            alt={`Poster for ${title}`}
            decoding="async"
            className="block h-auto w-full"
          />
          <span className="absolute right-3 top-3 rounded-full bg-background/80 p-2.5 text-foreground transition-colors group-hover:bg-background">
            <Maximize2Icon aria-hidden="true" className="size-4" />
          </span>
        </button>
      </DialogTrigger>

      <DialogContent
        overlayClassName="bg-background/70 backdrop-blur-none"
        showCloseButton={false}
        aria-describedby={undefined}
        style={zoomOrigin}
        className="w-auto max-w-none rounded-xl border-0 bg-transparent p-0 shadow-none duration-300 ease-out"
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogClose asChild>
          <button
            type="button"
            aria-label="Close poster"
            className="block cursor-zoom-out rounded-xl"
          >
            <img
              src={poster}
              alt={`Poster for ${title}`}
              className="block max-h-[90dvh] max-w-[94vw] rounded-xl shadow-2xl shadow-black/70"
            />
          </button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
