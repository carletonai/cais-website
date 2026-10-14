import partnersData from "@/data/partners.json";

/** One entry in src/data/partners.json (see CONTRIBUTING, "Adding a partner"). */
export interface Partner {
  id: string;
  name: string;
  /** What they are to the club, in a few words. */
  blurb: string;
  url: string | null;
  /** Square, under public/assets/partners; null shows the name's initials. */
  logo: string | null;
}

export const partners: readonly Partner[] = partnersData.partners;

/**
 * What a partner without a logo shows: the acronym its name carries
 * ("Systems and Computer Engineering Society (SCESoc)" -> "SCESoc",
 * "CPA Ontario" -> "CPA"), or else its words' initials ("Builders
 * Collective Ottawa" -> "BCO").
 */
export const partnerInitials = (name: string) => {
  const acronym =
    /\(([A-Z][A-Za-z]{1,5})\)/.exec(name)?.[1] ??
    name.split(/\s+/).find((word) => /^[A-Z]{2,5}$/.test(word));
  if (acronym) return acronym;
  return name
    .split(/\s+/)
    .filter((word) => /^[A-Z]/.test(word))
    .map((word) => word[0])
    .join("")
    .slice(0, 4);
};
