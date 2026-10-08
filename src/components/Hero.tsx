import { Link } from "react-router-dom";
import { FaDiscord } from "react-icons/fa";
import { ArrowRightIcon } from "lucide-react";
import { Ring } from "@/components/brand/Ring";
import { NextUp } from "@/components/events/NextUp";
import { Button } from "@/components/ui/button";
import { clubNumbers } from "@/lib/events";
import { DISCORD_URL, SOCIAL_LINKS } from "@/lib/links";

const { since } = clubNumbers();

/**
 * The first screen answers the two questions students arrive with: what is
 * this club, and what is on next. Styled after the club's posters.
 */
export default function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative overflow-hidden border-b border-border bg-dots"
    >
      {/* Only where the layout leaves room: text never crosses the ring. */}
      <Ring
        draw
        className="absolute -right-24 -top-24 hidden w-[34rem] lg:block"
      />
      <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-4 pb-14 pt-10 sm:px-6 sm:pt-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-12 lg:pb-24 lg:pt-20">
        <div>
          <p className="label-mono text-muted-foreground">
            Carleton University <span aria-hidden="true">·</span> Since {since}
          </p>
          <h1 id="hero-title" className="font-display mt-5 text-display">
            <span className="block">Carleton</span>
            <span className="block">
              <span className="text-primary">AI</span> Society
            </span>
          </h1>
          <p className="mt-6 max-w-[34ch] text-lg text-muted-foreground sm:text-xl">
            A student club for anyone interested in AI and machine learning.
            Join us to learn, build projects, and meet others who share your
            interests.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="sm:h-12 sm:px-7 sm:text-base">
              <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer">
                <FaDiscord aria-hidden="true" />
                Join the Discord
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="sm:h-12 sm:px-7 sm:text-base"
            >
              <Link to="/events">
                See all events
                <ArrowRightIcon aria-hidden="true" />
              </Link>
            </Button>
          </div>
          {/* On phones the footer carries these; the ticket matters more. */}
          <ul
            className="mt-8 hidden flex-wrap gap-1 sm:flex"
            aria-label="CAIS elsewhere"
          >
            {SOCIAL_LINKS.filter(({ label }) =>
              ["Instagram", "LinkedIn", "YouTube", "GitHub"].includes(label),
            ).map(({ label, url, icon: Icon }) => (
              <li key={label}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Icon aria-hidden="true" className="size-5" />
                  <span className="sr-only">
                    CAIS on {label} (opens in a new tab)
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
        <NextUp ring={false} />
      </div>
    </section>
  );
}
