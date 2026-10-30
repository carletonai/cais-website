import constitution from "@/data/constitution.json";

/**
 * The constitution in src/data/constitution.json, reproduced from the PDF
 * at public/constitution.pdf. Each article's `content` is a list of blocks,
 * in order: a string is a paragraph, `{ heading }` a sub-heading within the
 * article ("Elections"), and `{ items }` a numbered list of clauses.
 *
 * A clause is a string, or `{ text, items }` when it has sub-clauses of its
 * own: clauses are numbered 1, 2, 3; their sub-clauses a, b, c; and theirs
 * i, ii, iii. `marker: "bullet"` on a list, or on a clause, bullets its
 * items instead, as the PDF does for the quorum rule.
 */
export type Clause =
  string | { text: string; items: Clause[]; marker?: string };

export type Block =
  string | { heading: string } | { items: Clause[]; marker?: string };

export interface Article {
  /** Its roman numeral: "I", "II", … "XI". */
  number: string;
  title: string;
  content: Block[];
}

const data: {
  title: string;
  /** The year of the version the page reproduces. */
  edition: string;
  articles: Article[];
} = constitution;

export const { title, edition, articles } = data;

/** The anchor of an article on /constitution: "article-i", "article-viii". */
export const articleId = (article: Pick<Article, "number">) =>
  `article-${article.number.toLowerCase()}`;
