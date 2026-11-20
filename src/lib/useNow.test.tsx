import { act, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { NextUp } from "@/components/events/NextUp";
import { type ClubEvent } from "@/lib/events";
import {
  NowProvider,
  useClockSettled,
  useLiveRegions,
  useNow,
  useOpenedAt,
} from "./useNow";

const built = new Date("2026-10-10T16:00:00Z");
const visited = new Date("2026-10-15T16:00:00Z");

beforeEach(() => jest.useFakeTimers({ now: visited }));
afterEach(() => jest.useRealTimers());

type Seen = { now: string; openedAt: string; settled: boolean; live: boolean };

const Probe = ({ seen }: { seen: Seen[] }) => {
  const now = useNow();
  const openedAt = useOpenedAt();
  const settled = useClockSettled();
  const live = useLiveRegions();
  seen.push({
    now: now.toISOString(),
    openedAt: openedAt.toISOString(),
    settled,
    live,
  });
  return null;
};

test("a prerendered page's clock starts at the build, then catches up, then turns live regions on", () => {
  const seen: Seen[] = [];
  render(
    <NowProvider initial={built}>
      <Probe seen={seen} />
    </NowProvider>,
  );
  expect(seen[0]).toEqual({
    now: built.toISOString(),
    openedAt: built.toISOString(),
    settled: false,
    live: false,
  });
  // The catch-up, and a second later live regions: they come on well after
  // the catch-up's own changes are on the page.
  const caughtUp = seen.findIndex((s) => s.settled);
  expect(seen[caughtUp]).toEqual({
    now: visited.toISOString(),
    openedAt: visited.toISOString(),
    settled: true,
    live: false,
  });
  act(() => jest.advanceTimersByTime(900));
  expect(seen.at(-1)).toMatchObject({ settled: true, live: false });
  act(() => jest.advanceTimersByTime(100));
  expect(seen.at(-1)).toMatchObject({
    openedAt: visited.toISOString(),
    settled: true,
    live: true,
  });
});

test("the time the page opened holds while the clock ticks", () => {
  const seen: Seen[] = [];
  render(
    <NowProvider initial={built}>
      <Probe seen={seen} />
    </NowProvider>,
  );
  act(() => jest.advanceTimersByTime(60_000));
  expect(seen.at(-1)).toMatchObject({
    now: new Date(visited.getTime() + 60_000).toISOString(),
    openedAt: visited.toISOString(),
  });
});

test("a page rendered in the browser from scratch starts settled", () => {
  const seen: Seen[] = [];
  render(
    <NowProvider>
      <Probe seen={seen} />
    </NowProvider>,
  );
  expect(seen[0]).toMatchObject({
    now: visited.toISOString(),
    settled: true,
    live: true,
  });
});

const meetup: ClubEvent = {
  id: "67",
  title: "Grok Bot Meetup – Ottawa",
  date: "2026-10-17",
  time: "6:00 PM - 10:00 PM",
  location: "Nicol Building",
  description: "An evening on AI agents.",
  type: "Social",
  tags: [],
};

test("a component opened after the catch-up holds the time it opened, not the page's", () => {
  const Opened = () => <p>{useOpenedAt().toISOString()}</p>;
  const { rerender, container } = render(
    <NowProvider initial={built}>{null}</NowProvider>,
  );
  act(() => jest.advanceTimersByTime(5 * 60_000));
  rerender(
    <NowProvider initial={built}>
      <Opened />
    </NowProvider>,
  );
  const opened = new Date(visited.getTime() + 5 * 60_000).toISOString();
  expect(container).toHaveTextContent(opened);
  act(() => jest.advanceTimersByTime(60_000));
  expect(container).toHaveTextContent(opened);
});

test("the prerendered HTML gives the date and no countdown, not words relative to the build", () => {
  const html = renderToString(
    <NowProvider initial={built}>
      <MemoryRouter>
        <NextUp events={[meetup]} />
      </MemoryRouter>
    </NowProvider>,
  );
  expect(html).toContain("Next up · Sat, Oct 17");
  expect(html).not.toContain("In 7 days");
  expect(html).not.toContain("Starts in");
  expect(html).toContain("--");
});

test("a page built during an event does not say it is on now", () => {
  const during = new Date("2026-10-17T23:00:00Z"); // 7 PM in Ottawa
  const html = renderToString(
    <NowProvider initial={during}>
      <MemoryRouter>
        <NextUp events={[meetup]} />
      </MemoryRouter>
    </NowProvider>,
  );
  expect(html).not.toContain("On now");
  expect(html).not.toContain("live-pulse");
  expect(html).not.toContain("Happening now");
  expect(html).toContain("Sat, Oct 17");
});

test("once the clock catches up, the browser says how far off it is", () => {
  const { container } = render(
    <NowProvider initial={built}>
      <MemoryRouter>
        <NextUp events={[meetup]} />
      </MemoryRouter>
    </NowProvider>,
  );
  expect(container).toHaveTextContent("Next up · In 2 days");
  expect(container).toHaveTextContent(
    /Starts in 2 days, 6 hours and 0 minutes/,
  );
});
