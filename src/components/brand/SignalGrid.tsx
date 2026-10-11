import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/** Matches .bg-dots in globals.css: dot centres every 24px, offset by 12px. */
const SPACING = 24;
const OFFSET = 12;
const FRAME_MS = 1000 / 30;
/** Distance between the crests that roll out of the ring, in px. */
const WAVELENGTH = 190;
/** How fast those crests travel, in px per second. */
const WAVE_SPEED = 48;
/** Dots this close to the pointer light up and link to their neighbours. */
const POINTER_RADIUS = 150;
/** A signal sets off along the grid about this often (ms), a few at a time. */
const SPIKE_EVERY = 1800;
const SPIKES = 3;
const SPIKE_STEP_MS = 55;
const TRAIL = 14;
const TRAIL_MS = 700;

type RGB = [number, number, number];

type Spike = {
  col: number;
  row: number;
  dc: number;
  dr: number;
  steps: number;
  nextStep: number;
  trail: { col: number; row: number; at: number }[];
};

const hexToRgb = (hex: string): RGB | null => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
};

const mix = (a: RGB, b: RGB, t: number) =>
  `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",")})`;

const rgba = (c: RGB, alpha: number) =>
  `rgba(${c.join(",")},${alpha.toFixed(3)})`;

type SignalGridProps = {
  className?: string;
  /** Where the waves start, as a share of the width and height: the ring. */
  origin?: { x: number; y: number };
};

/**
 * The posters' dot grid, alive. A canvas over the CSS dots where slow waves
 * roll out from the ring and lift the dots they pass, the dots near the
 * pointer brighten and link up like a patch of network, and every second or
 * two a signal runs along the grid the way a spike runs down an axon.
 *
 * Decorative only: aria-hidden, no pointer events, no layout. It draws only
 * the lit dots, so without JavaScript, with reduced motion, or while hidden
 * or scrolled past, the page shows the plain CSS grid underneath.
 */
export function SignalGrid({
  className,
  origin = { x: 1.08, y: -0.2 },
}: SignalGridProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    // Without IntersectionObserver (jsdom) there is no way to idle offscreen.
    if (!canvas || typeof IntersectionObserver === "undefined") return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

    let width = 0;
    let height = 0;
    let cols = 0;
    let rows = 0;
    let dot: RGB = [30, 31, 36];
    let mark: RGB = [207, 37, 46];
    let pointer: { x: number; y: number } | null = null;
    let spikes: Spike[] = [];
    let nextSpike = 0;
    let raf = 0;
    let last = 0;
    let visible = false;

    const running = () => visible && !document.hidden && !motion.matches;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.round(rect.width);
      height = Math.round(rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(width / SPACING);
      rows = Math.ceil(height / SPACING);
      const style = getComputedStyle(canvas);
      dot = hexToRgb(style.getPropertyValue("--color-dot")) ?? dot;
      mark = hexToRgb(style.getPropertyValue("--color-mark")) ?? mark;
    };

    const at = (col: number, row: number) =>
      [OFFSET + col * SPACING, OFFSET + row * SPACING] as const;

    const spawnSpike = (now: number) => {
      const [dc, dr] = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ][Math.floor(Math.random() * 4)];
      spikes.push({
        col: Math.floor(Math.random() * cols),
        row: Math.floor(Math.random() * rows),
        dc,
        dr,
        steps: 16 + Math.floor(Math.random() * 16),
        nextStep: now,
        trail: [],
      });
    };

    const stepSpikes = (now: number) => {
      if (now >= nextSpike && spikes.length < SPIKES && cols > 0) {
        spawnSpike(now);
        nextSpike = now + SPIKE_EVERY * (0.7 + Math.random() * 0.6);
      }
      for (const s of spikes) {
        while (s.steps > 0 && now >= s.nextStep) {
          s.trail.push({ col: s.col, row: s.row, at: s.nextStep });
          if (s.trail.length > TRAIL) s.trail.shift();
          if (Math.random() < 0.22) {
            // Turn a corner, either way.
            [s.dc, s.dr] = Math.random() < 0.5 ? [s.dr, -s.dc] : [-s.dr, s.dc];
          }
          s.col += s.dc;
          s.row += s.dr;
          if (s.col < 0 || s.col >= cols || s.row < 0 || s.row >= rows) {
            s.steps = 0;
            break;
          }
          s.steps -= 1;
          s.nextStep += SPIKE_STEP_MS;
        }
      }
      spikes = spikes.filter(
        (s) =>
          s.steps > 0 ||
          (s.trail.length > 0 &&
            now - s.trail[s.trail.length - 1].at < TRAIL_MS),
      );
    };

    const draw = (now: number) => {
      ctx.clearRect(0, 0, width, height);
      const t = now / 1000;
      const ox = origin.x * width;
      const oy = origin.y * height;
      const reach = Math.hypot(width, height);
      // Dots are drawn in eight brightness buckets, one path each.
      const buckets: number[][] = Array.from({ length: 8 }, () => []);
      const links: [number, number, number, number, number][] = [];

      for (let r = 0; r < rows; r++) {
        const y = OFFSET + r * SPACING;
        for (let c = 0; c < cols; c++) {
          const x = OFFSET + c * SPACING;
          const d = Math.hypot(x - ox, y - oy);
          const phase = ((d - WAVE_SPEED * t) / WAVELENGTH) * Math.PI * 2;
          // Narrow crests, fading the further they get from the ring.
          const crest =
            Math.pow(0.5 + 0.5 * Math.cos(phase), 6) *
            0.5 *
            Math.max(0, 1 - d / reach);
          let glow = 0;
          if (pointer) {
            const pd = Math.hypot(x - pointer.x, y - pointer.y);
            if (pd < POINTER_RADIUS) {
              glow = Math.pow(1 - pd / POINTER_RADIUS, 2);
              if (glow > 0.12) {
                if (c + 1 < cols) links.push([x, y, x + SPACING, y, glow]);
                if (r + 1 < rows) links.push([x, y, x, y + SPACING, glow]);
              }
            }
          }
          const lit = Math.max(crest, glow);
          if (lit < 0.05) continue;
          buckets[Math.min(7, Math.round(lit * 7))].push(x, y);
        }
      }

      for (let b = 1; b < 8; b++) {
        const pts = buckets[b];
        if (pts.length === 0) continue;
        const a = b / 7;
        ctx.fillStyle = mix(dot, mark, 0.25 + 0.75 * a);
        const radius = 1.5 + 1.3 * a;
        ctx.beginPath();
        for (let i = 0; i < pts.length; i += 2) {
          ctx.moveTo(pts[i] + radius, pts[i + 1]);
          ctx.arc(pts[i], pts[i + 1], radius, 0, Math.PI * 2);
        }
        ctx.fill();
      }

      ctx.lineWidth = 1;
      for (const [x1, y1, x2, y2, g] of links) {
        ctx.strokeStyle = rgba(mark, g * 0.6);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      ctx.lineWidth = 1.5;
      ctx.lineCap = "round";
      for (const s of spikes) {
        const pts =
          s.steps > 0
            ? [...s.trail, { col: s.col, row: s.row, at: now }]
            : s.trail;
        for (let i = 1; i < pts.length; i++) {
          const a = Math.max(0, 1 - (now - pts[i].at) / TRAIL_MS) * 0.9;
          if (a <= 0) continue;
          const [x1, y1] = at(pts[i - 1].col, pts[i - 1].row);
          const [x2, y2] = at(pts[i].col, pts[i].row);
          ctx.strokeStyle = rgba(mark, a);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
        if (s.steps > 0) {
          const [x, y] = at(s.col, s.row);
          ctx.fillStyle = rgba(mark, 1);
          ctx.beginPath();
          ctx.arc(x, y, 2.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const frame = (now: number) => {
      raf = 0;
      if (!running()) return;
      if (now - last >= FRAME_MS) {
        last = now;
        stepSpikes(now);
        draw(now);
      }
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (!raf && running()) raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      ctx.clearRect(0, 0, width, height);
    };
    const update = () => (running() ? start() : stop());

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !finePointer.matches) return;
      const rect = canvas.getBoundingClientRect();
      pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };
    const onLeave = () => {
      pointer = null;
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    io.observe(canvas);
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    ro?.observe(canvas);
    resize();
    document.addEventListener("visibilitychange", update);
    motion.addEventListener("change", update);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    window.addEventListener("blur", onLeave);

    return () => {
      stop();
      io.disconnect();
      ro?.disconnect();
      document.removeEventListener("visibilitychange", update);
      motion.removeEventListener("change", update);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("blur", onLeave);
    };
  }, [origin.x, origin.y]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full",
        className,
      )}
    />
  );
}
