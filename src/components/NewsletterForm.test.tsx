import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { NewsletterForm } from "./NewsletterForm";

test("posts the address straight to Buttondown, with where it came from", () => {
  render(<NewsletterForm username="carletonai" />);
  const form = screen.getByRole("form", { name: "Email updates" });
  expect(form).toHaveAttribute(
    "action",
    "https://buttondown.com/api/emails/embed-subscribe/carletonai",
  );
  expect(form).toHaveAttribute("method", "post");

  const email = screen.getByRole("textbox", { name: "Email updates" });
  expect(email).toHaveAttribute("type", "email");
  expect(email).toHaveAttribute("name", "email");
  expect(email).toBeRequired();
  expect(email).toHaveAccessibleDescription(/a few emails a year/);

  expect(form.querySelector('input[name="tag"]')).toHaveValue("website");
  expect(screen.getByRole("button", { name: "Subscribe" })).toHaveAttribute(
    "type",
    "submit",
  );
});
