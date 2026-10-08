import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDownIcon, MenuIcon, SearchIcon, XIcon } from "lucide-react";
import { FaDiscord } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { DISCORD_URL } from "@/lib/links";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  path: string;
  children?: NavItem[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Home", path: "/" },
  { label: "Events", path: "/events" },
  { label: "Projects", path: "/projects" },
  {
    label: "Team",
    path: "/governance",
    children: [
      { label: "Governance", path: "/governance" },
      { label: "Current Team", path: "/team" },
      { label: "Past Teams", path: "/team/past" },
    ],
  },
  { label: "Contact", path: "/contact" },
];

/** A tab stays lit while any page under it is open, not just its landing
 *  page; event pages count as Events. */
const isInSection = (item: NavItem, pathname: string) =>
  pathname === item.path ||
  (item.path !== "/" && pathname.startsWith(`${item.path}/`)) ||
  (item.children ?? []).some((child) => child.path === pathname);

const openSearch = () => window.dispatchEvent(new Event("cais:open-search"));

/** The Team tab: a link to its landing page plus a button for the submenu,
 *  which hover, click and keyboard can all open, and Escape closes. */
function TeamMenu({ item, pathname }: { item: NavItem; pathname: string }) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const active = isInSection(item, pathname);

  return (
    <div
      ref={wrapper}
      className="relative flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onBlur={(e) => {
        if (!wrapper.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          setOpen(false);
          toggle.current?.focus();
        }
      }}
    >
      <Link
        to={item.path}
        aria-current={
          pathname === item.path ? "page" : active ? "true" : undefined
        }
        className={cn(
          "inline-flex min-h-11 items-center rounded-l-full py-2 pl-4 pr-1 text-sm font-medium transition-colors",
          active ? "text-primary" : "text-foreground hover:text-primary",
        )}
      >
        {item.label}
      </Link>
      <button
        ref={toggle}
        type="button"
        aria-expanded={open}
        aria-controls="team-menu"
        aria-label="Team pages"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex min-h-11 min-w-9 items-center justify-center rounded-r-full pr-2 transition-colors",
          active ? "text-primary" : "text-foreground hover:text-primary",
        )}
      >
        <ChevronDownIcon
          aria-hidden="true"
          className={cn("size-4 transition-transform", open && "rotate-180")}
        />
      </button>
      <ul
        id="team-menu"
        hidden={!open}
        className="absolute left-0 top-full z-50 mt-1 w-52 rounded-2xl border border-border bg-popover p-2 shadow-xl shadow-black/40"
      >
        {item.children?.map((child) => (
          <li key={child.path}>
            <Link
              to={child.path}
              aria-current={pathname === child.path ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center rounded-xl px-3 text-sm font-medium transition-colors hover:bg-accent",
                pathname === child.path ? "text-primary" : "text-foreground",
              )}
            >
              {child.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const menuButton = useRef<HTMLButtonElement>(null);

  // Any navigation (a link, search, back) closes the menu.
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setIsMobileMenuOpen(false);
  }

  // Escape closes the mobile menu and returns focus to its button.
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMobileMenuOpen]);

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/90 backdrop-blur-lg"
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          to="/"
          aria-label="Carleton AI Society — home"
          className="flex min-h-11 items-center gap-3"
        >
          <img src="/logo.svg" alt="CAIS Logo" className="h-10 w-auto" />
          <span className="label-mono hidden text-foreground lg:inline">
            Carleton AI Society
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) =>
            item.children ? (
              // Keyed on the page, so the submenu starts closed after any
              // navigation, however it happened.
              <TeamMenu
                key={`${item.path}:${pathname}`}
                item={item}
                pathname={pathname}
              />
            ) : (
              <Link
                key={item.path}
                to={item.path}
                aria-current={
                  pathname === item.path
                    ? "page"
                    : isInSection(item, pathname)
                      ? "true"
                      : undefined
                }
                className={cn(
                  "inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium transition-colors",
                  isInSection(item, pathname)
                    ? "text-primary"
                    : "text-foreground hover:text-primary",
                )}
              >
                {item.label}
              </Link>
            ),
          )}
          <button
            type="button"
            onClick={openSearch}
            className="ml-2 inline-flex min-h-11 items-center gap-2 rounded-full border border-input px-4 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
          >
            <SearchIcon aria-hidden="true" className="size-4" />
            Search
            <kbd className="rounded border border-border px-1.5 font-mono text-xs">
              /
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <button
            type="button"
            onClick={openSearch}
            className="inline-flex size-11 items-center justify-center rounded-full text-foreground hover:bg-accent"
          >
            <SearchIcon aria-hidden="true" className="size-5" />
            <span className="sr-only">Search</span>
          </button>
          <button
            ref={menuButton}
            type="button"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            className="inline-flex size-11 items-center justify-center rounded-full text-foreground hover:bg-accent"
            aria-controls="mobile-menu"
            aria-expanded={isMobileMenuOpen}
          >
            <span className="sr-only">
              {isMobileMenuOpen ? "Close main menu" : "Open main menu"}
            </span>
            {isMobileMenuOpen ? (
              <XIcon aria-hidden="true" className="size-6" />
            ) : (
              <MenuIcon aria-hidden="true" className="size-6" />
            )}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div
          id="mobile-menu"
          data-testid="mobile-menu"
          role="navigation"
          aria-label="Mobile navigation"
          // A sheet below the bar that scrolls on its own, so every link is
          // reachable on short screens and at high zoom.
          className="fixed inset-x-0 bottom-0 top-16 overflow-y-auto border-t border-border bg-background md:hidden"
        >
          <ul className="space-y-1 px-4 py-4">
            {NAV_ITEMS.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-current={
                    pathname === item.path
                      ? "page"
                      : isInSection(item, pathname)
                        ? "true"
                        : undefined
                  }
                  className={cn(
                    "flex min-h-12 items-center rounded-xl px-4 font-heading text-xl font-bold",
                    isInSection(item, pathname)
                      ? "text-primary"
                      : "text-foreground hover:bg-accent",
                  )}
                >
                  {item.label}
                </Link>
                {item.children && (
                  <ul className="ml-6 border-l-2 border-border pl-2">
                    {item.children.map((child) => (
                      <li key={child.path}>
                        <Link
                          to={child.path}
                          onClick={() => setIsMobileMenuOpen(false)}
                          aria-current={
                            pathname === child.path ? "page" : undefined
                          }
                          className={cn(
                            "flex min-h-11 items-center rounded-xl px-4 text-base font-medium",
                            pathname === child.path
                              ? "text-primary"
                              : "text-foreground hover:bg-accent",
                          )}
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          <div className="border-t border-border px-4 py-5">
            <Button asChild className="w-full">
              <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer">
                <FaDiscord aria-hidden="true" />
                Join the Discord
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
