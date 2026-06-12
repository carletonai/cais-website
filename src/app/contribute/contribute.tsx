import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  CodeIcon,
  PresentationIcon,
  CalendarIcon,
  GlobeIcon,
  BookOpenIcon,
  MegaphoneIcon,
} from "lucide-react";

const WAYS = [
  {
    icon: CodeIcon,
    title: "Join a Project",
    description:
      "Work alongside other students on AI/ML projects, from computer vision to NLP.",
    link: { label: "See Projects", to: "/projects", external: false },
  },
  {
    icon: PresentationIcon,
    title: "Run a Workshop",
    description:
      "Have something to share? Lead a session on any AI topic — all skill levels welcome.",
    link: {
      label: "Contact Us",
      to: "/contact",
      external: false,
    },
  },
  {
    icon: CalendarIcon,
    title: "Organize Events",
    description:
      "Help plan workshops, panels, or social events that bring the community together.",
    link: {
      label: "Get Involved",
      to: "https://discord.gg/Ar3JpVZE6t",
      external: true,
    },
  },
  {
    icon: GlobeIcon,
    title: "Contribute to the Website",
    description:
      "Improve this site — fix bugs, add features, or redesign pages on our GitHub.",
    link: {
      label: "GitHub Repo",
      to: "https://github.com/HarshveerThind/cais-website",
      external: true,
    },
  },
  {
    icon: BookOpenIcon,
    title: "Share Knowledge",
    description:
      "Write tutorials, summarize papers, or create learning resources for the community.",
    link: {
      label: "Join Discord",
      to: "https://discord.gg/Ar3JpVZE6t",
      external: true,
    },
  },
  {
    icon: MegaphoneIcon,
    title: "Spread the Word",
    description:
      "Tell your classmates about CAIS and help us grow our community across campus.",
    link: {
      label: "Share on LinkedIn",
      to: "https://www.linkedin.com/company/carleton-ai",
      external: true,
    },
  },
];

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

const Contribute = () => {
  return (
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
            Get Involved
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-glow bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary/50 mb-4">
            Contribute to CAIS
          </h1>
          <p className="text-lg text-muted-foreground">
            There are many ways to make an impact — pick what fits you best.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto"
        >
          {WAYS.map(({ icon: Icon, title, description, link }) => (
            <motion.div
              key={title}
              variants={item}
              className="group bg-card/50 backdrop-blur-sm border border-primary/10 rounded-xl p-6 hover:border-primary/30 hover:translate-y-[-2px] hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 flex flex-col"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed text-sm flex-1 mb-4">
                {description}
              </p>
              {link.external ? (
                <a
                  href={link.to}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  {link.label} →
                </a>
              ) : (
                <Link
                  to={link.to}
                  className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  {link.label} →
                </Link>
              )}
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          viewport={{ once: true }}
          className="flex justify-center mt-16"
        >
          <Button asChild size="lg" variant="default">
            <Link to="/contact">Contact Us</Link>
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default Contribute;
