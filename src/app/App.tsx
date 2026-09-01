import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import About from "./about/about";
import Projects from "./projects/projects";
import Events from "./events/events";
import Contact from "./contact/contact";
import Team from "./team/team";
import Governance from "./governance/governance";
import Resources from "./resources/resources";
import Contribute from "./contribute/contribute";
import HomePage from "./home/home";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const routerBasename =
  typeof window !== "undefined" &&
  window.location.pathname.startsWith("/cais-website")
    ? "/cais-website"
    : undefined;

const PAGE_TITLES: Record<string, string> = {
  "/": "Home",
  "/about": "About",
  "/projects": "Projects",
  "/events": "Events",
  "/contact": "Contact",
  "/team": "Team",
  "/governance": "Governance",
  "/resources": "Resources",
  "/contribute": "Contribute",
};

/**
 * 2.4.2 Page Titled — a client-side route change has to update the document
 * title, otherwise every page announces itself as the one that was loaded
 * first.
 */
const DocumentTitle = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const page = PAGE_TITLES[pathname];
    document.title = page
      ? `${page} | Carleton AI Society`
      : "Carleton AI Society";
  }, [pathname]);

  return null;
};

const App = () => {
  return (
    <Router basename={routerBasename}>
      <DocumentTitle />
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Navbar />
        <main id="main-content" tabIndex={-1} className="pt-16 w-full grow">
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
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
