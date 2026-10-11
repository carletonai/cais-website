import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import CommandPalette from "./CommandPalette";

// Which events count as upcoming depends on the date: Ottawa, the afternoon
// before Intro to Agentic AI, unless a test moves the clock first.
beforeEach(() => {
  jest.useFakeTimers({ now: new Date("2026-10-08T16:00:00-04:00") });
});

afterEach(() => {
  jest.useRealTimers();
});

const Where = () => <p data-testid="path">{useLocation().pathname}</p>;

const setup = () => {
  const onOpenChange = jest.fn();
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  render(
    <MemoryRouter>
      <CommandPalette open onOpenChange={onOpenChange} />
      <Routes>
        <Route path="*" element={<Where />} />
      </Routes>
    </MemoryRouter>,
  );
  return { user, onOpenChange };
};

test("finds a past workshop by what it covered and opens its page", async () => {
  const { user, onOpenChange } = setup();
  const search = screen.getByRole("combobox", { name: /Search/ });
  await user.type(search, "hack the hill");

  const first = screen.getAllByRole("option")[0];
  expect(first).toHaveTextContent(
    "Machine Learning Workshop at Hack the Hill III",
  );
  expect(first).toHaveAttribute("aria-selected", "true");

  await user.keyboard("{Enter}");
  expect(onOpenChange).toHaveBeenCalledWith(false);
  expect(screen.getByTestId("path")).toHaveTextContent(
    "/events/63-machine-learning-workshop-at-hack-the-hill-iii",
  );
});

test("moves through results with the arrow keys", async () => {
  const { user } = setup();
  const search = screen.getByRole("combobox", { name: /Search/ });
  await user.type(search, "team");
  await user.keyboard("{ArrowDown}");
  const options = screen.getAllByRole("option");
  expect(options[1]).toHaveAttribute("aria-selected", "true");
  expect(search).toHaveAttribute("aria-activedescendant", options[1].id);
});

test("finds people from past teams", async () => {
  const { user } = setup();
  await user.type(screen.getByRole("combobox"), "hamzah");
  expect(
    screen.getByRole("option", { name: /Hamzah Hamad/ }),
  ).toHaveTextContent("President · 2025–26");
});

test("says when nothing matches", async () => {
  const { user } = setup();
  await user.type(screen.getByRole("combobox"), "zzzzqx");
  expect(screen.getByRole("status")).toHaveTextContent("Nothing matches");
});

test("puts the newest of equally good matches first", async () => {
  const { user } = setup();
  await user.type(screen.getByRole("combobox"), "agentic");
  expect(screen.getAllByRole("option")[0]).toHaveTextContent(
    "Intro to Agentic AI",
  );
});

test("files what is still to come under Upcoming, and the rest under Events", async () => {
  const { user } = setup();
  await user.type(screen.getByRole("combobox"), "agentic");
  const upcoming = screen.getByRole("group", { name: "Upcoming" });
  expect(
    within(upcoming).getByRole("option", { name: /Intro to Agentic AI/ }),
  ).toHaveTextContent("Fri, Oct 9, 2026 · 6:00–7:00 PM · Workshop");
});

test("moves an event into Events once it has happened", async () => {
  jest.setSystemTime(new Date("2026-12-01T12:00:00-05:00"));
  const { user } = setup();
  await user.type(screen.getByRole("combobox"), "agentic");
  expect(
    screen.queryByRole("group", { name: "Upcoming" }),
  ).not.toBeInTheDocument();
  expect(
    within(screen.getByRole("group", { name: "Events" })).getByRole("option", {
      name: /Intro to Agentic AI/,
    }),
  ).toBeInTheDocument();
});

test("opens with the next events and the pages before anything is typed", () => {
  setup();
  const groups = screen
    .getAllByRole("group")
    .map((group) => group.getAttribute("aria-label"));
  expect(groups).toEqual(["Upcoming", "Pages"]);
  expect(
    within(screen.getByRole("group", { name: "Upcoming" })).getAllByRole(
      "option",
    )[0],
  ).toHaveTextContent("Intro to Agentic AI");
});

test("opens an outside link in a new tab and closes", async () => {
  const open = jest.spyOn(window, "open").mockImplementation(() => null);
  const { user, onOpenChange } = setup();
  await user.type(screen.getByRole("combobox"), "instagram");
  await user.click(screen.getByRole("option", { name: /CAIS on Instagram/ }));
  expect(open).toHaveBeenCalledWith(
    "https://www.instagram.com/carletonaisociety/",
    "_blank",
    "noopener,noreferrer",
  );
  expect(onOpenChange).toHaveBeenCalledWith(false);
  open.mockRestore();
});

test("Escape closes it", async () => {
  const { user, onOpenChange } = setup();
  await user.keyboard("{Escape}");
  expect(onOpenChange).toHaveBeenCalledWith(false);
});
