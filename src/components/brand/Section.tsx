import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionProps = {
  id?: string;
  /** Becomes the section's accessible name via its heading. */
  labelledBy?: string;
  className?: string;
  /** "paper" turns the band cream, like the posters' light variant. */
  surface?: "ink" | "paper";
  children: ReactNode;
};

/** A full-width band with the site's horizontal rhythm. */
export function Section({
  id,
  labelledBy,
  className,
  surface = "ink",
  children,
}: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      data-surface={surface === "paper" ? "paper" : undefined}
      className={cn("relative py-16 sm:py-20", className)}
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">{children}</div>
    </section>
  );
}

type SectionHeaderProps = {
  id: string;
  /** The mono eyebrow above the heading, e.g. "COMING UP". */
  label?: string;
  title: ReactNode;
  lede?: ReactNode;
  /** A link or button pinned to the right on wide screens. */
  action?: ReactNode;
  /** Lets a section's heading take focus, e.g. after a /#about link. */
  focusable?: boolean;
  as?: "h1" | "h2";
};

export function SectionHeader({
  id,
  label,
  title,
  lede,
  action,
  focusable = false,
  as: Heading = "h2",
}: SectionHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {label && <p className="label-mono mb-3 text-primary">{label}</p>}
        <Heading
          id={id}
          tabIndex={focusable ? -1 : undefined}
          className="text-3xl leading-tight sm:text-4xl"
        >
          {title}
        </Heading>
        {lede && <p className="mt-3 text-muted-foreground">{lede}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
