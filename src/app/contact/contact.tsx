import React from "react";
import { SocialIcon } from "react-social-icons";

const SOCIAL_LINKS = [
  {
    label: "Instagram",
    url: "https://www.instagram.com/carletonaisociety/",
  },
  {
    label: "Discord",
    url: "https://discord.gg/Ar3JpVZE6t",
  },
  {
    label: "LinkedIn",
    url: "https://www.linkedin.com/company/carleton-ai",
  },
  {
    label: "YouTube",
    url: "https://www.youtube.com/channel/UCWKRnTa68hlHrW6WYCgCNaw",
  },
];

const ContactPage = () => (
  <div className="min-h-screen flex items-center py-20">
    <div className="container mx-auto px-4">
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
        <p className="text-lg text-muted-foreground">
          Get in touch with the CAIS team.
        </p>
        <div className="mt-6">
          <a
            className="inline-flex items-center rounded-md bg-primary px-10 py-5 text-lg font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            target="_blank"
            rel="noopener noreferrer"
            href="https://forms.gle/3xCK7fCbGcZXGr1d6"
          >
            Become a Member
          </a>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          {SOCIAL_LINKS.map((link) => (
            <a
              key={link.url}
              className="inline-flex items-center gap-3 rounded-md border border-border bg-background/60 px-6 py-3 text-base font-semibold text-foreground shadow-sm transition-colors hover:bg-muted/70"
              target="_blank"
              rel="noopener noreferrer"
              href={link.url}
            >
              <SocialIcon
                url={link.url}
                className="h-6 w-6"
                style={{ height: 24, width: 24 }}
                bgColor="currentColor"
                fgColor="#0b0f1a"
              />
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default ContactPage;
