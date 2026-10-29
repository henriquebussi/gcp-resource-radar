import { useMemo, useState } from "react";
import { Activity } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { generateSection, SECTIONS, type Filters } from "@/lib/dashboard/mock-data";
import { evaluate } from "@/lib/dashboard/thresholds";
import { FilterBar } from "./FilterBar";
import { SectionView } from "./SectionView";

export function Dashboard() {
  const [filters, setFilters] = useState<Filters>({ period: "24h", environment: "production", service: "all", search: "" });
  const sections = useMemo(() => SECTIONS.map((s) => ({ ...s, data: generateSection(s.id, filters) })), [filters]);
  const counts = (i: number) => {
    const sev = sections[i].data.metrics.map((m) => evaluate(m.value, m.threshold));
    return { crit: sev.filter((s) => s === "critical").length, warn: sev.filter((s) => s === "warning").length };
  };
  const total = sections.reduce((a, _, i) => ({ crit: a.crit + counts(i).crit, warn: a.warn + counts(i).warn }), { crit: 0, warn: 0 });

  return (
    <TooltipProvider delayDuration={150}>
      <div className="bg-gridlines min-h-screen">
        <div className="mx-auto max-w-[1440px] space-y-5 px-4 py-6 sm:px-8">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
                <Activity className="size-3.5" /> gcp / finops-observatory
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight">Infrastructure & FinOps</h1>
            </div>
            <div className="flex gap-4 font-mono text-xs">
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-destructive" />{total.crit} critical</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-warning" />{total.warn} warning</span>
              <span className="flex items-center gap-1.5"><span className="size-2 animate-pulse rounded-full bg-primary" />live · mock</span>
            </div>
          </header>
          <FilterBar value={filters} onChange={setFilters} />
          <Tabs defaultValue="database">
            <TabsList className="h-auto flex-wrap justify-start bg-card p-1">
              {sections.map((s, i) => {
                const c = counts(i);
                return (
                  <TabsTrigger key={s.id} value={s.id} className="gap-2 text-xs data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                    {s.label}
                    {c.crit > 0 ? <span className="size-1.5 rounded-full bg-destructive" /> : c.warn > 0 ? <span className="size-1.5 rounded-full bg-warning" /> : null}
                  </TabsTrigger>
                );
              })}
            </TabsList>
            {sections.map((s) => (
              <TabsContent key={s.id} value={s.id} className="mt-4">
                <SectionView data={s.data} />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </TooltipProvider>
  );
}
