import { useState, type CSSProperties } from "react";
import { Maximize2Icon } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/** Scale the enlarged poster grows from — roughly its size on the card. */
const ZOOM_FROM_SCALE = 0.35;

/**
 * Anchors the enlarge animation to the card that was clicked, so the poster
 * grows out of the card and shrinks back into it. The lightbox is centred on
 * the viewport; moving its transform-origin (card − centre) / (1 − s) off
 * centre puts its first frame, at scale s, right over the card.
 */
const zoomFrom = (card: HTMLElement) => {
  const { left, top, width, height } = card.getBoundingClientRect();
  const offset = (cardCentre: number, viewport: number) =>
    (cardCentre - viewport / 2) / (1 - ZOOM_FROM_SCALE);
  const x = offset(left + width / 2, window.innerWidth);
  const y = offset(top + height / 2, window.innerHeight);

  return {
    transformOrigin: `calc(50% + ${x}px) calc(50% + ${y}px)`,
    "--tw-enter-scale": ZOOM_FROM_SCALE,
    "--tw-exit-scale": ZOOM_FROM_SCALE,
  } as CSSProperties;
};

type EventPosterProps = {
  /** Fallback artwork, used whenever the event has no real poster. */
  image: string;
  /** A real poster for the event. Its presence is what makes the card open. */
  poster?: string;
  title: string;
  /** Upcoming cards zoom their artwork on hover; past cards sit still. */
  zoomOnHover?: boolean;
};

/**
 * The 16:9 artwork at the top of an event card.
 *
 * Posters are portrait, so filling the card would crop away the title and the
 * date — they are contained instead, over a blurred copy of themselves that
 * fills the leftover width. Containing them makes them small, hence the
 * click-to-enlarge: the poster alone, over the page as it was, with no frame
 * or dimmed backdrop around it.
 */
export function EventPoster({
  image,
  poster,
  title,
  zoomOnHover = false,
}: EventPosterProps) {
  const [zoomOrigin, setZoomOrigin] = useState<CSSProperties>();

  if (!poster) {
    return (
      <div className="aspect-video relative overflow-hidden">
        <div
          className={cn(
            "absolute inset-0 bg-cover bg-center",
            zoomOnHover &&
              "transform group-hover:scale-110 transition-transform duration-500",
          )}
          style={{ backgroundImage: `url(${image})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
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
          className="aspect-video relative block w-full cursor-zoom-in overflow-hidden focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 scale-110 bg-cover bg-center opacity-40 blur-xl"
            style={{ backgroundImage: `url(${poster})` }}
          />
          <div
            className={cn(
              "absolute inset-0 bg-contain bg-center bg-no-repeat",
              zoomOnHover &&
                "transform group-hover:scale-105 transition-transform duration-500",
            )}
            style={{ backgroundImage: `url(${poster})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
          <span className="absolute right-3 top-3 rounded-full bg-background/70 p-2 text-primary opacity-80 transition-opacity group-hover:opacity-100">
            <Maximize2Icon className="h-4 w-4" />
          </span>
        </button>
      </DialogTrigger>

      <DialogContent
        overlayClassName="bg-transparent backdrop-blur-none"
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
            className="block cursor-zoom-out rounded-xl focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <img
              src={poster}
              alt={`Poster for ${title}`}
              className="block max-h-[85dvh] max-w-[92vw] rounded-xl shadow-2xl shadow-black/70"
            />
          </button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
