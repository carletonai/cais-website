import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import projectsData from "@/data/projects.json";
import Resources from "./resources";

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

describe("Resources", () => {
  it("renders resources page", () => {
    render(<Resources />);
    expect(
      screen.getByRole("heading", { name: /CAIS Resources Terminal/i }),
    ).toBeInTheDocument();
  });
});

describe("terminal commands", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // jsdom has no scrolling; the terminal scrolls its output after each command.
    Element.prototype.scrollTo = jest.fn();
  });
  afterEach(() => jest.useRealTimers());

  // The input stays disabled while the boot animation plays, a chain of
  // awaited timeouts; the async advance runs each continuation in turn.
  const run = async (command: string) => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<Resources />);
    await act(() => jest.advanceTimersByTimeAsync(30_000));
    // Queried after booting: the framer-motion mock remounts on each render.
    const input = screen.getByRole("textbox");
    expect(input).toBeEnabled();
    await user.type(input, `${command}{Enter}`);
    await act(() => jest.advanceTimersByTimeAsync(5_000));
  };

  it("lists the same projects as the Projects page", async () => {
    await run("projects");
    for (const project of projectsData.projects) {
      expect(
        await screen.findByText(new RegExp(`\\d+\\. ${escape(project.title)}`)),
      ).toBeInTheDocument();
    }
  });

  it("shows a project's details by number", async () => {
    await run("project 1");
    expect(
      await screen.findByText(/An interactive terminal in the browser/),
    ).toBeInTheDocument();
  });

  it("links the club's email as an email, not as an Instagram handle", async () => {
    await run("contact");
    await screen.findByText(/Email:/);
    const hrefs = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));
    expect(hrefs).not.toContain("https://instagram.com/gmail");
    expect(hrefs).toContain("mailto:info.carletonai@gmail.com");
    expect(hrefs).toContain("https://www.instagram.com/carletonaisociety/");
  });

  it("links handles and LinkedIn paths without repeating their text", async () => {
    await run("join");
    expect(
      await screen.findByRole("link", { name: "@carletonaisociety" }),
    ).toHaveAttribute("href", "https://instagram.com/carletonaisociety");
    const linkedin = screen.getByRole("link", {
      name: "/company/carleton-ai",
    });
    expect(linkedin).toHaveAttribute(
      "href",
      "https://linkedin.com/company/carleton-ai",
    );
    expect(linkedin.nextSibling?.textContent ?? "").not.toMatch(/^company/);
  });

  it.each(["ascii __proto__", "theme constructor", "game __proto__"])(
    "treats %s as an unknown name instead of an object key",
    async (command) => {
      await run(command);
      expect(
        await screen.findByText(/Available (art|themes|games)/),
      ).toBeInTheDocument();
    },
  );

  it("reports only numbers counted from the site's data", async () => {
    await run("stats");
    expect(await screen.findByText(/Projects: 11/)).toBeInTheDocument();
    expect(screen.queryByText(/Papers|Coffee/)).not.toBeInTheDocument();
  });

  it("rejects event numbers that do not exist instead of crashing", async () => {
    await run("event 0");
    expect(
      await screen.findByText(/Please specify a valid event number/),
    ).toBeInTheDocument();
  });
});
