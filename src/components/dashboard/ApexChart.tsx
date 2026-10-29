import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import type { ApexOptions } from "apexcharts";
import type { Series } from "@/lib/dashboard/mock-data";
import { formatValue } from "@/lib/dashboard/thresholds";

// apexcharts touches `window` at import time → load only in the browser.
const ReactApexChart = lazy(() => import("react-apexcharts"));

function useTokens() {
  const [tokens, setTokens] = useState<Record<string, string> | null>(null);
  useEffect(() => {
    const cs = getComputedStyle(document.documentElement);
    const g = (n: string) => cs.getPropertyValue(n).trim();
    setTokens({
      c1: g("--chart-1"), c2: g("--chart-2"), c3: g("--chart-3"), c4: g("--chart-4"), c5: g("--chart-5"),
      grid: g("--border"), muted: g("--muted-foreground"), warn: g("--warning"), crit: g("--destructive"),
      mono: g("--font-mono"),
    });
  }, []);
  return tokens;
}

interface Props {
  series: Series[];
  type: "line" | "area" | "bar";
  height?: number;
  stacked?: boolean;
  sparkline?: boolean;
  unit?: string;
  colorOverride?: string;
  threshold?: { warn: number; crit: number };
}

export function ApexChart({ series, type, height = 260, stacked, sparkline, unit = "", colorOverride, threshold }: Props) {
  const t = useTokens();
  const options = useMemo<ApexOptions | null>(() => {
    if (!t) return null;
    const palette = colorOverride ? [colorOverride] : [t.c1, t.c2, t.c3, t.c4, t.c5];
    return {
      chart: {
        type, stacked, sparkline: { enabled: !!sparkline }, toolbar: { show: false },
        zoom: { enabled: !sparkline }, animations: { enabled: false }, fontFamily: t.mono, foreColor: t.muted,
      },
      colors: palette,
      stroke: { width: type === "bar" ? 0 : sparkline ? 1.5 : 1.75, curve: "smooth" },
      fill: type === "area" ? { type: "gradient", gradient: { opacityFrom: 0.35, opacityTo: 0.02 } } : { opacity: 1 },
      dataLabels: { enabled: false },
      grid: { borderColor: t.grid, strokeDashArray: 3, xaxis: { lines: { show: true } } },
      xaxis: { type: "datetime", labels: { datetimeUTC: false, style: { fontSize: "10px" } }, axisBorder: { color: t.grid }, axisTicks: { color: t.grid } },
      yaxis: { labels: { formatter: (v: number) => formatValue(v, v < 10 ? 1 : 0), style: { fontSize: "10px" } } },
      legend: { position: "top", horizontalAlign: "left", fontSize: "11px", markers: { size: 5 } },
      tooltip: { x: { format: "dd MMM HH:mm" }, y: { formatter: (v: number) => `${formatValue(v, 2)} ${unit}` } },
      plotOptions: { bar: { columnWidth: "70%", borderRadius: 1 } },
      annotations: threshold && !sparkline ? {
        yaxis: [
          { y: threshold.warn, borderColor: t.warn, strokeDashArray: 4, label: { text: "warn", style: { background: t.warn, fontSize: "9px" } } },
          { y: threshold.crit, borderColor: t.crit, strokeDashArray: 4, label: { text: "crit", style: { background: t.crit, color: "#fff", fontSize: "9px" } } },
        ],
      } : undefined,
    };
  }, [t, type, stacked, sparkline, unit, colorOverride, threshold]);

  const fallback = <div style={{ height }} className="animate-pulse rounded bg-muted" />;
  if (!options) return fallback;
  return (
    <Suspense fallback={fallback}>
      <ReactApexChart options={options} series={series} type={type} height={height} />
    </Suspense>
  );
}

export function useSeverityColor() {
  const [c, setC] = useState<Record<string, string>>({});
  useEffect(() => {
    const cs = getComputedStyle(document.documentElement);
    setC({ ok: cs.getPropertyValue("--chart-1").trim(), warning: cs.getPropertyValue("--warning").trim(), critical: cs.getPropertyValue("--destructive").trim() });
  }, []);
  return c;
}
