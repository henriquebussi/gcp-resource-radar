import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { Metric, SectionData } from "@/lib/dashboard/mock-data";
import { MetricCard } from "./MetricCard";
import { DetailDialog } from "./DetailDialog";
import { ApexChart } from "./ApexChart";

export function SectionView({ data }: { data: SectionData }) {
  const [open, setOpen] = useState<Metric | null>(null);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {data.metrics.map((m) => (
          <MetricCard key={m.id} metric={m} onOpen={() => setOpen(m)} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {data.charts.map((c) => (
          <Card key={c.id} className="gap-2 py-4">
            <CardHeader className="px-4">
              <CardTitle className="font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">{c.title}</CardTitle>
            </CardHeader>
            <CardContent className="px-2">
              <ApexChart series={c.series} type={c.type} stacked={c.stacked} unit={c.unit} height={280} />
            </CardContent>
          </Card>
        ))}
      </div>
      <DetailDialog metric={open} onClose={() => setOpen(null)} />
    </div>
  );
}
