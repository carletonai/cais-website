import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { DiscordPresence } from "./DiscordPresence";
import { fetchPresence, parsePresence } from "@/lib/discord";
import { DISCORD_PRESENCE_URL } from "@/lib/links";

const answer = (body: unknown, ok = true) =>
  jest.fn().mockResolvedValue({ ok, json: async () => body });

const original = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = original;
  sessionStorage.clear();
});

describe("parsePresence", () => {
  it("reads Discord's approximate counts", () => {
    expect(
      parsePresence({
        code: "gCs3v653de",
        approximate_member_count: 1234,
        approximate_presence_count: 42,
      }),
    ).toEqual({ online: 42, members: 1234 });
  });

  it("gives nothing for an answer without counts", () => {
    expect(parsePresence({ code: "gCs3v653de" })).toBeNull();
    expect(
      parsePresence({ message: "Unknown Invite", code: 10006 }),
    ).toBeNull();
    expect(parsePresence(null)).toBeNull();
    expect(parsePresence("42")).toBeNull();
  });
});

describe("fetchPresence", () => {
  it("asks the invite endpoint and never throws", async () => {
    const fetch = answer({
      approximate_member_count: 1234,
      approximate_presence_count: 42,
    });
    globalThis.fetch = fetch;
    expect(await fetchPresence()).toEqual({ online: 42, members: 1234 });
    expect(fetch.mock.calls[0][0]).toBe(DISCORD_PRESENCE_URL);

    globalThis.fetch = answer({ message: "rate limited" }, false);
    expect(await fetchPresence()).toBeNull();

    globalThis.fetch = jest.fn().mockRejectedValue(new TypeError("offline"));
    expect(await fetchPresence()).toBeNull();
  });
});

describe("DiscordPresence", () => {
  it("says how many are online once Discord answers", async () => {
    globalThis.fetch = answer({
      approximate_member_count: 1234,
      approximate_presence_count: 42,
    });
    render(<DiscordPresence />);
    expect(
      await screen.findByText(/42 online now · 1,234 members on Discord/),
    ).toBeInTheDocument();
  });

  it("shows nothing when Discord cannot be reached", async () => {
    const fetch = jest.fn().mockRejectedValue(new TypeError("blocked"));
    globalThis.fetch = fetch;
    const { container } = render(<DiscordPresence />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("remembers the answer for the session, so a second visit asks nothing", async () => {
    const fetch = answer({
      approximate_member_count: 1234,
      approximate_presence_count: 42,
    });
    globalThis.fetch = fetch;
    const first = render(<DiscordPresence />);
    await screen.findByText(/42 online now/);
    first.unmount();

    render(<DiscordPresence />);
    expect(screen.getByText(/42 online now/)).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
