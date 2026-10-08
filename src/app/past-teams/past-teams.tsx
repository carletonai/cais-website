import { PageHeader } from "@/components/brand/PageHeader";
import { Section } from "@/components/brand/Section";
import OldTeamsRow from "@/components/OldTeamsRow";
import oldTeamsData from "@/data/old-teams.json";

const PastTeamsPage = () => (
  <>
    <PageHeader
      label="Team / Past teams"
      title="Past Teams"
      lede="The executives who built CAIS before us, year by year."
    />
    <Section>
      <OldTeamsRow teams={oldTeamsData.teams} />
    </Section>
  </>
);

export default PastTeamsPage;
