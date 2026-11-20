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
const NowContext = createContext<Date | null>(null);

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

// A transition, not an urgent update: when the clock moves while a lazy page
// is still hydrating (its code on its way), React would otherwise throw the
// page's server HTML away and render it again from its loading fallback. A
// transition waits for the page to finish hydrating.
const advance = (setNow: (now: Date) => void) => () =>
  startTransition(() => setNow(new Date()));

/**
 * One clock for the whole page. A prerendered page was built at `initial`,
 * and its first render in the browser has to produce the same HTML for
 * hydration to adopt it, so the clock starts there and moves to the real
 * time right after, in an effect: "In 3 days", the upcoming list and the
 * calendar's today then catch up a moment after load. Without `initial`
 * (the dev server, or a page rendered from scratch) it starts at now.
 */
export function NowProvider({
  initial,
  children,
}: {
  initial?: Date;
  children: ReactNode;
}) {
  const [now, setNow] = useState(() => initial ?? new Date());
  const [tick] = useState(() => advance(setNow));
  useEffect(tick, [tick]);
  useTicker(tick, TICK, true);
  return createElement(NowContext.Provider, { value: now }, children);
}

/**
 * The current time, refreshed every `intervalMs` while the tab is visible and
 * straight away when it comes back, so countdowns and "happening now" stay
 * right in a tab left open since yesterday. Inside a NowProvider (the app)
 * every component reads the provider's clock, so they agree with each other
 * and with the prerendered HTML; without one (a component under test) it
 * keeps its own.
 */
export function useNow(intervalMs = 30_000) {
  const shared = useContext(NowContext);
  const [own, setOwn] = useState(() => new Date());
  const [tick] = useState(() => advance(setOwn));
  useTicker(tick, intervalMs, shared === null);
  return shared ?? own;
}
