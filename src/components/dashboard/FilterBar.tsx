import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SERVICES, type Environment, type Filters, type Period } from "@/lib/dashboard/mock-data";

export function FilterBar({ value, onChange }: { value: Filters; onChange: (f: Filters) => void }) {
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => onChange({ ...value, [k]: v });
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3">
      <ToggleGroup type="single" value={value.period} onValueChange={(v) => v && set("period", v as Period)} variant="outline" size="sm">
        {(["24h", "7d", "30d"] as Period[]).map((p) => (
          <ToggleGroupItem key={p} value={p} className="font-mono text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
            {p}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <Select value={value.environment} onValueChange={(v) => set("environment", v as Environment)}>
        <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="production">Production</SelectItem>
          <SelectItem value="staging">Staging</SelectItem>
          <SelectItem value="development">Development</SelectItem>
        </SelectContent>
      </Select>
      <Select value={value.service} onValueChange={(v) => set("service", v)}>
        <SelectTrigger className="h-8 w-44 font-mono text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          {SERVICES.map((s) => (
            <SelectItem key={s} value={s} className="font-mono text-xs">{s === "all" ? "All services" : s}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="relative ml-auto w-full sm:w-64">
        <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input value={value.search} onChange={(e) => set("search", e.target.value)} placeholder="Search resource…" className="h-8 pl-8 font-mono text-xs" />
      </div>
    </div>
  );
}
