import { ArrowUpRightIcon } from "lucide-react";
import { PageHeader } from "@/components/brand/PageHeader";
import { Section } from "@/components/brand/Section";
import { SOCIAL_LINKS } from "@/lib/links";

const ContactPage = () => (
  <>
    <PageHeader
      label="Contact"
      title="Contact Us"
      lede="Find us on your platform of choice or drop us an email. The Discord is the quickest way to reach the exec team."
    />
    <Section>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SOCIAL_LINKS.map(({ label, handle, url, icon: Icon }) => {
          const external = !url.startsWith("mailto:");
          return (
            <li key={url}>
              <a
                href={url}
                {...(external && {
                  target: "_blank",
                  rel: "noopener noreferrer",
                })}
                className="group flex min-h-24 items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-colors duration-150 hover:border-input"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-mark">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-heading text-lg font-bold">
                    {label}
                  </span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {handle}
                  </span>
                </span>
                <ArrowUpRightIcon
                  aria-hidden="true"
                  className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
                {external && (
                  <span className="sr-only"> (opens in a new tab)</span>
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </Section>
  </>
);

export default ContactPage;
