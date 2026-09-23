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

  it("rejects event numbers that do not exist instead of crashing", async () => {
    await run("event 0");
    expect(
      await screen.findByText(/Please specify a valid event number/),
    ).toBeInTheDocument();
  });
});
