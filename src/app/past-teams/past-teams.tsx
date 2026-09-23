import { motion } from "framer-motion";
import OldTeamsRow from "@/components/OldTeamsRow";
import oldTeamsData from "@/data/old-teams.json";

const PastTeamsPage = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-glow opacity-30" />
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="fixed inset-0 bg-gradient-to-b from-black/0 via-brand/10 to-background pointer-events-none" />

      <section className="relative z-10 px-6 lg:px-14 pt-20 pb-16">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-4xl mx-auto"
        >
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-glow bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/90 to-primary/75 mb-6">
            Past Teams
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            The executives who built CAIS before us, year by year
          </p>
        </motion.div>
      </section>

      <div className="relative z-10 px-6 lg:px-14 pb-24">
        <OldTeamsRow teams={oldTeamsData.teams} />
      </div>
    </div>
  );
};

export default PastTeamsPage;
