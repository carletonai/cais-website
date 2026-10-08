import {
  FaDiscord,
  FaGithub,
  FaInstagram,
  FaLinkedin,
  FaYoutube,
} from "react-icons/fa";
import { MailIcon } from "lucide-react";

export const DISCORD_URL = "https://discord.gg/gCs3v653de";
export const INSTAGRAM_URL = "https://www.instagram.com/carletonaisociety/";
export const EMAIL = "info.carletonai@gmail.com";
export const CONSTITUTION_URL = "/constitution.pdf";

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
