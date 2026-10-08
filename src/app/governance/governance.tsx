import { Link } from "react-router-dom";
import { PageHeader } from "@/components/brand/PageHeader";
import { Section, SectionHeader } from "@/components/brand/Section";
import {
  ArrowRightIcon,
  FileTextIcon,
  HistoryIcon,
  UsersIcon,
} from "lucide-react";

const ROLES = [
  {
    title: "President",
    description:
      "Leads the club overall, chairs executive meetings, represents CAIS to the university and external partners, and ensures the team is aligned on goals.",
  },
  {
    title: "VP Academics",
    description:
      "Plans and delivers educational workshops and learning sessions, curates academic resources, and manages partnerships with faculty and other academic clubs.",
  },
  {
    title: "VP Community",
    description:
      "Fosters an inclusive and welcoming environment, manages social media and member communications, and runs engagement initiatives across campus.",
  },
  {
    title: "VP Events",
    description:
      "Organizes and coordinates all club events — from booking rooms and arranging speakers to day-of logistics and post-event follow-up.",
  },
  {
    title: "VP Finance",
    description:
      "Manages the club budget, applies for university and external funding, tracks expenses, and ensures financial transparency and compliance.",
  },
  {
    title: "VP Projects/Technology",
    description:
      "Leads student-run AI and ML projects, oversees the club's technical infrastructure including the website, and mentors members on technical skills.",
  },
];

/** The Team tab lands here, so the rest of the tab is one click away. */
const SECTIONS = [
  {
    icon: UsersIcon,
    title: "Current Team",
    description: "Meet this year's executive team.",
    to: "/team",
  },
  {
    icon: HistoryIcon,
    title: "Past Teams",
    description: "The executives who led CAIS in previous years.",
    to: "/team/past",
  },
  {
    icon: FileTextIcon,
    title: "Constitution",
    description: "The document that sets out how the club is run (PDF).",
    href: "/constitution.pdf",
  },
];

const Governance = () => (
  <>
    <PageHeader
      label="Team / Governance"
      title="Governance"
      lede="CAIS is led by a six-person executive team, each responsible for a key area of the club."
    >
      <nav
        aria-label="Team pages"
        className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        {SECTIONS.map(({ icon: Icon, title, description, to, href }) => {
          const body = (
            <>
              <span className="flex items-center gap-2 font-semibold text-foreground">
                <Icon aria-hidden="true" className="size-5 text-primary" />
                {title}
                <ArrowRightIcon
                  aria-hidden="true"
                  className="ml-auto size-4 transition-transform group-hover:translate-x-1"
                />
              </span>
              <span className="mt-2 block text-sm text-muted-foreground">
                {description}
              </span>
            </>
          );
          const className =
            "group block rounded-2xl border border-border bg-card p-5 transition-colors hover:border-input";

          return to ? (
            <Link key={title} to={to} className={className}>
              {body}
            </Link>
          ) : (
            <a key={title} href={href} className={className}>
              {body}
            </a>
          );
        })}
      </nav>
    </PageHeader>

    <Section labelledBy="roles-heading">
      <SectionHeader
        id="roles-heading"
        label="Club structure"
        title="Executive roles"
      />
      <ol className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {ROLES.map(({ title, description }, i) => (
          <li
            key={title}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <p
              aria-hidden="true"
              className="font-mono text-sm text-muted-foreground"
            >
              {String(i + 1).padStart(2, "0")}
            </p>
            <h3 className="mt-2 text-xl">{title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </li>
        ))}
      </ol>
    </Section>
  </>
);

export default Governance;
