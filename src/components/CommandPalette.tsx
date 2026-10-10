import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRightIcon,
  CalendarIcon,
  CornerDownLeftIcon,
  FileTextIcon,
  FolderGit2Icon,
  SearchIcon,
  UserIcon,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import projectsData from "@/data/projects.json";
import teamData from "@/data/team.json";
import oldTeamsData from "@/data/old-teams.json";
import {
  allEvents,
  eventPath,
  formatWhen,
  isUpcoming,
  resourceLinks,
} from "@/lib/events";
import { webcalFeedUrl } from "@/lib/shared/ics.js";
import { CONSTITUTION_URL, SOCIAL_LINKS } from "@/lib/links";
import { cn, seasonLabel } from "@/lib/utils";

type Group =
  "Pages" | "Actions" | "Upcoming" | "Events" | "Projects" | "People";

interface Item {
  id: string;
  group: Group;
  title: string;
  detail?: string;
  /** Extra words that should find this item. */
  keywords?: string;
  /** Breaks ties between equal matches: later sorts first (event dates). */
  rank?: string;
  /** An in-site path, or an absolute URL that opens in a new tab. */
  href: string;
  icon: typeof SearchIcon;
}

const fold = (text: string) =>
  text.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();

const PAGES: Item[] = [
  ["Home", "/", "about join what we do"],
  ["Events", "/events", "workshops talks socials calendar"],
  ["Projects", "/projects", "build code hackathon"],
  ["Current Team", "/team", "exec executives people"],
  ["Past Teams", "/team/past", "alumni history"],
  ["Governance", "/governance", "constitution roles elections"],
  ["Contact", "/contact", "email socials reach"],
  ["CAIS Terminal", "/resources", "resources learning cli"],
].map(([title, href, keywords]) => ({
  id: `page:${href}`,
  group: "Pages" as const,
  title,
  keywords,
  href,
  icon: FileTextIcon,
}));

const ACTIONS: Item[] = [
  {
    id: "action:subscribe",
    group: "Actions",
    title: "Subscribe to the events calendar",
    keywords: "ics webcal google apple outlook reminders",
    href: webcalFeedUrl(),
    icon: CalendarIcon,
  },
  {
    id: "action:constitution",
    group: "Actions",
    title: "Read the constitution (PDF)",
    keywords: "governance rules",
    href: CONSTITUTION_URL,
    icon: FileTextIcon,
  },
  ...SOCIAL_LINKS.map(({ label, handle, url }) => ({
    id: `action:${label}`,
    group: "Actions" as const,
    title: label === "Email" ? `Email ${handle}` : `CAIS on ${label}`,
    keywords: `${handle} social`,
    href: url,
    icon: ArrowUpRightIcon,
  })),
];

const buildItems = (now: Date): Item[] => {
  const events = allEvents.map((event) => ({
    id: `event:${event.id}`,
    group: isUpcoming(event, now) ? ("Upcoming" as const) : ("Events" as const),
    title: event.title,
    detail: `${formatWhen(event, { year: true })} · ${event.type}`,
    keywords: [
      event.type,
      event.location,
      event.tags.join(" "),
      event.date.slice(0, 4),
      resourceLinks(event)
        .map((link) => link.label)
        .join(" "),
      event.description,
    ].join(" "),
    href: eventPath(event),
    rank: event.date,
    icon: CalendarIcon,
  }));
  const projects = projectsData.projects.map((project) => ({
    id: `project:${project.id ?? project.title}`,
    group: "Projects" as const,
    title: project.title,
    detail: project.status,
    keywords: `${project.tags.join(" ")} ${project.description}`,
    href: project.link ?? "/projects",
    icon: FolderGit2Icon,
  }));
  const people = [
    ...teamData.members.map((member) => ({
      id: `person:now:${member.name}`,
      group: "People" as const,
      title: member.name,
      detail: `${member.title} · current team`,
      href: "/team",
      icon: UserIcon,
    })),
    ...oldTeamsData.teams.flatMap((team) =>
      team.members.map((member) => ({
        id: `person:${team.year}:${member.name}`,
        group: "People" as const,
        title: member.name,
        detail: `${member.title} · ${seasonLabel(team.year)}`,
        href: "/team/past",
        icon: UserIcon,
      })),
    ),
  ];
  return [...PAGES, ...ACTIONS, ...events, ...projects, ...people];
};

const ORDER: Group[] = [
  "Upcoming",
  "Pages",
  "Events",
  "Projects",
  "People",
  "Actions",
];
const LIMIT: Record<Group, number> = {
  Upcoming: 4,
  Pages: 8,
  Events: 8,
  Projects: 5,
  People: 6,
  Actions: 8,
};

/** Every word must appear; title matches beat matches elsewhere. */
const search = (items: Item[], query: string) => {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return items.filter(
      (item) => item.group === "Upcoming" || item.group === "Pages",
    );
  }
  const scored = items.flatMap((item) => {
    const title = fold(item.title);
    const rest = fold(`${item.detail ?? ""} ${item.keywords ?? ""}`);
    if (!words.every((w) => title.includes(w) || rest.includes(w))) return [];
    const score =
      (title.startsWith(words[0]) ? 4 : 0) +
      words.filter((w) => title.includes(w)).length * 2 +
      (item.group === "Upcoming" ? 1 : 0);
    return [{ item, score }];
  });
  // Equal matches put the newest event first.
  return scored
    .sort(
      (a, b) =>
        b.score - a.score ||
        (b.item.rank ?? "").localeCompare(a.item.rank ?? ""),
    )
    .map(({ item }) => item);
};

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Search across pages, every event since 2019, projects and people. */
export default function CommandPalette({
  open,
  onOpenChange,
}: CommandPaletteProps) {
  const navigate = useNavigate();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const items = useMemo(() => buildItems(new Date()), []);

  const results = useMemo(() => {
    const found = search(items, query);
    // Group in a fixed order, capping each group.
    return ORDER.flatMap((group) =>
      found.filter((item) => item.group === group).slice(0, LIMIT[group]),
    );
  }, [items, query]);

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${active}"]`)
      // jsdom has no scrollIntoView.
      ?.scrollIntoView?.({ block: "nearest" });
  }, [active]);

  /** Closing clears the search, so it opens fresh next time. */
  const setOpen = (next: boolean) => {
    if (!next) {
      setQuery("");
      setActive(0);
    }
    onOpenChange(next);
  };

  const choose = (item: Item | undefined) => {
    if (!item) return;
    setOpen(false);
    if (item.href.startsWith("/") && !item.href.endsWith(".pdf")) {
      navigate(item.href);
    } else if (/^(mailto|webcal):/.test(item.href)) {
      window.location.href = item.href;
    } else {
      window.open(item.href, "_blank", "noopener,noreferrer");
    }
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Home") {
      event.preventDefault();
      setActive(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActive(results.length - 1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(results[active]);
    }
  };

  const groups = ORDER.map((group) => ({
    group,
    items: results.filter((item) => item.group === group),
  })).filter(({ items }) => items.length > 0);
  const optionId = (i: number) => `${listId}-option-${i}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="top-[12vh] w-[calc(100%-2rem)] max-w-xl translate-y-0 gap-0 overflow-hidden p-0"
      >
        <DialogTitle className="sr-only">Search CAIS</DialogTitle>
        <div className="flex items-center gap-3 border-b border-border px-4">
          <SearchIcon
            aria-hidden="true"
            className="size-5 shrink-0 text-muted-foreground"
          />
          <input
            autoFocus
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={
              results.length ? optionId(active) : undefined
            }
            aria-label="Search pages, events, projects and people"
            placeholder="Search events, workshops, people…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            className="h-14 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden rounded border border-border px-1.5 py-0.5 font-mono text-xs text-muted-foreground sm:block">
            Esc
          </kbd>
        </div>
        <div
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label="Results"
          className="max-h-[min(60vh,28rem)] overflow-y-auto p-2"
        >
          {groups.map(({ group, items: groupItems }) => (
            <div key={group} role="group" aria-label={group} className="pb-2">
              <p
                aria-hidden="true"
                className="label-mono px-3 pb-1 pt-2 text-[0.625rem] text-muted-foreground"
              >
                {group}
              </p>
              {groupItems.map((item) => {
                const i = results.indexOf(item);
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    id={optionId(i)}
                    data-index={i}
                    role="option"
                    aria-selected={i === active}
                    onMouseMove={() => setActive(i)}
                    onClick={() => choose(item)}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5",
                      i === active && "bg-accent",
                    )}
                  >
                    <Icon
                      aria-hidden="true"
                      className="size-4 shrink-0 text-primary"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {item.title}
                      </span>
                      {item.detail && (
                        <span className="block truncate text-sm text-muted-foreground">
                          {item.detail}
                        </span>
                      )}
                    </span>
                    {i === active && (
                      <CornerDownLeftIcon
                        aria-hidden="true"
                        className="size-4 shrink-0 text-muted-foreground"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
          {results.length === 0 && (
            <p
              role="status"
              className="px-3 py-8 text-center text-muted-foreground"
            >
              Nothing matches “{query}”.
            </p>
          )}
        </div>
        <p className="hidden border-t border-border px-4 py-2.5 font-mono text-xs text-muted-foreground sm:block">
          ↑↓ to move · Enter to open · type “/” or Ctrl K anywhere to search
        </p>
      </DialogContent>
    </Dialog>
  );
}
