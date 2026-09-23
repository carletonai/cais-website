import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { BrainIcon, UsersIcon, CalendarIcon, CodeIcon } from "lucide-react";

const pillars = [
  {
    icon: BrainIcon,
    title: "Learn AI",
    description:
      "Hands-on workshops and sessions covering machine learning fundamentals, deep learning, and the latest AI research.",
  },
  {
    icon: CodeIcon,
    title: "Build Projects",
    description:
      "Collaborate on real AI and ML projects with fellow students, from idea to working prototype.",
  },
  {
    icon: UsersIcon,
    title: "Grow Your Network",
    description:
      "Connect with students, alumni, and industry professionals who share a passion for artificial intelligence.",
  },
  {
    icon: CalendarIcon,
    title: "Attend Events",
    description:
      "Workshops, hackathons, and social meetups throughout the academic year.",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
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

/** What used to be the /about page, now the home page's "About CAIS" section. */
export function AboutSection() {
  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="relative scroll-mt-24 py-16"
    >
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          viewport={{ once: true }}
          className="text-center mb-12 max-w-3xl mx-auto"
        >
          <p className="text-sm font-mono text-primary mb-4 tracking-widest uppercase">
            About CAIS
          </p>
          <h2
            id="about-heading"
            tabIndex={-1}
            className="text-3xl sm:text-4xl font-bold mb-4 text-glow outline-hidden"
          >
            What We Do
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            A student-run club at Carleton University for anyone curious about
            artificial intelligence and machine learning — from total beginners
            to seasoned researchers.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto"
        >
          {pillars.map(({ icon: Icon, title, description }) => (
            <motion.div
              key={title}
              variants={item}
              className="group bg-card/50 backdrop-blur-xs border border-primary/10 rounded-xl p-6 hover:border-primary/30 hover:translate-y-[-2px] hover:shadow-lg hover:shadow-brand/5 transition-all duration-200"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-brand/10 group-hover:bg-brand/20 transition-colors">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-4 mt-12"
        >
          <Button asChild size="lg" variant="default">
            <Link to="/team">Meet the Team</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="hover:bg-brand/5 hover:border-primary/50 transition-all duration-300"
          >
            <Link to="/contact">Get in Touch</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
