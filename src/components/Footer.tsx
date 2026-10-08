import { Link } from "react-router-dom";
import { SubscribeButton } from "@/components/events/CalendarActions";
import { CONSTITUTION_URL, SOCIAL_LINKS } from "@/lib/links";

const COLUMNS = [
  {
    title: "Explore",
    links: [
      { label: "Events", to: "/events" },
      { label: "Projects", to: "/projects" },
      { label: "CAIS Terminal", to: "/resources" },
      { label: "Contact", to: "/contact" },
    ],
  },
  {
    title: "The club",
    links: [
      { label: "Governance", to: "/governance" },
      { label: "Current team", to: "/team" },
      { label: "Past teams", to: "/team/past" },
      { label: "Constitution (PDF)", href: CONSTITUTION_URL },
    ],
  },
];

const linkClass =
  "inline-flex min-h-11 items-center text-muted-foreground transition-colors hover:text-foreground sm:min-h-9";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-dots">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Link to="/" className="inline-flex items-center gap-3">
            <img src="/logo.svg" alt="" className="h-12 w-auto" />
            <span className="font-heading text-lg font-bold leading-tight">
              Carleton
              <br />
              AI Society
            </span>
          </Link>
          <p className="mt-4 text-sm text-muted-foreground">
            A student club at Carleton University for anyone interested in AI
            and machine learning.
          </p>
          <SubscribeButton className="mt-5" />
        </div>
        {COLUMNS.map(({ title, links }) => (
          <nav key={title} aria-label={title}>
            <p className="label-mono mb-3 text-primary">{title}</p>
            <ul>
              {links.map((link) => (
                <li key={link.label}>
                  {"to" in link && link.to ? (
                    <Link to={link.to} className={linkClass}>
                      {link.label}
                    </Link>
                  ) : (
                    <a href={link.href} className={linkClass}>
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
        <div>
          <p className="label-mono mb-3 text-primary">Connect</p>
          <ul>
            {SOCIAL_LINKS.map(({ label, url, icon: Icon }) => (
              <li key={label}>
                <a
                  href={url}
                  {...(!url.startsWith("mailto:") && {
                    target: "_blank",
                    rel: "noopener noreferrer",
                  })}
                  className={`${linkClass} gap-2`}
                >
                  <Icon aria-hidden="true" className="size-4" />
                  {label}
                  {!url.startsWith("mailto:") && (
                    <span className="sr-only"> (opens in a new tab)</span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-5 text-sm text-muted-foreground sm:px-6">
          <p>
            © {new Date().getFullYear()} Carleton Artificial Intelligence
            Society
          </p>
          <p className="font-mono text-xs">
            Press <kbd className="rounded border border-border px-1.5">/</kbd>{" "}
            to search
          </p>
        </div>
      </div>
    </footer>
  );
}
