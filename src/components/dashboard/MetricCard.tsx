import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Metric } from "@/lib/dashboard/mock-data";
import { evaluate, formatValue } from "@/lib/dashboard/thresholds";
import { AlertBadge } from "./AlertBadge";
import { ApexChart, useSeverityColor } from "./ApexChart";

const RING = {
  ok: "hover:border-primary/50",
  warning: "border-warning/60 bg-warning/5",
  critical: "border-destructive/50 bg-destructive/5",
};

export function MetricCard({ metric, onOpen }: { metric: Metric; onOpen: () => void }) {
  const sev = evaluate(metric.value, metric.threshold);
  const colors = useSeverityColor();
  const up = metric.delta >= 0;
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      className={cn("cursor-pointer gap-0 p-4 transition-all hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", RING[sev])}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
        <AlertBadge severity={sev} action={metric.action} />
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="tabular text-2xl font-medium tracking-tight">{formatValue(metric.value, metric.decimals)}</span>
        <span className="font-mono text-xs text-muted-foreground">{metric.unit}</span>
        <span className={cn("tabular ml-auto flex items-center text-[11px]", up ? "text-primary" : "text-muted-foreground")}>
          {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
          {Math.abs(metric.delta).toFixed(1)}%
        </span>
      </div>
      <div className="-mx-1 mt-2">
        <ApexChart series={metric.series} type="area" height={44} sparkline colorOverride={colors[sev]} />
      </div>
    </Card>
  );
}
