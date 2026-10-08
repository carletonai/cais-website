import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigationType,
} from "react-router-dom";
import HomePage from "./home/home";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import RouteMeta from "../components/RouteMeta";

// The landing page stays in the main bundle — it is the most common entry and
// shares most of its components with the shell. Every other page is split out,
// which keeps the 1,500-line resources terminal off the critical path.
const Projects = lazy(() => import("./projects/projects"));
const Events = lazy(() => import("./events/events"));
const EventPage = lazy(() => import("./events/event-page"));
const Contact = lazy(() => import("./contact/contact"));
const Team = lazy(() => import("./team/team"));
const PastTeams = lazy(() => import("./past-teams/past-teams"));
const Governance = lazy(() => import("./governance/governance"));
const Resources = lazy(() => import("./resources/resources"));
const CommandPalette = lazy(() => import("../components/CommandPalette"));

/** Holds a full screen while a route chunk arrives, so the footer does not
 *  flash up the page and jump away again. */
const RouteFallback = () => (
  <div
    className="flex min-h-[100dvh] items-start justify-center pt-[30vh]"
    role="status"
    aria-live="polite"
  >
    <span className="sr-only">Loading page…</span>
    <div className="size-8 animate-spin rounded-full border-2 border-mark/30 border-t-mark" />
  </div>
);

/**
 * After a client-side navigation: start the new page at its top, move focus
 * to its heading, and say which page it is, as a full page load would. Hash links
 * scroll themselves (see home.tsx), and back/forward keeps the browser's own
 * scroll restoration.
 */
const RouteChange = () => {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();
  const [announcement, setAnnouncement] = useState("");
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (navigationType !== "POP" && !hash) window.scrollTo(0, 0);
    // RouteMeta sets the title in an effect too; read it once both have run.
    // Lazy pages may still be loading, so wait (briefly) for their heading.
    let tries = 0;
    const timer = setInterval(() => {
      const main = document.getElementById("main-content");
      const heading = main?.querySelector<HTMLElement>("h1");
      if (!heading && ++tries < 40) return;
      clearInterval(timer);
      setAnnouncement(document.title);
      if (hash) return;
      if (heading && !heading.hasAttribute("tabindex")) heading.tabIndex = -1;
      (heading ?? main)?.focus({ preventScroll: true });
    }, 50);
    return () => clearInterval(timer);
  }, [pathname, hash, navigationType]);

  return (
    <p role="status" aria-live="polite" className="sr-only">
      {announcement}
    </p>
  );
};

/** ⌘K / Ctrl+K or "/" opens search; the palette's code loads on first use. */
const useCommandPalette = () => {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName ?? "");
      const combo =
        (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (combo || (event.key === "/" && !typing && !event.altKey)) {
        event.preventDefault();
        setLoaded(true);
        setOpen(true);
      }
    };
    const onOpen = () => {
      setLoaded(true);
      setOpen(true);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("cais:open-search", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("cais:open-search", onOpen);
    };
  }, []);

  return { open, setOpen, loaded };
};

const App = () => {
  const palette = useCommandPalette();

  return (
    <Router>
      <RouteMeta />
      <RouteChange />
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Navbar />
        <main
          id="main-content"
          tabIndex={-1}
          className="w-full grow pt-16 focus:outline-none"
        >
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:slug" element={<EventPage />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/team" element={<Team />} />
              <Route path="/team/past" element={<PastTeams />} />
              <Route path="/governance" element={<Governance />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
        {palette.loaded && (
          <Suspense fallback={null}>
            <CommandPalette
              open={palette.open}
              onOpenChange={palette.setOpen}
            />
          </Suspense>
        )}
      </div>
    </Router>
  );
};

export default App;
