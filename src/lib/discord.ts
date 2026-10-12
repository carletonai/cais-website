import { useEffect, useState } from "react";
import { DISCORD_PRESENCE_URL } from "@/lib/links";

export interface Presence {
  /** Members online right now. */
  online: number;
  members: number;
}

const CACHE_KEY = "cais:discord-presence";
/** Discord's counts are approximate anyway; one fetch a session is plenty. */
const CACHE_MS = 5 * 60_000;

/** The counts in Discord's description of an invite, if they are there. */
export const parsePresence = (data: unknown): Presence | null => {
  if (!data || typeof data !== "object") return null;
  const {
    approximate_presence_count: online,
    approximate_member_count: members,
  } = data as Record<string, unknown>;
  if (typeof online !== "number" || typeof members !== "number") return null;
  if (online < 0 || members < 0) return null;
  return { online, members };
};

const cached = (): Presence | null => {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { at, online, members } = JSON.parse(raw);
    if (typeof at !== "number" || Date.now() - at > CACHE_MS) return null;
    return parsePresence({
      approximate_presence_count: online,
      approximate_member_count: members,
    });
  } catch {
    return null;
  }
};

const remember = (presence: Presence) => {
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ ...presence, at: Date.now() }),
    );
  } catch {
    /* private mode or storage full: just ask again next time */
  }
};

/**
 * Asks Discord's public invite API, which describes a server to anyone
 * holding an invite link and needs no key. Any failure (offline, blocked,
 * rate-limited, the invite revoked) is null: the page just says nothing.
 */
export async function fetchPresence(
  signal?: AbortSignal,
): Promise<Presence | null> {
  if (typeof fetch !== "function") return null;
  try {
    const response = await fetch(DISCORD_PRESENCE_URL, {
      signal,
      headers: { accept: "application/json" },
    });
    if (!response.ok) return null;
    return parsePresence(await response.json());
  } catch {
    return null;
  }
}

/** The server's counts: from this session's cache, else fetched once. */
export function useDiscordPresence() {
  const [presence, setPresence] = useState<Presence | null>(cached);

  useEffect(() => {
    if (presence) return;
    const controller = new AbortController();
    void fetchPresence(controller.signal).then((found) => {
      if (!found || controller.signal.aborted) return;
      remember(found);
      setPresence(found);
    });
    return () => controller.abort();
  }, [presence]);

  return presence;
}
