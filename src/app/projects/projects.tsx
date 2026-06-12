import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import projectsData from "@/data/projects.json";
import { ExternalLinkIcon } from "lucide-react";

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
    transition: { type: "spring", stiffness: 100, damping: 15 },
  },
};

const ProjectsPage = () => (
  <div className="min-h-screen bg-background relative overflow-hidden">
    <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
    <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
    <div className="absolute top-2/3 left-1/3 w-72 h-72 rounded-full bg-primary/15 blur-[120px] pointer-events-none" />
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
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-glow bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary/50 mb-4">
          Projects
        </h1>
        <p className="text-lg text-muted-foreground">
          Innovative AI and ML projects developed by CAIS members.
        </p>
      </motion.div>

      {projectsData.projects && projectsData.projects.length > 0 ? (
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto"
        >
          {projectsData.projects.map((project: any) => (
            <motion.div
              key={project.id ?? project.title}
              variants={item}
              className="group bg-card/50 backdrop-blur-sm border border-primary/10 rounded-xl p-6 hover:border-primary/30 hover:translate-y-[-2px] hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 flex flex-col"
            >
              <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                {project.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed flex-1 mb-4">
                {project.description}
              </p>
              {project.link && (
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  View Project <ExternalLinkIcon className="w-3 h-3" />
                </a>
              )}
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col items-center justify-center py-16 gap-4 bg-card/50 backdrop-blur-sm border border-primary/10 rounded-xl max-w-2xl mx-auto"
        >
          <p className="text-muted-foreground text-center">
            Projects coming soon. Want to start one?
          </p>
          <Button asChild variant="default" size="lg">
            <a
              href="https://discord.gg/Ar3JpVZE6t"
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
