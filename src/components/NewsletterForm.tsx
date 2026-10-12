import { MailIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { newsletterAction } from "@/lib/links";
import { cn } from "@/lib/utils";

/**
 * The mailing-list sign-up, as a plain form: the browser posts the address
 * to Buttondown, which sends the confirmation email and shows its own
 * thank-you page, so the site needs no script, key or backend for it. The
 * production CSP allows the post (form-action in vercel.json).
 */
export function NewsletterForm({
  username,
  className,
}: {
  /** The club's Buttondown username (CONTRIBUTING.md, "Mailing list"). */
  username: string;
  className?: string;
}) {
  return (
    <form
      action={newsletterAction(username)}
      method="post"
      aria-labelledby="newsletter-heading"
      className={cn("max-w-md", className)}
    >
      <h3 id="newsletter-heading" className="text-lg">
        <label htmlFor="newsletter-email">Email updates</label>
      </h3>
      <p id="newsletter-hint" className="mt-1 text-sm text-muted-foreground">
        The term’s first workshop and the big events: a few emails a year, and
        unsubscribe any time.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          id="newsletter-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@cmail.carleton.ca"
          aria-describedby="newsletter-hint"
          className="h-11 w-full min-w-0 flex-1 rounded-full border border-input bg-card px-4 text-base text-foreground placeholder:text-muted-foreground"
        />
        {/* Marks where the subscriber came from, in Buttondown's list. */}
        <input type="hidden" name="tag" value="website" />
        <input type="hidden" name="embed" value="1" />
        <Button type="submit" className="shrink-0">
          <MailIcon aria-hidden="true" />
          Subscribe
        </Button>
      </div>
    </form>
  );
}
