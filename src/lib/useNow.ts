import { useEffect, useState } from "react";

/**
 * The current time, refreshed every `intervalMs` while the tab is visible and
 * straight away when it comes back, so countdowns and "happening now" stay
 * right in a tab left open since yesterday.
 */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    const start = () => {
      clearInterval(timer);
      timer = setInterval(() => setNow(new Date()), intervalMs);
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        setNow(new Date());
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
  }, [intervalMs]);

  return now;
}
