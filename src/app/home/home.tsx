import Hero from "../../components/Hero";
import { AboutSection } from "../../components/AboutSection";
import { CatchUp, ComingUp } from "../../components/HomeEvents";
import { JoinCTA } from "../../components/JoinCTA";
import { Partners } from "../../components/Partners";

const HomePage = () => {
  return (
    <>
      <Hero />
      <ComingUp />
      <CatchUp />
      <AboutSection />
      <Partners />
      <JoinCTA />
    </>
  );
};

export default HomePage;
