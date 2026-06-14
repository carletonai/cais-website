import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  CodeIcon,
  PresentationIcon,
  CalendarIcon,
  GlobeIcon,
  BookOpenIcon,
  MegaphoneIcon,
} from "lucide-react";

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

const Contribute = () => {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-4xl font-bold mb-6">Get Involved</h1>

      <p className="text-lg text-muted-foreground mb-12">
        Interested in artificial intelligence? There are many ways to get
        involved with the Carleton Artificial Intelligence Society (CAIS),
        whether you're completely new to AI or already building projects.
      </p>

      <div className="space-y-8">
        <div className="p-6 rounded-lg border">
          <h2 className="text-2xl font-semibold mb-2">Attend Our Events</h2>
          <p className="text-muted-foreground">
            Join our workshops, panels, networking events, and technical
            sessions to learn about artificial intelligence and connect with
            other students.
          </p>
        </div>

        <div className="p-6 rounded-lg border">
          <h2 className="text-2xl font-semibold mb-2">Work on Projects</h2>
          <p className="text-muted-foreground">
            Participate in AI-related projects, hackathons, and collaborative
            initiatives to gain hands-on experience and build your portfolio.
          </p>
        </div>

        <div className="p-6 rounded-lg border">
          <h2 className="text-2xl font-semibold mb-2">Volunteer</h2>
          <p className="text-muted-foreground">
            Help organize events, support workshops, and contribute to the
            growth of the CAIS community.
          </p>
        </div>

        <div className="p-6 rounded-lg border">
          <h2 className="text-2xl font-semibold mb-2">
            Join the Executive Team
          </h2>
          <p className="text-muted-foreground">
            Executive recruitment takes place periodically throughout the year.
            Follow our announcements and social media channels for opportunities
            to apply.
          </p>
        </div>

        <div className="p-6 rounded-lg border">
          <h2 className="text-2xl font-semibold mb-2">Contact Us</h2>
          <p className="text-muted-foreground">
            Have questions or ideas? We'd love to hear from you. Reach out to
            the CAIS team through our social media channels or at one of our
            events.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Contribute;
