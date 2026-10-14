import { ArrowUpRightIcon } from "lucide-react";
import { Section, SectionHeader } from "@/components/brand/Section";
import { type Partner, partnerInitials, partners } from "@/lib/partners";

/** A partner's mark: its logo, or its initials until there is one. */
function PartnerMark({ partner }: { partner: Partner }) {
  if (partner.logo) {
    return (
      <img
        src={partner.logo}
        alt=""
        width={96}
        height={96}
        loading="lazy"
        decoding="async"
        className="size-16 rounded-xl bg-white object-contain sm:size-20"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex size-16 items-center justify-center rounded-xl border border-border bg-background font-mono text-base font-semibold tracking-wide text-primary sm:size-20"
    >
      {partnerInitials(partner.name)}
    </span>
  );
}

/** The organizations the club has run events with, on the home page. */
export function Partners() {
  if (partners.length === 0) return null;

  return (
    <Section id="partners" labelledBy="partners-heading">
      <SectionHeader
        id="partners-heading"
        label="Partners"
        title="Who we build with"
        lede="Clubs, student societies, hackathons and sponsors the society has worked with."
      />
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {partners.map((partner) => {
          const body = (
            <>
              <PartnerMark partner={partner} />
              <span className="mt-3 block text-sm font-semibold leading-snug">
                {partner.name}
                {partner.url && (
                  <ArrowUpRightIcon
                    aria-hidden="true"
                    className="ml-1 inline size-3.5 align-[-2px] text-muted-foreground"
                  />
                )}
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {partner.blurb}
              </span>
            </>
          );
          const className =
            "flex h-full flex-col items-center rounded-2xl border border-border bg-card p-4 text-center";

          return (
            <li key={partner.id}>
              {partner.url ? (
                <a
                  href={partner.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${className} transition-colors hover:border-primary/60 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring`}
                >
                  {body}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              ) : (
                <div className={className}>{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
