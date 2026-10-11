import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

// The palette's code is split out and loads on first use, so each test waits
// for the dialog rather than expecting it synchronously.
const dialog = () => screen.findByRole("dialog", { name: "Search CAIS" });

afterEach(() => {
  window.history.pushState({}, "", "/");
});

test("a bare '/' opens search, but not while typing in a field", async () => {
  render(<App />);
  const field = document.createElement("input");
  document.body.append(field);
  field.focus();
  fireEvent.keyDown(field, { key: "/" });
  field.remove();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

  fireEvent.keyDown(document.body, { key: "/" });
  expect(await dialog()).toBeInTheDocument();
  expect(screen.getByRole("combobox")).toHaveFocus();
});

test("Ctrl+K opens search from anywhere on the page", async () => {
  render(<App />);
  fireEvent.keyDown(document.body, { key: "k", ctrlKey: true });
  expect(await dialog()).toBeInTheDocument();
});

test("the navbar's Search button opens the same palette", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getAllByRole("button", { name: "Search" })[0]);
  expect(await dialog()).toBeInTheDocument();
});
