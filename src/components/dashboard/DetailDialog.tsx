import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import type { Metric } from "@/lib/dashboard/mock-data";
import { evaluate, formatValue } from "@/lib/dashboard/thresholds";
import { AlertBadge } from "./AlertBadge";
import { ApexChart } from "./ApexChart";

export function DetailDialog({ metric, onClose }: { metric: Metric | null; onClose: () => void }) {
  const sev = metric ? evaluate(metric.value, metric.threshold) : "ok";
  return (
    <Dialog open={!!metric} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        {metric && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <DialogTitle>{metric.label}</DialogTitle>
                <AlertBadge severity={sev} action={metric.action} />
              </div>
              <DialogDescription className="font-mono text-xs">
                current {formatValue(metric.value, metric.decimals)} {metric.unit}
                {metric.threshold && ` · warn ${metric.threshold.warn} · crit ${metric.threshold.crit}`}
              </DialogDescription>
            </DialogHeader>
            {sev !== "ok" && metric.action && (
              <div className={sev === "critical" ? "rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm" : "rounded-md border border-warning/50 bg-warning/10 p-3 text-sm"}>
                <span className="font-medium">Suggested action: </span>{metric.action}
              </div>
            )}
            <ApexChart series={metric.series} type="area" height={220} unit={metric.unit} threshold={metric.threshold} />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resource</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="w-40">Share</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metric.resources.map((r) => (
                  <TableRow key={r.name}>
                    <TableCell className="font-mono text-xs">{r.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{r.region}</TableCell>
                    <TableCell className="tabular text-right text-xs">{formatValue(r.value, metric.decimals)} {metric.unit}</TableCell>
                    <TableCell><Progress value={r.share * 100} className="h-1.5" /></TableCell>
                    <TableCell className="text-right"><AlertBadge severity={evaluate(r.value, metric.threshold && r.share < 1 && !["%", "ms", "s"].includes(metric.unit) ? undefined : metric.threshold)} action={metric.action} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
