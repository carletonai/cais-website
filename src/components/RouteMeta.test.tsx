import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useNavigate } from "react-router-dom";
import RouteMeta from "./RouteMeta";

// The tags index.html ships, which RouteMeta rewrites on every navigation.
beforeEach(() => {
  document.head.innerHTML = `
    <meta name="description" content="">
    <meta property="og:title" content="">
    <meta property="og:description" content="">
    <meta property="og:url" content="">
    <meta name="twitter:title" content="">
    <meta name="twitter:description" content="">
    <link rel="canonical" href="https://carletonai.com/">
  `;
});

const content = (selector: string) =>
  document.head.querySelector(selector)?.getAttribute("content");

const canonical = () =>
  document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href;

const Go = ({ to }: { to: string }) => {
  const navigate = useNavigate();
  return <button onClick={() => navigate(to)}>go</button>;
};

const renderAt = (path: string, next = "/team") => {
  render(
    <MemoryRouter initialEntries={[path]}>
      <RouteMeta />
      <Go to={next} />
    </MemoryRouter>,
  );
};

test("titles an event page and keeps its preview tags and canonical URL in step", () => {
  renderAt("/events/66-intro-to-agentic-ai");
  expect(document.title).toBe(
    "Intro to Agentic AI · 2026 | Carleton AI Society",
  );
  expect(content('meta[property="og:title"]')).toBe(
    "Intro to Agentic AI · Fri, Oct 9, 2026",
  );
  expect(content('meta[name="twitter:title"]')).toBe(
    "Intro to Agentic AI · Fri, Oct 9, 2026",
  );
  expect(content('meta[name="description"]')).toMatch(/^Fri, Oct 9, 2026 · /);
  expect(content('meta[property="og:description"]')).toBe(
    content('meta[name="description"]'),
  );
  expect(content('meta[property="og:url"]')).toBe(
    "https://carletonai.com/events/66-intro-to-agentic-ai",
  );
  expect(canonical()).toBe(
    "https://carletonai.com/events/66-intro-to-agentic-ai",
  );
});

test("drops the trailing slash a static host adds from the canonical URL", () => {
  renderAt("/contact/");
  expect(document.title).toBe("Contact | Carleton AI Society");
  expect(content('meta[property="og:url"]')).toBe(
    "https://carletonai.com/contact",
  );
  expect(canonical()).toBe("https://carletonai.com/contact");
});

test("retitles the document on a client-side navigation", async () => {
  const user = userEvent.setup();
  renderAt("/", "/team");
  expect(document.title).toBe("Carleton AI Society");
  expect(canonical()).toBe("https://carletonai.com/");

  await user.click(screen.getByRole("button", { name: "go" }));
  expect(document.title).toBe("Current Team | Carleton AI Society");
  expect(content('meta[property="og:title"]')).toBe(
    "Current Team | Carleton AI Society",
  );
  expect(canonical()).toBe("https://carletonai.com/team");
});
