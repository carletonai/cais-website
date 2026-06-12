import React from "react";
import Hero from "../../components/Hero";
import { Features } from "../../components/Features";
import { Stats } from "../../components/Stats";
import { UpcomingEvents } from "../../components/UpcomingEvents";
import { LatestEvents } from "../../components/LatestEvents";
import { JoinCTA } from "../../components/JoinCTA";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-2/3 left-1/2 w-72 h-72 rounded-full bg-primary/15 blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/20 to-background pointer-events-none" />
      <div className="absolute inset-0 bg-glow opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />

      <Hero
        description="A student club at Carleton University for anyone interested in AI and machine learning. Join us to learn, build projects, and meet others who share your interests."
        logoSrc="/header-club.png"
        primaryAction={{
          text: "See Events",
          to: "/events",
        }}
        secondaryAction={{
          text: "Learn More",
          to: "/about",
        }}
      />

      <div className="relative z-10 space-y-24 pt-16">
        <Features />
        <Stats />
        <UpcomingEvents />
        <LatestEvents />
        <JoinCTA />
      </div>
    </div>
  );
};

export default HomePage;
