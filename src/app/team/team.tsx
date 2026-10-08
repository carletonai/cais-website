import { Link } from "react-router-dom";
import { ArrowRightIcon } from "lucide-react";
import { PageHeader } from "@/components/brand/PageHeader";
import { Section, SectionHeader } from "@/components/brand/Section";
import { MemberGrid } from "@/components/MemberCard";
import { Button } from "@/components/ui/button";
import teamData from "@/data/team.json";

const TeamPage = () => (
  <>
    <PageHeader
      label="Team"
      title="Current Team"
      lede="The passionate individuals driving innovation and fostering AI education at Carleton University."
    />
    <Section labelledBy="exec-heading">
      <SectionHeader
        id="exec-heading"
        label="2026–27"
        title="Executive team"
        action={
          <Button asChild variant="outline">
            <Link to="/team/past">
              Meet our past teams
              <ArrowRightIcon aria-hidden="true" />
            </Link>
          </Button>
        }
      />
      <MemberGrid members={teamData.members} />
    </Section>
  </>
);

export default TeamPage;
