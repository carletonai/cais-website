import { FaLinkedin } from "react-icons/fa";
import MemberAvatar from "./MemberAvatar";

export interface Member {
  image: string;
  name: string;
  title: string;
  description?: string;
  linkedinURL?: string;
}

/** One executive: a ringed monogram (or photo), name, role and LinkedIn. */
export function MemberCard({ member }: { member: Member }) {
  return (
    <li className="flex flex-col items-center rounded-2xl border border-border bg-card p-6 text-center">
      <MemberAvatar
        name={member.name}
        image={member.image}
        className="size-24 rounded-full border-4 border-mark bg-background object-cover"
        monogramClassName="font-heading text-3xl font-bold text-foreground"
      />
      <h3 className="mt-4 text-lg leading-snug">{member.name}</h3>
      <p className="label-mono mt-2 text-primary">{member.title}</p>
      {member.description?.trim() && (
        <p className="mt-3 text-sm text-muted-foreground">
          {member.description}
        </p>
      )}
      {member.linkedinURL && (
        <a
          href={member.linkedinURL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <FaLinkedin aria-hidden="true" className="size-4" />
          LinkedIn
          <span className="sr-only">: {member.name} (opens in a new tab)</span>
        </a>
      )}
    </li>
  );
}

export function MemberGrid({ members }: { members: Member[] }) {
  return (
    <ul className="grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {members
        .filter((member) => member.name)
        .map((member) => (
          <MemberCard key={member.name + member.title} member={member} />
        ))}
    </ul>
  );
}
