import {
  FaDiscord,
  FaGithub,
  FaInstagram,
  FaLinkedin,
  FaYoutube,
} from "react-icons/fa";
import { MailIcon } from "lucide-react";

const DISCORD_INVITE = "gCs3v653de";
export const DISCORD_URL = `https://discord.gg/${DISCORD_INVITE}`;
/**
 * Discord describes a server to anyone holding an invite, member and online
 * counts included, with no key: the home page's "42 online now". The
 * production CSP lets the page ask (connect-src in vercel.json).
 */
export const DISCORD_PRESENCE_URL = `https://discord.com/api/v10/invites/${DISCORD_INVITE}?with_counts=true`;
export const INSTAGRAM_URL = "https://www.instagram.com/carletonaisociety/";
export const EMAIL = "info.carletonai@gmail.com";
export const CONSTITUTION_URL = "/constitution.pdf";

/**
 * The Buttondown account the home page's email field subscribes people to,
 * or null until the club has one: the field is not shown until it is set.
 * Setting it up: CONTRIBUTING.md, "Mailing list".
 */
export const NEWSLETTER_USERNAME: string | null = "cais";

/** Where Buttondown's plain form posts a new subscriber. */
export const newsletterAction = (username: string) =>
  `https://buttondown.com/api/emails/embed-subscribe/${encodeURIComponent(username)}`;

/** Every place to find the club, in the order the site lists them. */
export const SOCIAL_LINKS = [
  {
    label: "Discord",
    handle: "CAIS Discord",
    url: DISCORD_URL,
    icon: FaDiscord,
  },
  {
    label: "Instagram",
    handle: "@carletonaisociety",
    url: INSTAGRAM_URL,
    icon: FaInstagram,
  },
  {
    label: "LinkedIn",
    handle: "Carleton AI Society",
    url: "https://www.linkedin.com/company/carleton-ai",
    icon: FaLinkedin,
  },
  {
    label: "YouTube",
    handle: "CAIS YouTube",
    url: "https://www.youtube.com/channel/UCWKRnTa68hlHrW6WYCgCNaw",
    icon: FaYoutube,
  },
  {
    label: "GitHub",
    handle: "@carletonai",
    url: "https://github.com/carletonai",
    icon: FaGithub,
  },
  {
    label: "Email",
    handle: EMAIL,
    url: `mailto:${EMAIL}`,
    icon: MailIcon,
  },
] as const;
