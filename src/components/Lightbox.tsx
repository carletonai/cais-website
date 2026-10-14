import { useState, type CSSProperties, type ReactNode } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * Anchors the enlarge animation to the picture that was clicked, so it grows
 * out of the page and shrinks back into it. The lightbox is centred on the
 * viewport; moving its transform-origin (picture − centre) / (1 − s) off
 * centre puts its first frame, at scale s, right over the picture.
 */
const zoomFrom = (picture: HTMLElement, scale: number) => {
  const { left, top, width, height } = picture.getBoundingClientRect();
  const offset = (centre: number, viewport: number) =>
    (centre - viewport / 2) / (1 - scale);
  const x = offset(left + width / 2, window.innerWidth);
  const y = offset(top + height / 2, window.innerHeight);

  return {
    transformOrigin: `calc(50% + ${x}px) calc(50% + ${y}px)`,
    "--tw-enter-scale": scale,
    "--tw-exit-scale": scale,
  } as CSSProperties;
};

type LightboxProps = {
  /** The full-size image shown over the page. */
  src: string;
  alt: string;
  /** Names the dialog for screen readers. */
  title: string;
  openLabel: string;
  closeLabel: string;
  /** Scale the enlarged image grows from: roughly its size on the page. */
  fromScale?: number;
  className?: string;
  /** What sits on the page: the picture people click. */
  children: ReactNode;
};

/**
 * A picture on the page that, clicked, shows alone over it as large as the
 * screen allows; clicking it again puts it back.
 */
export function Lightbox({
  src,
  alt,
  title,
  openLabel,
  closeLabel,
  fromScale = 0.45,
  className,
  children,
}: LightboxProps) {
  const [zoomOrigin, setZoomOrigin] = useState<CSSProperties>();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={openLabel}
          onClick={(e) => setZoomOrigin(zoomFrom(e.currentTarget, fromScale))}
          className={cn(
            "group relative block w-full cursor-zoom-in overflow-hidden",
            className,
          )}
        >
          {children}
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
            aria-label={closeLabel}
            className="block cursor-zoom-out rounded-xl"
          >
            <img
              src={src}
              alt={alt}
              className="block max-h-[90dvh] max-w-[94vw] rounded-xl shadow-2xl shadow-black/70"
            />
          </button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
