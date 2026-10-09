import { seasonLabel } from "@/lib/utils";
import { type Member, MemberGrid } from "./MemberCard";

interface OldTeamsRowProps {
  teams: Array<{ year: string; members: Member[] }>;
}

/** Every past executive team, newest first, each under its year. */
const OldTeamsRow = ({ teams }: OldTeamsRowProps) => (
  <div className="space-y-14">
    {teams.map((team) => (
      <section key={team.year} aria-labelledby={`team-${team.year}`}>
        <h2
          id={`team-${team.year}`}
          className="font-display mb-6 border-b border-border pb-3 text-3xl"
        >
          {seasonLabel(team.year)}
        </h2>
        <MemberGrid members={team.members} />
      </section>
    ))}
  </div>
);

export default OldTeamsRow;
