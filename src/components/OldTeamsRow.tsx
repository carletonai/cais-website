import React from "react";

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
    <div className="mt-24">
      <h2 className="text-3xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
        Previous Teams
      </h2>
      <div className="space-y-16">
        {teams.map((team) => (
          <div key={team.year} className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-center text-primary">{team.year}</h3>
            <div className="flex flex-wrap justify-center gap-6">
              {team.members.filter(m => m.name).map((member) => (
                <div
                  key={member.name + member.title}
                  className="flex flex-col items-center bg-neutral-900/80 rounded-2xl p-4 w-56 border border-neutral-800"
                >
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-24 h-24 object-cover rounded-xl border border-neutral-700 mb-2"
                  />
                  <div className="text-center">
                    <div className="font-semibold text-neutral-200">{member.name}</div>
                    <div className="text-primary text-sm mb-1">{member.title}</div>
                    {member.description && (
                      <div className="text-neutral-400 text-xs mb-1">{member.description}</div>
                    )}
                    {member.linkedinURL && (
                      <a
                        href={member.linkedinURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-1 text-primary hover:underline"
                      >
                        LinkedIn
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OldTeamsRow;
