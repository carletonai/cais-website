import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { articleId, articles } from "@/lib/constitution";
import Constitution from "./constitution";

const renderConstitution = () =>
  render(
    <MemoryRouter initialEntries={["/constitution"]}>
      <Constitution />
    </MemoryRouter>,
  );

describe("Constitution", () => {
  it("renders the page with a link to the PDF it reproduces", () => {
    renderConstitution();
    expect(
      screen.getByRole("heading", { level: 1, name: "Constitution" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Download PDF/ })).toHaveAttribute(
      "href",
      "/constitution.pdf",
    );
  });

  it("lists every article in the contents, each linking to its own anchor", () => {
    renderConstitution();
    const contents = screen.getByRole("navigation", { name: "Contents" });
    const links = within(contents).getAllByRole("link");
    expect(links).toHaveLength(articles.length);
    articles.forEach((article, i) => {
      expect(links[i]).toHaveAccessibleName(article.title);
      expect(links[i]).toHaveAttribute(
        "href",
        `/constitution#${articleId(article)}`,
      );
      const target = document.getElementById(articleId(article));
      expect(target).not.toBeNull();
      expect(
        within(target as HTMLElement).getByRole("heading", { level: 2 }),
      ).toHaveTextContent(article.title);
    });
  });

  it("keeps the articles in the order of the document, I to XI", () => {
    renderConstitution();
    const titles = screen
      .getAllByRole("heading", { level: 2 })
      .map((heading) => heading.textContent);
    expect(titles).toEqual(articles.map((article) => article.title));
    expect(articles.map((article) => article.number)).toEqual([
      "I",
      "II",
      "III",
      "IV",
      "V",
      "VI",
      "VII",
      "VIII",
      "IX",
      "X",
      "XI",
    ]);
  });

  it("numbers clauses, sub-clauses and their sub-clauses the way the document does", () => {
    renderConstitution();
    const succession = document.getElementById("article-viii") as HTMLElement;
    const [clauses] = within(succession).getAllByRole("list");
    expect(clauses).toHaveClass("list-decimal");
    const [subClauses] = within(clauses).getAllByRole("list");
    expect(subClauses).toHaveClass("list-[lower-alpha]");
    const [individuals] = within(subClauses).getAllByRole("list");
    expect(individuals).toHaveClass("list-[lower-roman]");
    expect(within(individuals).getAllByRole("listitem")).toHaveLength(4);
  });

  it("bullets the quorum rule, as the document does", () => {
    renderConstitution();
    const quorum = screen.getByText("Quorum of the General Membership");
    const bullets = within(quorum.closest("li") as HTMLElement).getByRole(
      "list",
    );
    expect(bullets.tagName).toBe("UL");
    expect(bullets).toHaveClass("list-disc");
  });

  it("reproduces the document's own words", () => {
    renderConstitution();
    expect(
      screen.getByText(
        /all other assets shall be given to the Ottawa Food Bank/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("The Vice-President Projects/Technology shall:"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Day 17 - Results announced/)).toBeInTheDocument();
  });
});
