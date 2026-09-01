import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SocialIcon } from "react-social-icons";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FaDiscord } from "react-icons/fa";

const SOCIAL_LINKS = [
  {
    url: "https://www.instagram.com/carletonaisociety/",
    label: "Instagram",
    priority: false,
  },
  {
    url: "https://discord.gg/Ar3JpVZE6t",
    label: "Discord",
    priority: true,
  },
  {
    url: "https://www.linkedin.com/company/carleton-ai",
    label: "LinkedIn",
    priority: false,
  },
  {
    url: "https://www.youtube.com/channel/UCWKRnTa68hlHrW6WYCgCNaw",
    label: "YouTube",
    priority: false,
  },
];

interface ActionButton {
  text: string;
  to: string;
}

interface HeroProps {
  description: string;
  logoSrc: string;
  primaryAction?: ActionButton;
  secondaryAction?: ActionButton;
}

const animations = {
  container: {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2 },
    },
  },
  item: {
    hidden: { opacity: 0, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" as const },
    },
  },
};

export default function Hero({
  description,
  logoSrc,
  primaryAction,
  secondaryAction,
}: HeroProps) {
  const prefersReducedMotion = useReducedMotion();
  const [typedText, setTypedText] = useState("");
  const [typingSettled, setTypingSettled] = useState(false);

  // 2.3.3 / 2.2.2 — with reduced motion the copy is shown outright rather than
  // typed out one character at a time.
  const displayText = prefersReducedMotion ? description : typedText;
  const isTypingComplete = prefersReducedMotion || typingSettled;

  useEffect(() => {
    if (prefersReducedMotion) return;

    let cancelled = false;
    const typeText = async () => {
      for (let i = 0; i <= description.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 30));
        if (cancelled) return;
        setTypedText(description.slice(0, i));
      }
      setTypingSettled(true);
    };
    typeText();
    return () => {
      cancelled = true;
    };
  }, [description, prefersReducedMotion]);

  return (
    <div className="relative min-h-[85vh] bg-black overflow-hidden">
      <div className="absolute inset-0 bg-glow opacity-80" />
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/20 to-background" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

      <motion.div
        variants={animations.container}
        initial="hidden"
        animate="show"
        className="relative z-10 container mx-auto px-4 min-h-[85vh] flex flex-col justify-center pb-12 pt-16"
      >
        <div className="text-center space-y-8">
          <motion.img
            variants={animations.item}
            src={logoSrc}
            alt="CAIS Logo"
            className="h-24 md:h-32 lg:h-36 mx-auto drop-shadow-lg"
          />

          <motion.div variants={animations.item}>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80">
              Carleton{" "}
              <span className="text-primary font-mono inline-block mx-2 drop-shadow-[0_0_8px_rgba(226,56,63,0.35)]">
                ΛI
              </span>{" "}
              Society
            </h1>
          </motion.div>

          <motion.div
            variants={animations.item}
            className="mx-auto max-w-2xl text-center min-h-[3.5rem] h-[3.5rem] sm:min-h-[4.5rem] sm:h-[4.5rem] flex items-center justify-center"
          >
            <div className="px-4 sm:px-6">
              <p className="text-lg leading-8 text-muted-foreground">
                <span className="relative inline-block w-[80vw] max-w-xl sm:w-auto overflow-hidden text-ellipsis whitespace-nowrap sm:overflow-visible sm:whitespace-normal">
                  {displayText}
                  {!isTypingComplete && (
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="text-primary absolute -right-2 sm:relative sm:right-0 sm:ml-0.5"
                    >
                      |
                    </motion.span>
                  )}
                </span>
              </p>
            </div>
          </motion.div>

          <motion.div
            variants={animations.item}
            className="flex flex-wrap items-center justify-center gap-x-4 gap-y-4"
          >
            {SOCIAL_LINKS.filter((link) => link.priority).map(
              ({ url, label }) => (
                <Button
                  key={url}
                  size="lg"
                  variant="default"
                  className={`h-14 px-8 glass-hover group ${
                    label === "Discord"
                      ? "bg-brand hover:bg-brand/80 text-brand-foreground font-semibold shadow-md hover:shadow-xl hover:shadow-brand/20 hover:scale-[1.02] transition-all duration-300 ease-out border border-primary/20 relative overflow-hidden text-lg"
                      : ""
                  }`}
                  asChild
                >
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    {label === "Discord" ? (
                      <>
                        <FaDiscord className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                        Discord
                      </>
                    ) : (
                      <>View on {label}</>
                    )}
                  </a>
                </Button>
              ),
            )}
          </motion.div>

          <motion.div
            variants={animations.item}
            className="flex flex-wrap items-center justify-center gap-x-3 gap-y-3"
          >
            {SOCIAL_LINKS.filter((link) => !link.priority).map(
              ({ url, label }) => (
                <motion.div
                  key={url}
                  whileHover={{ scale: 1.05 }}
                  transition={{
                    type: "spring" as const,
                    stiffness: 400,
                    damping: 10,
                  }}
                >
                  <SocialIcon
                    url={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Carleton AI Society on ${label}`}
                    style={{ height: 44, width: 44 }}
                    bgColor="currentColor"
                    fgColor="#1a2238"
                  />
                </motion.div>
              ),
            )}
          </motion.div>

          {(primaryAction || secondaryAction) && (
            <motion.div
              variants={animations.item}
              className="flex flex-wrap justify-center gap-6"
            >
              {primaryAction && (
                <Button
                  asChild
                  variant="outline"
                  size="default"
                  className="h-11 px-6 glass-hover hover:bg-brand/5 hover:border-primary/50 transition-all duration-300"
                >
                  <Link to={primaryAction.to}>{primaryAction.text}</Link>
                </Button>
              )}
              {secondaryAction && (
                <Button
                  asChild
                  variant="outline"
                  size="default"
                  className="h-11 px-6 glass-hover hover:bg-brand/5 hover:border-primary/50 transition-all duration-300"
                >
                  <Link to={secondaryAction.to}>{secondaryAction.text}</Link>
                </Button>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
