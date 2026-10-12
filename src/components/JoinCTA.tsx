import { FaDiscord, FaInstagram } from "react-icons/fa";
import { Section } from "@/components/brand/Section";
import { Ring } from "@/components/brand/Ring";
import { DiscordPresence } from "@/components/DiscordPresence";
import { NewsletterForm } from "@/components/NewsletterForm";
import { Button } from "@/components/ui/button";
import { DISCORD_URL, INSTAGRAM_URL, NEWSLETTER_USERNAME } from "@/lib/links";

const discord = {
  title: "Join the Discord",
  detail:
    "The club’s chat: meet other members and ask the exec team questions.",
};
const instagram = {
  title: "Follow @carletonaisociety",
  detail: "Event posters and announcements go up on Instagram.",
};
const newsletter = {
  title: "Get email updates",
  detail: "A few emails a year: the term’s first workshop and the big events.",
};
const attend = {
  title: "Come to an event",
  detail:
    "Workshops, talks and socials, for total beginners and seasoned researchers alike.",
};

const steps = NEWSLETTER_USERNAME
  ? [discord, instagram, newsletter, attend]
  : [discord, instagram, attend];

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
          <p className="label-mono text-primary">Join the community</p>
          <h2 id="join-heading" className="font-display mt-3 text-title">
            Get involved
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {steps.length === 4 ? "Four" : "Three"} ways to get started.
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
          <DiscordPresence className="mt-4" />
          {NEWSLETTER_USERNAME && (
            <NewsletterForm username={NEWSLETTER_USERNAME} className="mt-10" />
          )}
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
