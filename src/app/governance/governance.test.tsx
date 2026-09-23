import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Governance from "./governance";

const renderGovernance = () =>
  render(
    <MemoryRouter>
      <Governance />
    </MemoryRouter>,
  );

describe("Governance", () => {
  it("renders governance page", () => {
    renderGovernance();
    expect(
      screen.getByRole("heading", { level: 1, name: "Governance" }),
    ).toBeInTheDocument();
  });

  it("links to the rest of the Team tab and the constitution", () => {
    renderGovernance();
    const pages = screen.getByRole("navigation", { name: "Team pages" });

    expect(
      within(pages).getByRole("link", { name: /Current Team/ }),
    ).toHaveAttribute("href", "/team");
    expect(
      within(pages).getByRole("link", { name: /Past Teams/ }),
    ).toHaveAttribute("href", "/team/past");
    expect(
      within(pages).getByRole("link", { name: /Constitution/ }),
    ).toHaveAttribute("href", "/constitution.pdf");
  });
});
