import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Hero from "./Hero";

// Ottawa, the afternoon before Intro to Agentic AI (Fri Oct 9, 6 PM).
beforeEach(() => {
  jest.useFakeTimers({ now: new Date("2026-10-08T16:00:00-04:00") });
});
afterEach(() => jest.useRealTimers());

const renderHero = () =>
  render(
    <MemoryRouter>
      <Hero />
    </MemoryRouter>,
  );

describe("Hero", () => {
  it("names the club in full, without cutting the pitch off", () => {
    renderHero();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /Carleton\s*AI\s*Society/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/A student club for anyone interested in AI/),
    ).toHaveTextContent(/share your interests\.$/);
  });

  it("offers joining and the events as links", () => {
    renderHero();
    expect(
      screen.getByRole("link", { name: /Join the Discord/ }),
    ).toHaveAttribute("href", "https://discord.gg/gCs3v653de");
    expect(
      screen.getByRole("link", { name: /See all events/ }),
    ).toHaveAttribute("href", "/events");
  });

  it("puts the next event in the first screen", () => {
    renderHero();
    const ticket = screen.getByRole("article", { name: /Intro to Agentic AI/ });
    expect(ticket).toHaveTextContent("Next up · Tomorrow · 6:00 PM");
    expect(ticket).toHaveTextContent("Fri, Oct 9");
    expect(ticket).toHaveTextContent("6:00–7:00 PM");
    expect(ticket).toHaveTextContent("CS Seminar Room, Herzberg");
    expect(ticket).toHaveTextContent(/Starts in 1 day, 2 hours and 0 minutes/);
    expect(
      within(ticket).getByRole("link", { name: "Intro to Agentic AI" }),
    ).toHaveAttribute("href", "/events/66-intro-to-agentic-ai");
  });
});
