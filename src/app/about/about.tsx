import React from "react";
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
      "Panels, symposiums, hackathons, and social meetups throughout the academic year.",
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
    transition: { type: "spring", stiffness: 100, damping: 15 },
  },
};

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-2/3 left-1/3 w-72 h-72 rounded-full bg-primary/15 blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/20 to-background pointer-events-none" />
      <div className="absolute inset-0 bg-glow opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />

      <section className="relative z-10 container mx-auto px-4 pt-28 pb-16 text-center max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-sm font-mono text-primary mb-4 tracking-widest uppercase">
            About CAIS
          </p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-glow bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary/50 mb-6">
            Carleton ΛI Society
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            A student-run club at Carleton University for anyone curious about
            artificial intelligence and machine learning — from total beginners
            to seasoned researchers.
          </p>
        </motion.div>
      </section>

      <section className="relative z-10 container mx-auto px-4 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-glow">What We Do</h2>
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
              className="group bg-card/50 backdrop-blur-sm border border-primary/10 rounded-xl p-6 hover:border-primary/30 hover:translate-y-[-2px] hover:shadow-lg hover:shadow-primary/5 transition-all duration-200"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">{description}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-4 mt-16"
        >
          <Button asChild size="lg" variant="default">
            <Link to="/team">Meet the Team</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="hover:bg-primary/5 hover:border-primary/50 transition-all duration-300"
          >
            <Link to="/contact">Get in Touch</Link>
          </Button>
        </motion.div>
      </section>
    </div>
  );
};

export default AboutPage;
