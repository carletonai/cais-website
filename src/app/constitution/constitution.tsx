import { Link } from "react-router-dom";
import { DownloadIcon } from "lucide-react";
import { PageHeader } from "@/components/brand/PageHeader";
import { Section } from "@/components/brand/Section";
import { Button } from "@/components/ui/button";
import {
  type Article,
  type Block,
  type Clause,
  articleId,
  articles,
  edition,
} from "@/lib/constitution";
import { CONSTITUTION_PDF_URL } from "@/lib/links";
import { cn } from "@/lib/utils";

/** Clauses count 1, 2, 3; sub-clauses a, b, c; and theirs i, ii, iii. */
const NUMBERING = ["list-decimal", "list-[lower-alpha]", "list-[lower-roman]"];

const isBulleted = (clause: Clause) =>
  typeof clause !== "string" && clause.marker === "bullet";

/** A list of clauses, each with its own sub-clauses nested beneath it. */
function ClauseList({
  items,
  depth,
  bullet = false,
}: {
  items: Clause[];
  depth: number;
  bullet?: boolean;
}) {
  const List = bullet ? "ul" : "ol";
  return (
    <List
      className={cn(
        "mt-3 space-y-3 pl-7 marker:font-mono marker:text-sm marker:text-muted-foreground",
        bullet ? "list-disc" : NUMBERING[Math.min(depth, NUMBERING.length - 1)],
      )}
    >
      {items.map((clause, i) => {
        const text = typeof clause === "string" ? clause : clause.text;
        const children = typeof clause === "string" ? undefined : clause.items;
        return (
          <li key={i} className="pl-1.5 leading-relaxed">
            {/* A clause that introduces sub-clauses reads as their heading. */}
            <span
              className={
                children
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              }
            >
              {text}
            </span>
            {children && (
              <ClauseList
                items={children}
                depth={depth + 1}
                bullet={isBulleted(clause)}
              />
            )}
          </li>
        );
      })}
    </List>
  );
}

function ArticleBody({ content }: { content: Block[] }) {
  return content.map((block, i) =>
    typeof block === "string" ? (
      <p key={i} className="mt-4 leading-relaxed text-muted-foreground">
        {block}
      </p>
    ) : "heading" in block ? (
      <h3 key={i} className="mt-7 text-lg">
        {block.heading}
      </h3>
    ) : (
      <ClauseList
        key={i}
        items={block.items}
        depth={0}
        bullet={block.marker === "bullet"}
      />
    ),
  );
}

function ArticleSection({ article }: { article: Article }) {
  const id = articleId(article);
  return (
    <article
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-24 py-12 first:pt-0 last:pb-0"
    >
      <p className="label-mono text-primary">Article {article.number}</p>
      <h2 id={`${id}-title`} className="mt-2 text-2xl sm:text-3xl">
        {article.title}
      </h2>
      <ArticleBody content={article.content} />
    </article>
  );
}

const Constitution = () => (
  <>
    <PageHeader
      label="Team / Constitution"
      title="Constitution"
      lede="The document that sets out how CAIS is run: what the club is for, who can join, what each executive is responsible for, how meetings and elections work, and how any of it can be changed."
    >
      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
        <Button asChild variant="outline" size="sm">
          <a href={CONSTITUTION_PDF_URL} download>
            <DownloadIcon aria-hidden="true" />
            Download PDF
          </a>
        </Button>
        <p className="label-mono text-muted-foreground">
          {edition} edition · {articles.length} articles
        </p>
      </div>
    </PageHeader>

    <Section>
      <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-x-16">
        <nav
          aria-label="Contents"
          className="mb-12 lg:sticky lg:top-24 lg:mb-0 lg:max-h-[calc(100dvh-7rem)] lg:self-start lg:overflow-y-auto"
        >
          <p className="label-mono text-primary">Contents</p>
          <ol className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1">
            {articles.map((article) => (
              <li key={article.number}>
                <Link
                  to={`#${articleId(article)}`}
                  className="flex min-h-11 items-center gap-3 rounded-lg py-2 pr-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <span
                    aria-hidden="true"
                    className="w-7 shrink-0 font-mono text-xs"
                  >
                    {article.number}
                  </span>
                  {article.title}
                </Link>
              </li>
            ))}
          </ol>
        </nav>

        <div className="max-w-[58ch] divide-y divide-border">
          {articles.map((article) => (
            <ArticleSection key={article.number} article={article} />
          ))}
          <p className="pt-10 text-sm text-muted-foreground">
            Any member can propose an amendment; it goes to a vote of the
            general membership at the annual general meeting (Article X). To
            raise one,{" "}
            <Link
              to="/contact"
              className="text-primary underline underline-offset-4 hover:decoration-2"
            >
              get in touch
            </Link>{" "}
            with the executive team.
          </p>
        </div>
      </div>
    </Section>
  </>
);

export default Constitution;
