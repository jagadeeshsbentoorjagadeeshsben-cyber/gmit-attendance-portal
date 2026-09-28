import type { DisplayStatus } from "./types";

export const MIN_REQUIRED = 75;

/**
 * Derive the rich 5-state display status from a percentage.
 * A subject that has not started (conducted === 0) is always NOT_STARTED
 * and must never look like genuine perfect attendance.
 */
export function deriveStatus(
  percentage: number,
  isStarted: boolean,
  minimum = MIN_REQUIRED
): DisplayStatus {
  if (!isStarted) return "NOT_STARTED";
  if (percentage >= 90) return "EXCELLENT";
  if (percentage >= minimum) return "ON_TRACK";
  if (percentage >= 50) return "AT_RISK";
  return "CRITICAL";
}

export const STATUS_LABEL: Record<DisplayStatus, string> = {
  EXCELLENT: "Excellent",
  ON_TRACK: "On Track",
  AT_RISK: "At Risk",
  CRITICAL: "Critical",
  NOT_STARTED: "Not Started",
};

export interface StatusTheme {
  /** tailwind text color class */
  text: string;
  /** hex used for ring/graph strokes */
  hex: string;
  /** soft background tint class */
  tint: string;
  /** border class */
  ring: string;
}

export const STATUS_THEME: Record<DisplayStatus, StatusTheme> = {
  EXCELLENT: {
    text: "text-success",
    hex: "#12B76A",
    tint: "bg-success/10",
    ring: "border-success/30",
  },
  ON_TRACK: {
    text: "text-royal",
    hex: "#245BFF",
    tint: "bg-royal/10",
    ring: "border-royal/30",
  },
  AT_RISK: {
    text: "text-warning",
    hex: "#F79009",
    tint: "bg-warning/10",
    ring: "border-warning/30",
  },
  CRITICAL: {
    text: "text-danger",
    hex: "#F04438",
    tint: "bg-danger/10",
    ring: "border-danger/30",
  },
  NOT_STARTED: {
    text: "text-muted",
    hex: "#98A2B3",
    tint: "bg-muted/10",
    ring: "border-border",
  },
};

export function healthMessage(percentage: number, isStarted: boolean): string {
  if (!isStarted) return "No classes have been conducted yet.";
  if (percentage >= 90)
    return "Outstanding — your attendance is comfortably above the requirement.";
  if (percentage >= MIN_REQUIRED)
    return "You're currently above the minimum attendance requirement.";
  if (percentage >= 50)
    return "You're below 75%. A little planning will bring you back on track.";
  return "Your attendance needs urgent attention to recover to 75%.";
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** classes that can be missed while staying at/above `minimum` */
export function classesCanMiss(
  attended: number,
  conducted: number,
  minimum = MIN_REQUIRED
): number {
  if (conducted === 0) return 0;
  const m = minimum / 100;
  // attended / (conducted + x) >= m  =>  x <= attended/m - conducted
  const x = Math.floor(attended / m - conducted);
  return Math.max(0, x);
}

/** consecutive classes to attend to reach `minimum` */
export function classesToRecover(
  attended: number,
  conducted: number,
  minimum = MIN_REQUIRED
): number {
  if (conducted === 0) return 0;
  if ((attended / conducted) * 100 >= minimum) return 0;
  const m = minimum / 100;
  // (attended + x) / (conducted + x) >= m
  const x = Math.ceil((m * conducted - attended) / (1 - m));
  return Math.max(0, x);
}

export interface ForecastPoint {
  key: string;
  label: string;
  attended: number;
  conducted: number;
  percentage: number;
  delta: number;
}

/** forecast scenarios for a given attended/conducted pair */
export function buildForecast(
  attended: number,
  conducted: number,
  minimum = MIN_REQUIRED
): ForecastPoint[] {
  const base = conducted === 0 ? 0 : (attended / conducted) * 100;
  const make = (
    key: string,
    label: string,
    addAtt: number,
    addCond: number
  ): ForecastPoint => {
    const a = attended + addAtt;
    const c = conducted + addCond;
    const pct = c === 0 ? 0 : round2((a / c) * 100);
    return {
      key,
      label,
      attended: a,
      conducted: c,
      percentage: pct,
      delta: round2(pct - base),
    };
  };
  return [
    make("current", "Now", 0, 0),
    make("miss1", "Miss next", 0, 1),
    make("attend1", "Attend next", 1, 1),
    make("attend3", "Attend 3", 3, 3),
    make("attend5", "Attend 5", 5, 5),
  ];
}
