import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventPoster } from "./EventPoster";

const withoutPoster = {
  image: "/assets/events/neural-networks.svg",
  title: "Training an AI Model!",
};

const withPoster = {
  ...withoutPoster,
  poster: "/assets/events/icebreaker-2026.jpg",
  title: "CAIS Icebreaker",
};

test("offers no enlarge control when the event has no poster", () => {
  render(<EventPoster {...withoutPoster} />);

  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});

test("names the event in the enlarge control's label", () => {
  render(<EventPoster {...withPoster} />);

  expect(
    screen.getByRole("button", { name: /enlarge poster for CAIS Icebreaker/i }),
  ).toBeInTheDocument();
});

test("shows the full poster in a dialog once the enlarge control is clicked", async () => {
  const user = userEvent.setup();
  render(<EventPoster {...withPoster} />);

  await user.click(screen.getByRole("button", { name: /enlarge poster/i }));

  const dialog = screen.getByRole("dialog");
  expect(
    within(dialog).getByAltText("Poster for CAIS Icebreaker"),
  ).toBeInTheDocument();
});

test("shows only the poster, which closes the dialog when clicked", async () => {
  const user = userEvent.setup();
  render(<EventPoster {...withPoster} />);

  await user.click(screen.getByRole("button", { name: /enlarge poster/i }));

  const dialog = screen.getByRole("dialog");
  expect(within(dialog).getAllByRole("button")).toHaveLength(1);

  await user.click(
    within(dialog).getByRole("button", { name: "Close poster" }),
  );
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
