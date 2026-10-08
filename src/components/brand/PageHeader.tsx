import type { ReactNode } from "react";
import { Ring } from "./Ring";

type PageHeaderProps = {
  /** The mono trail above the title: "EVENTS", "TEAM / PAST TEAMS". */
  label: string;
  title: ReactNode;
  lede?: ReactNode;
  children?: ReactNode;
};

/**
 * The top of every inner page, in the posters' language: dot grid, a cropped
 * red ring and a tight uppercase headline. Text never sits on the ring.
 */
export function PageHeader({ label, title, lede, children }: PageHeaderProps) {
  return (
    <header className="relative overflow-hidden border-b border-border bg-dots">
      <Ring
        draw
        className="absolute -right-20 -top-32 w-48 lg:-right-16 lg:-top-40 lg:w-[26rem]"
      />
      <div className="relative mx-auto w-full max-w-6xl px-4 pb-12 pt-14 sm:px-6 sm:pb-16 sm:pt-20">
        <p className="label-mono mb-4 text-muted-foreground">
          Carleton AI Society <span aria-hidden="true">/</span>{" "}
          <span className="text-primary">{label}</span>
        </p>
        <h1 className="font-display max-w-[14ch] text-title">{title}</h1>
        {lede && <p className="mt-5 text-lg text-muted-foreground">{lede}</p>}
        {children}
      </div>
    </header>
  );
}
