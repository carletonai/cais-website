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

/** "Carleton Computer Science Society" -> "CCSS", for a partner without a logo. */
export const partnerInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter((word) => /^[A-Z]/.test(word))
    .map((word) => word[0])
    .join("")
    .slice(0, 4);
