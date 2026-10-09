import { Link } from "react-router-dom";
import { ArrowRightIcon, ExternalLinkIcon } from "lucide-react";
import { PageHeader } from "@/components/brand/PageHeader";
import { Section, SectionHeader } from "@/components/brand/Section";
import { Button } from "@/components/ui/button";
import projectsData from "@/data/projects.json";
import { DISCORD_URL } from "@/lib/links";

interface Project {
  id?: string;
  title: string;
  status?: string;
  /** When it ran, e.g. "Fall 2019". */
  period?: string;
  /** Set for projects built at a CAIS hackathon, naming which one. */
  hackathon?: string;
  description: string;
  link?: string;
  tags?: string[];
}

const projects = projectsData.projects as Project[];

const SECTIONS = [
  {
    id: "club-projects",
    title: "Club projects",
    description: "Built by CAIS members, from our first year to now.",
    projects: projects.filter((project) => !project.hackathon),
  },
  {
    id: "hackathon-projects",
    title: "Built at CAIS hackathons",
    description: "Winning projects from the hackathons we have hosted.",
    projects: projects.filter((project) => project.hackathon),
  },
].filter((section) => section.projects.length > 0);

const linkClass =
  "label-mono relative z-10 mt-auto inline-flex min-h-11 items-center gap-2 text-foreground hover:text-primary";

const ProjectCard = ({ project }: { project: Project }) => (
  <li className="group flex flex-col rounded-2xl border border-border bg-card p-6 transition-colors duration-150 hover:border-input">
    {(project.status || project.period) && (
      <p className="label-mono mb-4 flex flex-wrap items-center gap-x-2 text-muted-foreground">
        {project.status && (
          <span className="text-primary">
            {project.hackathon
              ? `${project.hackathon} · ${project.status}`
              : project.status}
          </span>
        )}
        {project.status && project.period && <span aria-hidden="true">·</span>}
        {project.period && <span>{project.period}</span>}
      </p>
    )}
    <h3 className="mb-2 text-xl">{project.title}</h3>
    <p className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground">
      {project.description}
    </p>
    {project.tags && project.tags.length > 0 && (
      <ul aria-label="Built with" className="mb-5 flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <li
            key={tag}
            className="rounded-full border border-border px-2.5 py-1 font-mono text-xs text-muted-foreground"
          >
            {tag}
          </li>
        ))}
      </ul>
    )}
    {project.link?.startsWith("/") ? (
      <Link to={project.link} className={linkClass}>
        View project <span className="sr-only">: {project.title}</span>
        <ArrowRightIcon aria-hidden="true" className="size-4" />
      </Link>
    ) : (
      project.link && (
        <a
          href={project.link}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          View project
          <span className="sr-only">
            : {project.title} (opens in a new tab)
          </span>
          <ExternalLinkIcon aria-hidden="true" className="size-4" />
        </a>
      )
    )}
  </li>
);

const ProjectsPage = () => (
  <>
    <PageHeader
      label="Projects"
      title="Projects"
      lede="AI and machine learning projects from CAIS: club projects, and winning entries from the hackathons we have hosted."
    />
    {SECTIONS.length > 0 ? (
      SECTIONS.map((section, index) => (
        <Section
          key={section.id}
          labelledBy={section.id}
          className={index > 0 ? "border-t border-border" : undefined}
        >
          <SectionHeader
            id={section.id}
            label={index === 0 ? "What we build" : "Hackathons"}
            title={section.title}
            lede={section.description}
          />
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {section.projects.map((project) => (
              <ProjectCard
                key={project.id ?? project.title}
                project={project}
              />
            ))}
          </ul>
        </Section>
      ))
    ) : (
      <Section>
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card py-16">
          <p className="text-center text-muted-foreground">
            Projects coming soon. Want to start one?
          </p>
          <Button asChild size="lg">
            <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer">
              Join our Discord
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </Button>
        </div>
      </Section>
    )}
  </>
);

export default ProjectsPage;
