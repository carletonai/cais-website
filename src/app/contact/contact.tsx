import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowUpRightIcon, MailIcon } from "lucide-react";
import { FaDiscord, FaInstagram, FaLinkedin, FaYoutube } from "react-icons/fa";

const SOCIAL_LINKS = [
  {
    label: "Discord",
    handle: "CAIS Discord",
    url: "https://discord.gg/Ar3JpVZE6t",
    icon: FaDiscord,
    hoverColor: "hover:border-indigo-500/50 hover:shadow-indigo-500/10",
    iconColor: "text-indigo-400",
  },
  {
    label: "Instagram",
    handle: "@carletonaisociety",
    url: "https://www.instagram.com/carletonaisociety/",
    icon: FaInstagram,
    hoverColor: "hover:border-pink-500/50 hover:shadow-pink-500/10",
    iconColor: "text-pink-400",
  },
  {
    label: "LinkedIn",
    handle: "Carleton AI Society",
    url: "https://www.linkedin.com/company/carleton-ai",
    icon: FaLinkedin,
    hoverColor: "hover:border-blue-500/50 hover:shadow-blue-500/10",
    iconColor: "text-blue-400",
  },
  {
    label: "YouTube",
    handle: "CAIS YouTube",
    url: "https://www.youtube.com/channel/UCWKRnTa68hlHrW6WYCgCNaw",
    icon: FaYoutube,
    hoverColor: "hover:border-red-500/50 hover:shadow-red-500/10",
    iconColor: "text-red-400",
  },
  {
    label: "Email",
    handle: "carletonaicontact@gmail.com",
    url: "mailto:carletonaicontact@gmail.com",
    icon: MailIcon,
    hoverColor: "hover:border-emerald-500/50 hover:shadow-emerald-500/10",
    iconColor: "text-emerald-400",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 },
  },
};

const ContactPage = () => (
  <div className="min-h-screen bg-background relative overflow-hidden">
    <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
    <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
    <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/20 to-background pointer-events-none" />
    <div className="absolute inset-0 bg-glow opacity-20 pointer-events-none" />
    <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />

    <div className="relative z-10 container mx-auto px-4 pt-28 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16 max-w-2xl mx-auto"
      >
        <p className="text-sm font-mono text-primary mb-4 tracking-widest uppercase">
          Reach Us
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-glow bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary/50 mb-4">
          Contact Us
        </h1>
        <p className="text-lg text-muted-foreground">
          Find us on your platform of choice or drop us an email.
        </p>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto"
      >
        {SOCIAL_LINKS.map(({ label, handle, url, icon: Icon, hoverColor, iconColor }) => (
          <motion.a
            key={url}
            variants={item}
            href={url}
            target={url.startsWith("mailto") ? undefined : "_blank"}
            rel="noopener noreferrer"
            className={`group relative flex items-center gap-4 p-5 rounded-xl bg-card/50 backdrop-blur-sm border border-primary/10 hover:translate-y-[-2px] hover:shadow-lg transition-all duration-200 ${hoverColor}`}
          >
            <div className="p-2.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors shrink-0">
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm">{label}</p>
              <p className="text-xs text-muted-foreground truncate">{handle}</p>
            </div>
            <ArrowUpRightIcon className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4" />
          </motion.a>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="flex justify-center mt-16"
      >
        <Button asChild size="lg" variant="default">
          <a
            href="https://forms.gle/3xCK7fCbGcZXGr1d6"
            target="_blank"
            rel="noopener noreferrer"
          >
            Become a Member
          </a>
        </Button>
      </motion.div>
    </div>
  </div>
);

export default ContactPage;
