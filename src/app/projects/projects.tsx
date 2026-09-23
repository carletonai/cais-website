import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import projectsData from "@/data/projects.json";
import { ArrowRightIcon, ExternalLinkIcon } from "lucide-react";

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
    title: "Club Projects",
    description: "Built by CAIS members, from our first year to now.",
    projects: projects.filter((project) => !project.hackathon),
  },
  {
    id: "hackathon-projects",
    title: "Built at CAIS Hackathons",
    description: "Winning projects from the hackathons we have hosted.",
    projects: projects.filter((project) => project.hackathon),
  },
].filter((section) => section.projects.length > 0);

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 15 },
  },
};

const linkClass =
  "inline-flex min-h-11 items-center gap-1 text-sm text-primary hover:text-primary hover:underline font-medium transition-colors";

const ProjectCard = ({ project }: { project: Project }) => (
  <motion.div
    variants={item}
    className="group bg-card/50 backdrop-blur-xs border border-primary/10 rounded-xl p-6 hover:border-primary/30 hover:translate-y-[-2px] hover:shadow-lg hover:shadow-brand/5 transition-all duration-200 flex flex-col"
  >
    {(project.status || project.period) && (
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {project.status && (
          <span className="w-fit px-2.5 py-1 text-xs font-medium rounded-full bg-brand/10 text-primary border border-primary/20">
            {project.hackathon
              ? `${project.hackathon} · ${project.status}`
              : project.status}
          </span>
        )}
        {project.period && (
          <span className="text-xs text-muted-foreground">
            {project.period}
          </span>
        )}
      </div>
    )}
    <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
      {project.title}
    </h3>
    <p className="text-muted-foreground text-sm leading-relaxed flex-1 mb-4">
      {project.description}
    </p>
    {project.tags && project.tags.length > 0 && (
      <div className="flex flex-wrap gap-2 mb-5">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="px-2 py-1 text-xs rounded-full bg-background/60 text-muted-foreground border border-border/40"
          >
            {tag}
          </span>
        ))}
      </div>
    )}
    {project.link?.startsWith("/") ? (
      <Link to={project.link} className={linkClass}>
        View Project <ArrowRightIcon className="w-3 h-3" />
      </Link>
    ) : (
      project.link && (
        <a
          href={project.link}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          View Project <ExternalLinkIcon className="w-3 h-3" />
        </a>
      )
    )}
  </motion.div>
);

const ProjectsPage = () => (
  <div className="min-h-screen bg-background relative overflow-hidden">
    <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-brand/20 blur-[120px] pointer-events-none" />
    <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-brand/10 blur-[120px] pointer-events-none" />
    <div className="absolute top-2/3 left-1/3 w-72 h-72 rounded-full bg-brand/15 blur-[120px] pointer-events-none" />
    <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/20 to-background pointer-events-none" />
    <div className="absolute inset-0 bg-glow opacity-20 pointer-events-none" />
    <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />

    <div className="relative z-10 container mx-auto px-4 pt-28 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16 max-w-2xl mx-auto"
      >
        <p className="text-sm font-mono text-primary mb-4 tracking-widest uppercase">
          What We Build
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-glow bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/90 to-primary/75 mb-4">
          Projects
        </h1>
        <p className="text-lg text-muted-foreground">
          Innovative AI and ML projects developed by CAIS members.
        </p>
      </motion.div>

      {SECTIONS.length > 0 ? (
        <div className="space-y-20">
          {SECTIONS.map((section) => (
            <section
              key={section.id}
              aria-labelledby={section.id}
              className="max-w-5xl mx-auto"
            >
              <h2
                id={section.id}
                className="text-2xl md:text-3xl font-bold mb-2 text-glow"
              >
                {section.title}
              </h2>
              <p className="text-muted-foreground mb-8">
                {section.description}
              </p>
              <motion.div
                variants={container}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-50px" }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {section.projects.map((project) => (
                  <ProjectCard
                    key={project.id ?? project.title}
                    project={project}
                  />
                ))}
              </motion.div>
            </section>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col items-center justify-center py-16 gap-4 bg-card/50 backdrop-blur-xs border border-primary/10 rounded-xl max-w-2xl mx-auto"
        >
          <p className="text-muted-foreground text-center">
            Projects coming soon. Want to start one?
          </p>
          <Button asChild variant="default" size="lg">
            <a
              href="https://discord.gg/gCs3v653de"
              target="_blank"
              rel="noopener noreferrer"
            >
              Join our Discord
            </a>
          </Button>
        </motion.div>
      )}
    </div>
  </div>
);

export default ProjectsPage;
