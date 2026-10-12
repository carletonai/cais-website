import { useDiscordPresence } from "@/lib/discord";
import { cn } from "@/lib/utils";

const number = new Intl.NumberFormat("en-CA");

/** "42 online now · 1,200 members", once Discord has answered; else nothing. */
export function DiscordPresence({ className }: { className?: string }) {
  const presence = useDiscordPresence();
  if (!presence) return null;
  return (
    <p className={cn("label-mono text-muted-foreground", className)}>
      <span
        aria-hidden="true"
        className="mr-2 inline-block size-2 rounded-full bg-online align-middle"
      />
      {number.format(presence.online)} online now ·{" "}
      {number.format(presence.members)} members on Discord
    </p>
  );
}
