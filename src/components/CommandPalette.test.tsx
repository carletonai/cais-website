import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import CommandPalette from "./CommandPalette";

const Where = () => <p data-testid="path">{useLocation().pathname}</p>;

const setup = () => {
  const onOpenChange = jest.fn();
  const user = userEvent.setup();
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
