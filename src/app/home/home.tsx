import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Hero from "../../components/Hero";
import { AboutSection } from "../../components/AboutSection";
import { CatchUp, ComingUp } from "../../components/HomeEvents";
import { JoinCTA } from "../../components/JoinCTA";

const HomePage = () => {
  const { hash, key } = useLocation();

  // "/#about" (and the old /about URL) should land on the About section; the
  // router changes the hash without scrolling. Keyed on the navigation too,
  // so a second link to the same hash still scrolls.
  useEffect(() => {
    const target = hash && document.getElementById(hash.slice(1));
    if (!target) return;
    target.scrollIntoView();
    target.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
  }, [hash, key]);

  return (
    <>
      <Hero />
      <ComingUp />
      <CatchUp />
      <AboutSection />
      <JoinCTA />
    </>
  );
};

export default HomePage;
