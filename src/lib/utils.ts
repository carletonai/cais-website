import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** "2025-2026" -> "2025–26", the way the site writes a season. */
export const seasonLabel = (year: string) => {
  const m = /^(\d{4})\s*[-–]\s*(\d{2})(\d{2})$/.exec(year.trim());
  return m ? `${m[1]}–${m[3]}` : year;
};
