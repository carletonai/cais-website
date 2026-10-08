import { cn } from "@/lib/utils";

type RingProps = {
  className?: string;
  /** Draw the ring in once on load (skipped with reduced motion). */
  draw?: boolean;
  /** Stroke as a share of the ring's size; the posters use a thick band. */
  thickness?: number;
};

/** The posters' big red ring. Purely decorative. */
export function Ring({ className, draw = false, thickness = 11 }: RingProps) {
  const r = 50 - thickness / 2;
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 100 100"
      className={cn("pointer-events-none", className)}
    >
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="var(--color-mark)"
        strokeWidth={thickness}
        pathLength={1}
        transform="rotate(-90 50 50)"
        className={draw ? "ring-draw" : undefined}
      />
    </svg>
  );
}
