import { Link } from "react-router-dom";
import {
  ArrowRightIcon,
  BrainIcon,
  CalendarIcon,
  CodeIcon,
  UsersIcon,
} from "lucide-react";
import { Section, SectionHeader } from "@/components/brand/Section";
import { Button } from "@/components/ui/button";
import { allEvents, clubNumbers } from "@/lib/events";
import projectsData from "@/data/projects.json";

const pillars = [
  {
    icon: BrainIcon,
    title: "Learn AI",
    description:
      "Hands-on workshops and sessions covering machine learning fundamentals, deep learning, and the latest AI research.",
    to: "/events",
    cta: "Upcoming workshops",
  },
  {
    icon: CodeIcon,
    title: "Build Projects",
    description:
      "Collaborate on real AI and ML projects with fellow students, from idea to working prototype.",
    to: "/projects",
    cta: "See the projects",
  },
  {
    icon: UsersIcon,
    title: "Grow Your Network",
    description:
      "Connect with students, alumni, and industry professionals who share a passion for artificial intelligence.",
    to: "/contact",
    cta: "Find us online",
  },
  {
    icon: CalendarIcon,
    title: "Attend Events",
    description:
      "Workshops, hackathons, and social meetups throughout the academic year.",
    to: "/events",
    cta: "Browse events",
  },
];

/** Counted from the site's data, so each one can be checked. */
const numbers = (() => {
  const { events, since, workshops, withResources } = clubNumbers(allEvents);
  return [
    { value: events, label: `events since ${since}` },
    { value: workshops, label: "workshops" },
    { value: withResources, label: "with code or video online" },
    { value: projectsData.projects.length, label: "member projects" },
  ];
})();

/** The home page's "About CAIS" section, which /#about and /about land on. */
export function AboutSection() {
  return (
    <Section id="about" labelledBy="about-heading" className="scroll-mt-20">
      <SectionHeader
        id="about-heading"
        focusable
        label="About CAIS"
        title="What we do"
        lede="A student-run club at Carleton University for anyone curious about artificial intelligence and machine learning — from total beginners to seasoned researchers."
        action={
          <Button asChild variant="outline">
            <Link to="/team">
              Meet the team
              <ArrowRightIcon aria-hidden="true" />
            </Link>
          </Button>
        }
      />

      <ul className="grid gap-4 sm:grid-cols-2">
        {pillars.map(({ icon: Icon, title, description, to, cta }) => (
          <li
            key={title}
            className="group relative flex flex-col rounded-2xl border border-border bg-card p-6 transition-colors duration-150 hover:border-input has-[a:focus-visible]:outline-3 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-ring has-[a:focus-visible]:outline-solid"
          >
            <Icon aria-hidden="true" className="size-6 text-primary" />
            <h3 className="mt-4 text-xl">{title}</h3>
            <p className="mt-2 text-muted-foreground">{description}</p>
            <Link
              to={to}
              className="label-mono mt-5 inline-flex items-center gap-2 text-foreground after:absolute after:inset-0 focus-visible:outline-none"
            >
              {cta}
              <span className="sr-only">: {title}</span>
              <ArrowRightIcon
                aria-hidden="true"
                className="size-4 transition-transform duration-150 group-hover:translate-x-1"
              />
            </Link>
          </li>
        ))}
      </ul>

      <dl className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border lg:grid-cols-4">
        {numbers.map(({ value, label }) => (
          <div key={label} className="flex flex-col bg-background p-6">
            <dt className="label-mono order-2 mt-2 text-muted-foreground">
              {label}
            </dt>
            <dd className="font-display text-5xl tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
