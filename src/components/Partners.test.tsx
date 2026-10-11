import { render, screen, within } from "@testing-library/react";
import { partnerInitials, partners } from "@/lib/partners";
import { Partners } from "./Partners";

test("names every partner, linking the ones with a site", () => {
  render(<Partners />);
  const region = screen.getByRole("region", { name: "Who we build with" });
  const items = within(region).getAllByRole("listitem");
  expect(items).toHaveLength(partners.length);

  const linked = partners.filter((partner) => partner.url);
  const links = within(region).getAllByRole("link");
  expect(links).toHaveLength(linked.length);
  for (const partner of linked) {
    const link = within(region).getByRole("link", {
      name: new RegExp(`^${partner.name}.*opens in a new tab`),
    });
    expect(link).toHaveAttribute("href", partner.url);
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  }
  for (const partner of partners) {
    expect(within(region).getByText(partner.name)).toBeInTheDocument();
  }
});

test("shows a logo where there is one and initials where there is not", () => {
  render(<Partners />);
  const region = screen.getByRole("region", { name: "Who we build with" });
  const withLogo = partners.filter((partner) => partner.logo);
  // Logos are decorative: the name is text beside them.
  expect(region.querySelectorAll("img[alt='']")).toHaveLength(withLogo.length);
  for (const partner of partners.filter((partner) => !partner.logo)) {
    expect(
      within(region).getByText(partnerInitials(partner.name)),
    ).toHaveAttribute("aria-hidden", "true");
  }
});
