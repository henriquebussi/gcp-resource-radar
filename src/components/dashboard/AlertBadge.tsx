import { AlertTriangle, CheckCircle2, OctagonAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Severity } from "@/lib/dashboard/thresholds";

const LABEL: Record<Severity, string> = { ok: "Healthy", warning: "Warning", critical: "Critical" };
const ICON = { ok: CheckCircle2, warning: AlertTriangle, critical: OctagonAlert };

export function AlertBadge({ severity, action }: { severity: Severity; action?: string }) {
  const Icon = ICON[severity];
  const badge = (
    <Badge variant={severity} className="gap-1 font-mono text-[10px] uppercase tracking-wider">
      <Icon className="size-3" />
      {LABEL[severity]}
    </Badge>
  );
  if (severity === "ok" || !action) return badge;
  return (
    <Tooltip>
      <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
        <span>{badge}</span>
      </TooltipTrigger>
      <TooltipContent className="max-w-64">
        <p className="text-[10px] uppercase tracking-wider opacity-70">Suggested action</p>
        <p className="text-xs">{action}</p>
      </TooltipContent>
    </Tooltip>
  );
}
