const pad = (n: number) => String(n).padStart(2, "0");

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** Days, hours and minutes to go, in the posters' mono boxes. */
export function Countdown({
  ms,
  className,
}: {
  ms: number;
  className?: string;
}) {
  const total = Math.max(0, Math.floor(ms / 60_000));
  const days = Math.floor(total / 1440);
  const hours = Math.floor((total % 1440) / 60);
  const minutes = total % 60;
  const units = [
    { value: days, label: "days" },
    { value: hours, label: "hrs" },
    { value: minutes, label: "min" },
  ];

  return (
    <div className={className}>
      <p className="sr-only">
        Starts in {plural(days, "day")}, {plural(hours, "hour")} and{" "}
        {plural(minutes, "minute")}
      </p>
      <div aria-hidden="true" className="flex gap-2">
        {units.map(({ value, label }) => (
          <div
            key={label}
            className="flex min-w-16 flex-col items-center rounded-xl border border-border bg-card px-3 py-2"
          >
            <span className="font-mono text-2xl font-medium tabular-nums">
              {pad(value)}
            </span>
            <span className="label-mono text-[0.625rem] text-muted-foreground">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
