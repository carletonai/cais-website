import { Link } from "react-router-dom";
import { ChevronDownIcon } from "lucide-react";
import { FaDiscord } from "react-icons/fa";
import { PageHeader } from "@/components/brand/PageHeader";
import { Section, SectionHeader } from "@/components/brand/Section";
import { SubscribeButton } from "@/components/events/CalendarActions";
import { ResourceLinks, RsvpButton } from "@/components/events/EventLinks";
import { Button } from "@/components/ui/button";
import {
  type Module,
  type Series,
  allSeries,
  moduleState,
  standaloneWorkshops,
} from "@/lib/curriculum";
import {
  type ClubEvent,
  eventPath,
  formatShortDate,
  formatWhen,
  resourceLinks,
} from "@/lib/events";
import { DISCORD_URL } from "@/lib/links";
import { useNow } from "@/lib/useNow";
import { cn } from "@/lib/utils";

const hasMaterials = (event?: ClubEvent) =>
  event !== undefined && resourceLinks(event).length > 0;

const count = (n: number, word: string) =>
  `${n} ${n === 1 ? word : `${word}s`}`;

/** One session: its number, when it ran or runs, what it covers, its links. */
function ModuleItem({
  module,
  now,
  headingLevel: Heading,
}: {
  module: Module;
  now: Date;
  headingLevel: "h3" | "h4";
}) {
  const state = moduleState(module, now);
  const event = module.event;
  return (
    <li
      // Each session draws the line down to the next one's number.
      className="relative flex gap-5 [&:not(:last-child)]:before:absolute [&:not(:last-child)]:before:bottom-0 [&:not(:last-child)]:before:left-[15px] [&:not(:last-child)]:before:top-[33px] [&:not(:last-child)]:before:w-[3px] [&:not(:last-child)]:before:bg-circuit"
    >
      <span
        aria-hidden="true"
        className={cn(
          "relative flex size-[33px] shrink-0 items-center justify-center rounded-full border-4 bg-background font-mono text-sm font-medium",
          state === "planned" ? "border-circuit" : "border-mark",
        )}
      >
        {module.number}
      </span>
      <div className="min-w-0 flex-1 pb-9">
        <p className="label-mono text-muted-foreground">
          {state === "done" && event && (
            <time dateTime={event.date}>{formatShortDate(event.date)}</time>
          )}
          {state === "scheduled" && event && (
            <>
              <span className="text-primary">Coming up</span> ·{" "}
              <time dateTime={event.date}>{formatWhen(event)}</time>
              {event.location && <> · {event.location}</>}
            </>
          )}
          {state === "planned" && "Date to be announced"}
        </p>
        <Heading className="mt-1.5 text-xl leading-snug">
          {event ? (
            <Link
              to={eventPath(event)}
              className="hover:underline hover:decoration-2 hover:underline-offset-4"
            >
              {module.title}
            </Link>
          ) : (
            module.title
          )}
        </Heading>
        <p className="mt-2 text-muted-foreground">{module.blurb}</p>
        {event && (
          <div className="mt-4 flex flex-wrap gap-2 empty:hidden">
            <RsvpButton event={event} now={now} />
            <ResourceLinks event={event} />
          </div>
        )}
      </div>
    </li>
  );
}

function ModuleList({
  series,
  now,
  headingLevel,
}: {
  series: Series;
  now: Date;
  headingLevel: "h3" | "h4";
}) {
  return (
    <ol className="-mb-9">
      {series.modules.map((module) => (
        <ModuleItem
          key={module.number}
          module={module}
          now={now}
          headingLevel={headingLevel}
        />
      ))}
    </ol>
  );
}

const WorkshopsPage = () => {
  const now = useNow();
  const [current, ...earlier] = allSeries;
  const modules = allSeries.flatMap((series) => series.modules);
  const workshops = modules.length + standaloneWorkshops.events.length;
  const online =
    modules.filter((module) => hasMaterials(module.event)).length +
    standaloneWorkshops.events.filter(hasMaterials).length;

  return (
    <>
      <PageHeader
        label="Workshops"
        title="Workshop curriculum"
        lede="Every workshop series the club has run, in the order to take it, with the slides, code and recordings that are online. Start at the top of this term's series; the earlier ones still hold up."
      >
        <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
          {[
            [allSeries.length, "Series"],
            [workshops, "Workshops"],
            [online, "With materials online"],
          ].map(([value, label]) => (
            <div key={label}>
              <dt className="label-mono text-muted-foreground">{label}</dt>
              <dd className="mt-1 font-heading text-3xl font-bold">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-8 flex flex-wrap gap-3">
          <SubscribeButton variant="default" />
          <Button asChild variant="outline">
            <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer">
              <FaDiscord aria-hidden="true" />
              Ask on Discord
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </Button>
        </div>
      </PageHeader>

      <Section labelledBy="current-series-heading">
        <SectionHeader
          id="current-series-heading"
          label={`This term · ${current.season}`}
          title={current.title}
          lede={current.lede}
        />
        <div className="grid gap-10 md:grid-cols-[1fr_minmax(16rem,20rem)] md:gap-16">
          <ModuleList series={current} now={now} headingLevel="h3" />
          <aside
            aria-labelledby="follow-along-heading"
            className="h-fit rounded-2xl border border-border bg-card p-6 md:sticky md:top-24"
          >
            <h3 id="follow-along-heading" className="text-lg">
              How to follow along
            </h3>
            <p className="mt-3 text-sm text-muted-foreground">
              Workshops are free and open to every Carleton student, whatever
              you study. Come in person (each session’s page has the room), or
              work through the materials at your own pace.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Each one is announced on Instagram and the calendar a week or two
              ahead. Subscribe to the calendar so none slip past.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <SubscribeButton className="w-full" />
              <Button asChild variant="outline" className="w-full">
                <Link to="/events">All events</Link>
              </Button>
            </div>
          </aside>
        </div>
      </Section>

      <Section
        id="earlier-series"
        labelledBy="earlier-heading"
        className="border-t border-border"
      >
        <SectionHeader
          id="earlier-heading"
          label="Since 2020"
          title="Earlier series"
          lede="Each series stands on its own, and the notebooks and recordings still work. Pick the one that matches where you are."
        />
        <div className="space-y-3">
          {earlier.map((series, index) => {
            const online = series.modules.filter((module) =>
              hasMaterials(module.event),
            ).length;
            return (
              <details
                key={series.id}
                id={series.id}
                open={index === 0}
                className="group rounded-2xl border border-border bg-card"
              >
                <summary
                  aria-label={`${series.title}, ${series.season}, ${count(series.modules.length, "session")}`}
                  className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-5 py-4 [&::-webkit-details-marker]:hidden"
                >
                  <span className="min-w-0">
                    <span className="label-mono block text-muted-foreground">
                      {series.season}
                    </span>
                    <span className="mt-1 block font-heading text-xl font-bold">
                      {series.title}
                    </span>
                    <span className="label-mono mt-1 block text-[0.625rem] text-muted-foreground">
                      {count(series.modules.length, "session")}
                      {online > 0 && <> · {online} with materials online</>}
                    </span>
                  </span>
                  <ChevronDownIcon
                    aria-hidden="true"
                    className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                  />
                </summary>
                <div className="border-t border-border px-5 pb-6 pt-5">
                  <p className="mb-8 text-muted-foreground">{series.lede}</p>
                  <ModuleList series={series} now={now} headingLevel="h4" />
                </div>
              </details>
            );
          })}
        </div>
      </Section>

      <Section labelledBy="standalone-heading" surface="paper">
        <SectionHeader
          id="standalone-heading"
          label="Outside a series"
          title={standaloneWorkshops.title}
          lede={standaloneWorkshops.lede}
        />
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {standaloneWorkshops.events.map((event) => (
            <li
              key={event.id}
              className="grid gap-x-6 gap-y-2 px-5 py-4 sm:grid-cols-[7.5rem_1fr_auto] sm:items-center"
            >
              <time
                dateTime={event.date}
                className="font-mono text-xs text-muted-foreground sm:text-sm"
              >
                {formatShortDate(event.date)}
              </time>
              <span className="min-w-0">
                <Link
                  to={eventPath(event)}
                  className="font-medium hover:underline hover:decoration-2 hover:underline-offset-4"
                >
                  {event.title}
                </Link>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {event.description}
                </span>
              </span>
              <ResourceLinks event={event} className="sm:justify-end" />
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
};

export default WorkshopsPage;
