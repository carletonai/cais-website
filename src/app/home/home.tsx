import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Hero from "../../components/Hero";
import { AboutSection } from "../../components/AboutSection";
import { Features } from "../../components/Features";
import { Stats } from "../../components/Stats";
import { UpcomingEvents } from "../../components/UpcomingEvents";
import { LatestEvents } from "../../components/LatestEvents";
import { JoinCTA } from "../../components/JoinCTA";

const HomePage = () => {
  const { hash, key } = useLocation();

  // "/#about" (the Learn More button, and the old /about URL) should land on
  // the About section; the router changes the hash without scrolling. Keyed on
  // the navigation too, so a second Learn More to the same hash still scrolls.
  useEffect(() => {
    const target = hash && document.getElementById(hash.slice(1));
    if (!target) return;
    target.scrollIntoView();
    target.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
  }, [hash, key]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-brand/25 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-brand/20 blur-[120px] pointer-events-none" />
      <div className="absolute top-2/3 left-1/2 w-72 h-72 rounded-full bg-brand/20 blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/20 to-background pointer-events-none" />
      <div className="absolute inset-0 bg-glow opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />

      <Hero
        description="A student club at Carleton University for anyone interested in AI and machine learning. Join us to learn, build projects, and meet others who share your interests."
        logoSrc="/logo.svg"
        primaryAction={{
          text: "See Events",
          to: "/events",
        }}
        secondaryAction={{
          text: "Learn More",
          to: "/#about",
        }}
      />

      <div className="relative z-10 space-y-24 pt-16">
        <AboutSection />
        <Stats />
        <UpcomingEvents />
        <LatestEvents />
        <Features />
        <JoinCTA />
      </div>
    </div>
  );
};

export default HomePage;
