import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ContactPage from "./contact";

test("offers the club's email and Discord", () => {
  render(
    <MemoryRouter>
      <ContactPage />
    </MemoryRouter>,
  );
  expect(
    screen.getByRole("heading", { level: 1, name: "Contact" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: /info\.carletonai@gmail\.com/ }),
  ).toHaveAttribute("href", "mailto:info.carletonai@gmail.com");
  expect(screen.getByRole("link", { name: /Discord/ })).toHaveAttribute(
    "href",
    "https://discord.gg/gCs3v653de",
  );
});
