import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventPhotos } from "./EventPhotos";

const event = {
  id: "62",
  title: "CAIS Hackathon 2.0",
  date: "2026-03-21",
  time: "",
  location: "Richcraft Hall 3228",
  description: "",
  type: "Competition",
  tags: [],
};

const photos = [
  {
    src: "/assets/events/cais-hackathon-2-2026/09.jpg",
    width: 1440,
    height: 1080,
    alt: "ThinkFirst in front of the first-place slide",
  },
  {
    src: "/assets/events/cais-hackathon-2-2026/12.jpg",
    width: 1440,
    height: 1080,
    alt: "Group photo of the participants",
  },
];

test("shows nothing for an event without photos", () => {
  const { container } = render(<EventPhotos event={event} />);
  expect(container).toBeEmptyDOMElement();
});

test("shows each photo from its 600px copy", () => {
  render(<EventPhotos event={{ ...event, photos }} />);

  const list = screen.getByRole("region", { name: "Photos" });
  const images = within(list).getAllByRole("img");
  expect(images.map((img) => img.getAttribute("src"))).toEqual([
    "/assets/events/cais-hackathon-2-2026/09-600.jpg",
    "/assets/events/cais-hackathon-2-2026/12-600.jpg",
  ]);
  expect(images[0]).toHaveAttribute("loading", "lazy");
});

test("opens a photo at full size and closes it again", async () => {
  const user = userEvent.setup();
  render(<EventPhotos event={{ ...event, photos }} />);

  await user.click(
    screen.getByRole("button", { name: /Enlarge photo: Group photo/ }),
  );
  const dialog = screen.getByRole("dialog", {
    name: "CAIS Hackathon 2.0, photo 2 of 2",
  });
  expect(
    within(dialog).getByAltText("Group photo of the participants"),
  ).toHaveAttribute("src", "/assets/events/cais-hackathon-2-2026/12.jpg");

  await user.click(within(dialog).getByRole("button", { name: "Close photo" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
