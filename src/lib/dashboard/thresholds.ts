export type Severity = "ok" | "warning" | "critical";

export interface Threshold {
  warn: number;
  crit: number;
  /** "above" (default): higher is worse. "below": lower is worse (e.g. uptime). */
  direction?: "above" | "below";
}

export function evaluate(value: number, t?: Threshold): Severity {
  if (!t) return "ok";
  if ((t.direction ?? "above") === "below") {
    if (value <= t.crit) return "critical";
    if (value <= t.warn) return "warning";
    return "ok";
  }
  if (value >= t.crit) return "critical";
  if (value >= t.warn) return "warning";
  return "ok";
}

export function formatValue(v: number, decimals = 0) {
  if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(2) + "M";
  if (Math.abs(v) >= 1e4) return (v / 1e3).toFixed(1) + "k";
  return v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
