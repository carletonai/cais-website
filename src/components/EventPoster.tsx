import { Maximize2Icon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

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
 * click-to-enlarge.
 */
export function EventPoster({
  image,
  poster,
  title,
  zoomOnHover = false,
}: EventPosterProps) {
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

      <DialogContent className="max-w-3xl bg-transparent p-0 shadow-none">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <img
          src={poster}
          alt={`Poster for ${title}`}
          className="mx-auto max-h-[85vh] w-auto rounded-xl"
        />
      </DialogContent>
    </Dialog>
  );
}
