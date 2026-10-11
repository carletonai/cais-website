import Hero from "../../components/Hero";
import { AboutSection } from "../../components/AboutSection";
import { CatchUp, ComingUp } from "../../components/HomeEvents";
import { JoinCTA } from "../../components/JoinCTA";

const HomePage = () => {
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
