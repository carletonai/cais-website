import { lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import HomePage from "./home/home";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import RouteMeta from "../components/RouteMeta";

// The landing page stays in the main bundle — it is the most common entry and
// shares most of its components with the shell. Every other page is split out,
// which keeps the 1,500-line resources terminal off the critical path.
const About = lazy(() => import("./about/about"));
const Projects = lazy(() => import("./projects/projects"));
const Events = lazy(() => import("./events/events"));
const Contact = lazy(() => import("./contact/contact"));
const Team = lazy(() => import("./team/team"));
const Governance = lazy(() => import("./governance/governance"));
const Resources = lazy(() => import("./resources/resources"));
const Contribute = lazy(() => import("./contribute/contribute"));

const routerBasename =
  typeof window !== "undefined" &&
  window.location.pathname.startsWith("/cais-website")
    ? "/cais-website"
    : undefined;

/** Holds the viewport height while a route chunk arrives, so the footer does
 *  not jump up the page. Animation is disabled by the reduced-motion rule in
 *  globals.css. */
const RouteFallback = () => (
  <div
    className="flex min-h-[60vh] items-center justify-center"
    role="status"
    aria-live="polite"
  >
    <span className="sr-only">Loading page…</span>
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
  </div>
);

const App = () => {
  return (
    <Router basename={routerBasename}>
      <RouteMeta />
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Navbar />
        <main id="main-content" tabIndex={-1} className="pt-16 w-full grow">
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<About />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/events" element={<Events />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/team" element={<Team />} />
              <Route path="/governance" element={<Governance />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/contribute" element={<Contribute />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
