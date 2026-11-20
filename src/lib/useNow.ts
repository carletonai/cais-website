import {
  type ReactNode,
  createContext,
  createElement,
  startTransition,
  useContext,
  useEffect,
  useState,
} from "react";

const TICK = 15_000;

interface Clock {
  /** The time now, refreshed every TICK. */
  now: Date;
  /** When the page was opened: what "as the page loaded" means, held all
   *  session (the calendar's opening month). */
  openedAt: Date;
  /** Whether the clock has caught up with the real time. Before that (the
   *  build's render, and the browser's first render, which must match it),
   *  relative words such as "In 3 days" would be as of the build. */
  settled: boolean;
  /** One render after `settled`: from here on a live region's changes are
   *  the visitor's doing, not the clock catching up with the build. */
  live: boolean;
}

const NowContext = createContext<Clock | null>(null);

/** Calls `tick` every `intervalMs` while the tab is visible, and straight
 *  away when it comes back, so a tab left open since yesterday stays right. */
const useTicker = (tick: () => void, intervalMs: number, enabled: boolean) => {
  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    const start = () => {
      clearInterval(timer);
      timer = setInterval(tick, intervalMs);
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        tick();
        start();
      } else {
        clearInterval(timer);
      }
    };
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [tick, intervalMs, enabled]);
};

const fresh = (at: Date): Clock => ({
  now: at,
  openedAt: at,
  settled: true,
  live: true,
});

// A transition, not an urgent update: when the clock moves while a lazy page
// is still hydrating (its code on its way), React would otherwise throw the
// page's server HTML away and render it again from its loading fallback. A
// transition waits for the page to finish hydrating.
const advance = (setClock: (update: (clock: Clock) => Clock) => void) => () =>
  startTransition(() =>
    setClock((clock) => {
      const now = new Date();
      // The first catch-up: the page opens now, not at the build.
      if (!clock.settled)
        return { now, openedAt: now, settled: true, live: false };
      return { ...clock, now, live: true };
    }),
  );

/**
 * One clock for the whole page. A prerendered page was built at `initial`,
 * and its first render in the browser has to produce the same HTML for
 * hydration to adopt it, so the clock starts there and moves to the real
 * time right after, in an effect: the upcoming list and the calendar's today
 * then catch up a moment after load, and relative words ("In 3 days") and
 * countdowns, which the HTML leaves out, appear. Without `initial` (the dev
 * server, or a page rendered from scratch) it starts at now, settled.
 */
export function NowProvider({
  initial,
  children,
}: {
  initial?: Date;
  children: ReactNode;
}) {
  const [clock, setClock] = useState<Clock>(() =>
    initial
      ? { now: initial, openedAt: initial, settled: false, live: false }
      : fresh(new Date()),
  );
  const [tick] = useState(() => advance(setClock));
  useEffect(tick, [tick]);
  // Live regions turn on in the render after the catch-up, so the catch-up's
  // own changes (a new opening month, a new count) are not announced.
  const { settled, live } = clock;
  useEffect(() => {
    if (settled && !live) tick();
  }, [settled, live, tick]);
  useTicker(tick, TICK, true);
  return createElement(NowContext.Provider, { value: clock }, children);
}

/** The page's clock, or (outside a NowProvider: a component under test) one
 *  of its own that starts settled and ticks every `intervalMs`. */
const useClock = (intervalMs = 30_000): Clock => {
  const shared = useContext(NowContext);
  const [own, setOwn] = useState(() => fresh(new Date()));
  const [tick] = useState(() => advance(setOwn));
  useTicker(tick, intervalMs, shared === null);
  return shared ?? own;
};

/**
 * The current time, refreshed every `intervalMs` while the tab is visible and
 * straight away when it comes back, so countdowns and "happening now" stay
 * right in a tab left open since yesterday. Inside a NowProvider (the app)
 * every component reads the provider's clock, so they agree with each other
 * and with the prerendered HTML; without one (a component under test) it
 * keeps its own.
 */
export const useNow = (intervalMs = 30_000) => useClock(intervalMs).now;

/** When the page was opened, held for the whole visit. */
export const useOpenedAt = () => useClock().openedAt;

/** False while the page still shows the build's moment (see Clock.settled):
 *  words relative to now, and countdowns, wait for it. */
export const useClockSettled = () => useClock().settled;

/** Whether a live region's changes should be announced yet (Clock.live). */
export const useLiveRegions = () => useClock().live;
