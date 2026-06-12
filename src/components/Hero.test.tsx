import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter } from "react-router-dom";
import Hero from "./Hero";

const mockProps = {
  description: "Test Description",
  logoSrc: "/test-logo.png",
  primaryAction: {
    text: "Primary Action",
    to: "/primary",
  },
  secondaryAction: {
    text: "Secondary Action",
    to: "/secondary",
  },
};

const renderHero = (props = mockProps) => {
  return render(
    <BrowserRouter>
      <Hero {...props} />
    </BrowserRouter>,
  );
};

describe("Hero Component", () => {
  it("renders title and description", async () => {
    renderHero();

    expect(
      screen.getByRole("heading", { name: /Carleton\s+ΛI\s+Society/i }),
    ).toBeInTheDocument();

    const description = await screen.findByText(mockProps.description);
    expect(description).toBeInTheDocument();
  });

  it("renders the logo with correct attributes", () => {
    renderHero();
    const logo = screen.getByRole("img") as HTMLImageElement;
    expect(logo).toBeInTheDocument();
    expect(logo.src).toContain(mockProps.logoSrc);
    expect(logo.alt).toBe("CAIS Logo");
  });

  it("renders action buttons with correct text and links", () => {
    renderHero();
    const primaryButton = screen.getByText(mockProps.primaryAction.text);
    const secondaryButton = screen.getByText(mockProps.secondaryAction.text);

    expect(primaryButton).toBeInTheDocument();
    expect(secondaryButton).toBeInTheDocument();
    expect(primaryButton.closest("a")).toHaveAttribute(
      "href",
      mockProps.primaryAction.to,
    );
    expect(secondaryButton.closest("a")).toHaveAttribute(
      "href",
      mockProps.secondaryAction.to,
    );
  });
});
