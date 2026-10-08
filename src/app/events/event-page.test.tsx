import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import EventPage from "./event-page";

beforeEach(() => {
  jest.useFakeTimers({ now: new Date("2026-10-08T16:00:00-04:00") });
});
afterEach(() => jest.useRealTimers());

const Where = () => <p data-testid="path">{useLocation().pathname}</p>;

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/events/:slug" element={<EventPage />} />
        <Route path="/events" element={<p>All events</p>} />
      </Routes>
      <Where />
    </MemoryRouter>,
  );

test("shows one event with everything needed to go", () => {
  renderAt("/events/66-intro-to-agentic-ai");
  expect(
    screen.getByRole("heading", { level: 1, name: "Intro to Agentic AI" }),
  ).toBeInTheDocument();
  expect(screen.getByText("Fri, Oct 9, 2026")).toBeInTheDocument();
  expect(screen.getByText("6:00–7:00 PM")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Add to calendar" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Share Intro to Agentic AI" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", {
      name: /Enlarge poster for Intro to Agentic AI/,
    }),
  ).toBeInTheDocument();
});

test("links a past workshop's code", () => {
  renderAt("/events/63-machine-learning-workshop-at-hack-the-hill-iii");
  expect(
    screen.getByRole("link", {
      name: /Code on GitHub for Machine Learning Workshop at Hack the Hill III/,
    }),
  ).toHaveAttribute(
    "href",
    "https://github.com/carletonai/cais-workshop-hth-iii",
  );
  expect(
    screen.queryByRole("button", { name: "Add to calendar" }),
  ).not.toBeInTheDocument();
});

test("settles an old or partial slug on the current one", () => {
  renderAt("/events/66");
  expect(screen.getByTestId("path")).toHaveTextContent(
    "/events/66-intro-to-agentic-ai",
  );
});

test("sends unknown events to the events page", () => {
  renderAt("/events/999-nothing");
  expect(screen.getByTestId("path")).toHaveTextContent(/^\/events$/);
});
