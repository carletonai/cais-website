import { Lightbox } from "@/components/Lightbox";
import { type ClubEvent, posterThumb } from "@/lib/events";
import { cn } from "@/lib/utils";

/**
 * Pictures from the event, under its page: a grid of the 600px copies, each
 * opening at full size over the page.
 */
export function EventPhotos({
  event,
  className,
}: {
  event: ClubEvent;
  className?: string;
}) {
  const photos = event.photos ?? [];
  if (photos.length === 0) return null;

  return (
    <section
      aria-labelledby="event-photos"
      className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", className)}
    >
      <h2 id="event-photos" className="text-3xl">
        Photos
      </h2>
      <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((photo, i) => (
          <li key={photo.src}>
            <Lightbox
              src={photo.src}
              alt={photo.alt}
              title={`${event.title}, photo ${i + 1} of ${photos.length}`}
              openLabel={`Enlarge photo: ${photo.alt}`}
              closeLabel="Close photo"
              fromScale={0.3}
              className="rounded-xl border border-border"
            >
              <img
                src={posterThumb(photo.src)}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                loading="lazy"
                decoding="async"
                className="block aspect-[4/3] h-auto w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
              />
            </Lightbox>
          </li>
        ))}
      </ul>
    </section>
  );
}
