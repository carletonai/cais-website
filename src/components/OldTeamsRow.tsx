import React from "react";
import MemberAvatar from "./MemberAvatar";

interface OldTeamsRowProps {
  teams: Array<{
    year: string;
    members: Array<{
      image: string;
      name: string;
      title: string;
      linkedinURL?: string;
      description?: string;
    }>;
  }>;
}

const OldTeamsRow: React.FC<OldTeamsRowProps> = ({ teams }) => {
  return (
    <div>
      <div className="space-y-16">
        {teams.map((team) => (
          <section key={team.year} aria-label={`${team.year} team`}>
            <h2 className="text-2xl font-semibold mb-6 text-center text-primary">
              {team.year}
            </h2>
            <div className="flex flex-wrap justify-center gap-6">
              {team.members
                .filter((m) => m.name)
                .map((member) => (
                  <div
                    key={member.name + member.title}
                    className="flex flex-col items-center bg-neutral-900/80 rounded-2xl p-4 w-56 border border-neutral-800"
                  >
                    <MemberAvatar
                      name={member.name}
                      image={member.image}
                      className="w-24 h-24 object-cover rounded-xl border border-neutral-700 mb-2"
                      monogramClassName="text-2xl"
                    />
                    <div className="text-center">
                      <div className="font-semibold text-foreground">
                        {member.name}
                      </div>
                      <div className="text-primary text-sm mb-1">
                        {member.title}
                      </div>
                      {member.description && (
                        <div className="text-muted-foreground text-xs mb-1">
                          {member.description}
                        </div>
                      )}
                      {member.linkedinURL && (
                        <a
                          href={member.linkedinURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${member.name} on LinkedIn`}
                          className="inline-flex min-h-11 items-center mt-1 text-primary hover:underline"
                        >
                          LinkedIn
                        </a>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default OldTeamsRow;
