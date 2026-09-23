import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter } from "react-router-dom";
import Navbar from "./Navbar";

const renderNavbar = () => {
  return render(
    <BrowserRouter>
      <Navbar />
    </BrowserRouter>,
  );
};

describe("Navbar Component", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("renders the logo", () => {
    renderNavbar();
    const logo = screen.getByAltText("CAIS Logo") as HTMLImageElement;
    expect(logo).toBeInTheDocument();
    expect(logo.src).toContain("logo.svg");
  });

  it("renders navigation links", () => {
    renderNavbar();
    const links = [
      "Home",
      "Events",
      "Projects",
      "Team",
      "Governance",
      "Current Team",
      "Past Teams",
      "Contact",
    ];
    links.forEach((link) => {
      expect(screen.getAllByText(link).length).toBeGreaterThan(0);
    });
  });

  it("shows mobile menu when hamburger button is clicked", () => {
    renderNavbar();
    const menuButton = screen.getByRole("button", { name: /open main menu/i });

    expect(
      screen.queryByRole("navigation", { name: /mobile/i }),
    ).not.toBeInTheDocument();

    fireEvent.click(menuButton);

    const mobileMenu = screen.getByTestId("mobile-menu");
    expect(mobileMenu).toBeInTheDocument();

    fireEvent.click(menuButton);
    expect(
      screen.queryByRole("navigation", { name: /mobile/i }),
    ).not.toBeInTheDocument();
  });

  it("drops the removed About and Get Involved tabs", () => {
    renderNavbar();
    expect(screen.queryByText("About")).not.toBeInTheDocument();
    expect(screen.queryByText("Get Involved")).not.toBeInTheDocument();
    expect(screen.queryByText("Resources")).not.toBeInTheDocument();
  });

  it("keeps the Team tab lit on every page under it", () => {
    window.history.pushState({}, "", "/team/past");
    renderNavbar();
    const [teamTab] = screen.getAllByRole("link", { name: "Team" });
    expect(teamTab.className).toContain("text-primary");
  });

  it("closes mobile menu when a link is clicked", () => {
    renderNavbar();
    const menuButton = screen.getByRole("button", { name: /open main menu/i });

    fireEvent.click(menuButton);

    const contactLink = screen.getAllByText("Contact")[1];
    fireEvent.click(contactLink);

    expect(
      screen.queryByRole("navigation", { name: /mobile/i }),
    ).not.toBeInTheDocument();
  });
});
