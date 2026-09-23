import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import eventsData from "@/data/events.json";
import projectsData from "@/data/projects.json";

/** Counted from the data so the numbers keep up as events and projects land. */
const eventCount = eventsData.events.length;
const firstYear = Math.min(
  ...eventsData.events.map((event) => Number(event.date.slice(0, 4))),
);

const stats = [
  {
    number: "50+",
    label: "Members",
    description: "Active students in our community",
  },
  {
    number: `${Math.floor(eventCount / 10) * 10}+`,
    label: "Events",
    description: `Workshops, talks and socials since ${firstYear}`,
  },
  {
    number: String(projectsData.projects.length),
    label: "Projects",
    description: "Club and hackathon projects built by members",
  },
  {
    number: "2",
    label: "Partners",
    description: "Industry and academic partnerships",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, scale: 0.95 },
  show: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 30,
      duration: 0.4,
    },
  },
};

export function Stats() {
  return (
    <section className="py-16 relative">
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-3 text-glow">
            Our Impact
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Growing our community and making a difference in AI education
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
        >
          {stats.map((stat, index) => (
            <motion.div key={index} variants={item}>
              <div
                className={cn(
                  "group relative h-full rounded-lg p-5 sm:p-6",
                  "bg-card/50 backdrop-blur-xs",
                  "border border-primary/10",
                  "transition-all duration-200 ease-out",
                  "hover:border-primary/30 hover:bg-brand/5",
                  "hover:translate-y-[-2px] hover:shadow-lg hover:shadow-brand/5",
                )}
              >
                <div className="text-center relative z-10">
                  <motion.div
                    className="text-3xl sm:text-4xl font-bold mb-2 text-primary group-hover:text-glow transition-colors duration-200"
                    initial={{ scale: 0.9, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                  >
                    {stat.number}
                  </motion.div>
                  <div className="text-base sm:text-lg font-medium mb-1 text-foreground">
                    {stat.label}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {stat.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
