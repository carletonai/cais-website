import React from "react";
import { motion } from "framer-motion";

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

const Governance = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
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
            Club Structure
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-glow bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary/50 mb-4">
            Governance
          </h1>
          <p className="text-lg text-muted-foreground">
            CAIS is led by a six-person executive team, each responsible for a
            key area of the club.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto"
        >
          {ROLES.map(({ title, description }) => (
            <motion.div
              key={title}
              variants={item}
              className="bg-card/50 backdrop-blur-sm border border-primary/10 rounded-xl p-6 hover:border-primary/30 hover:translate-y-[-2px] hover:shadow-lg hover:shadow-primary/5 transition-all duration-200"
            >
              <h3 className="text-lg font-semibold text-primary mb-3">{title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default Governance;
