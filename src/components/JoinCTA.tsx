import { FaDiscord, FaInstagram } from "react-icons/fa";
import { Section } from "@/components/brand/Section";
import { Ring } from "@/components/brand/Ring";
import { Button } from "@/components/ui/button";
import { DISCORD_URL, INSTAGRAM_URL } from "@/lib/links";

const steps = [
  {
    title: "Join the Discord",
    detail: "Where events are announced first and questions get answered.",
  },
  {
    title: "Follow @carletonaisociety",
    detail: "Every event gets a poster on Instagram.",
  },
  {
    title: "Come to an event",
    detail: "All years are welcome, and no experience is needed.",
  },
];

/** How to join, on the posters' cream ground. */
export function JoinCTA() {
  return (
    <Section
      surface="paper"
      labelledBy="join-heading"
      className="overflow-hidden"
    >
      <Ring className="absolute -bottom-40 -right-32 hidden w-[28rem] md:block" />
      <div className="relative grid gap-10 md:grid-cols-[1fr_1fr] md:pr-40 lg:pr-56">
        <div>
          <p className="label-mono text-primary">Get involved</p>
          <h2 id="join-heading" className="font-display mt-3 text-title">
            Join CAIS
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            There is no form and no fee. Three steps and you are in.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer">
                <FaDiscord aria-hidden="true" />
                Join the Discord
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
                <FaInstagram aria-hidden="true" />
                Follow on Instagram
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </Button>
          </div>
        </div>
        <ol className="space-y-6">
          {steps.map(({ title, detail }, i) => (
            <li
              key={title}
              // Each step draws the line down to the next one's bullet.
              className="relative flex gap-5 [&:not(:last-child)]:before:absolute [&:not(:last-child)]:before:-bottom-6 [&:not(:last-child)]:before:left-[15px] [&:not(:last-child)]:before:top-[33px] [&:not(:last-child)]:before:w-[3px] [&:not(:last-child)]:before:bg-circuit"
            >
              <span
                aria-hidden="true"
                className="relative flex size-[33px] shrink-0 items-center justify-center rounded-full border-4 border-mark bg-background font-mono text-sm font-medium"
              >
                {i + 1}
              </span>
              <div className="pt-0.5">
                <h3 className="text-lg">{title}</h3>
                <p className="mt-1 text-muted-foreground">{detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
