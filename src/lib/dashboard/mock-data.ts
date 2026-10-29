// Self-contained, deterministic mock data engine for the GCP FinOps dashboard.
import { type Threshold } from "./thresholds";

export type Period = "24h" | "7d" | "30d";
export type Environment = "production" | "staging" | "development";
export type SectionId = "database" | "cloud" | "storage" | "processing" | "tokens" | "sla";

export interface Filters {
  period: Period;
  environment: Environment;
  service: string;
  search: string;
}

export type Point = [number, number];
export interface Series {
  name: string;
  data: Point[];
}

export interface ResourceRow {
  name: string;
  region: string;
  value: number;
  share: number;
}

export interface Metric {
  id: string;
  label: string;
  unit: string;
  value: number;
  decimals: number;
  delta: number; // % vs period start
  series: Series[];
  threshold?: Threshold;
  action?: string;
  resources: ResourceRow[];
  /** true when per-resource values are comparable to thresholds (rates, %, latency) */
  intensive: boolean;
}

export interface SectionChart {
  id: string;
  title: string;
  type: "line" | "area" | "bar";
  stacked?: boolean;
  unit: string;
  series: Series[];
}

export interface SectionData {
  id: SectionId;
  metrics: Metric[];
  charts: SectionChart[];
}

export const SERVICES = ["all", "checkout-api", "auth-service", "search-indexer", "ml-inference", "billing-worker"];
export const REGIONS = ["us-central1", "us-east1", "europe-west1", "southamerica-east1", "asia-southeast1"];

const PERIOD_CFG: Record<Period, { points: number; stepMs: number }> = {
  "24h": { points: 96, stepMs: 15 * 60_000 },
  "7d": { points: 168, stepMs: 60 * 60_000 },
  "30d": { points: 120, stepMs: 6 * 60 * 60_000 },
};
const ENV_SCALE: Record<Environment, number> = { production: 1, staging: 0.35, development: 0.12 };

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}
export function rng(seed: string) {
  let a = hash(seed);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Shape {
  base: number;
  amp?: number; // diurnal amplitude (fraction of base)
  noise?: number; // fraction of base
  trend?: number; // total growth over period (fraction)
  spikes?: number; // probability of spike per point
  min?: number;
  max?: number;
}

const NOW = Math.floor(Date.UTC(2026, 9, 29, 17, 0) / 60_000) * 60_000;

function genSeries(seed: string, f: Filters, s: Shape): Point[] {
  const { points, stepMs } = PERIOD_CFG[f.period];
  const r = rng(seed + f.period + f.environment + f.service);
  const out: Point[] = [];
  const start = NOW - (points - 1) * stepMs;
  for (let i = 0; i < points; i++) {
    const t = start + i * stepMs;
    const hour = new Date(t).getUTCHours() + new Date(t).getUTCMinutes() / 60;
    const diurnal = Math.sin(((hour - 8) / 24) * Math.PI * 2);
    let v = s.base * (1 + (s.amp ?? 0.25) * diurnal + (s.trend ?? 0) * (i / points));
    v += (r() - 0.5) * 2 * (s.noise ?? 0.08) * s.base;
    if (s.spikes && r() < s.spikes) v *= 1.6 + r();
    v = Math.max(s.min ?? 0, Math.min(s.max ?? Infinity, v));
    out.push([t, v]);
  }
  return out;
}

function resources(seed: string, total: number, names: string[]): ResourceRow[] {
  const r = rng(seed);
  const weights = names.map(() => 0.2 + r());
  const sum = weights.reduce((a, b) => a + b, 0);
  return names
    .map((name, i) => ({
      name,
      region: REGIONS[Math.floor(r() * REGIONS.length)],
      value: (weights[i] / sum) * total,
      share: weights[i] / sum,
    }))
    .sort((a, b) => b.value - a.value);
}

const last = (p: Point[]) => p[p.length - 1][1];
const avg = (p: Point[]) => p.reduce((a, [, v]) => a + v, 0) / p.length;
const delta = (p: Point[]) => ((last(p) - p[0][1]) / (p[0][1] || 1)) * 100;

interface MetricSpec {
  id: string;
  label: string;
  unit: string;
  decimals?: number;
  shape: Shape;
  scale?: boolean; // scale with environment
  agg?: "last" | "avg" | "sum";
  threshold?: Threshold;
  action?: string;
  resources: string[];
  /** for share-based metrics (percent), breakdown shows per-resource values instead of shares */
  perResource?: boolean;
}

function buildMetric(section: string, spec: MetricSpec, f: Filters): Metric {
  const k = spec.scale === false ? 1 : ENV_SCALE[f.environment];
  const shape = { ...spec.shape, base: spec.shape.base * k };
  const data = genSeries(section + spec.id, f, shape);
  const agg = spec.agg ?? "last";
  const value = agg === "avg" ? avg(data) : agg === "sum" ? data.reduce((a, [, v]) => a + v, 0) : last(data);
  const names = spec.resources.filter((n) => n.toLowerCase().includes(f.search.toLowerCase()));
  let res = resources(section + spec.id + f.environment, value, names.length ? names : spec.resources);
  if (spec.perResource) {
    const r = rng(spec.id + "pr");
    res = res.map((row) => ({ ...row, value: value * (0.6 + r() * 0.7) }));
  }
  return {
    id: spec.id,
    label: spec.label,
    unit: spec.unit,
    value,
    decimals: spec.decimals ?? 0,
    delta: delta(data),
    series: [{ name: spec.label, data }],
    threshold: spec.threshold,
    action: spec.action,
    resources: res,
    intensive: !!spec.perResource,
  };
}

const DB = ["orders-pg-primary", "orders-pg-replica-1", "users-sql", "analytics-spanner", "catalog-alloydb"];
const VMS = ["gke-prod-pool-a", "gke-prod-pool-b", "vm-batch-01", "vm-bastion", "cloudrun-checkout", "cloudrun-auth"];
const BUCKETS = ["gs://media-assets", "gs://data-lake-raw", "gs://backups-daily", "gs://ml-models", "gs://logs-archive"];
const JOBS = ["dataflow-etl", "bq-scheduled", "batch-render", "pubsub-consumer", "vertex-training"];
const MODELS = ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.5-flash-lite", "text-embedding-005"];
const ENDPOINTS = ["/api/checkout", "/api/auth", "/api/search", "/api/predict", "/api/billing"];

const SPECS: Record<SectionId, MetricSpec[]> = {
  database: [
    { id: "qps", label: "Queries / sec", unit: "qps", shape: { base: 4200, amp: 0.35 }, resources: DB },
    { id: "conns", label: "Active Connections", unit: "", shape: { base: 410, amp: 0.3, noise: 0.1 }, threshold: { warn: 400, crit: 480 }, action: "Enable connection pooling (PgBouncer) or raise max_connections", resources: DB },
    { id: "locks", label: "Lock Waits", unit: "", shape: { base: 12, noise: 0.4, spikes: 0.05 }, threshold: { warn: 15, crit: 30 }, action: "Inspect long-running transactions holding row locks", resources: DB },
    { id: "slow", label: "Slow Queries", unit: "/min", shape: { base: 9, noise: 0.5, spikes: 0.06 }, threshold: { warn: 8, crit: 20 }, action: "Optimize query: add composite index on orders(customer_id, created_at)", resources: DB },
    { id: "rt", label: "Avg Response Time", unit: "ms", decimals: 1, scale: false, shape: { base: 18, noise: 0.2, spikes: 0.03 }, threshold: { warn: 25, crit: 50 }, action: "Review query plans and cache hot reads", resources: DB, perResource: true },
    { id: "cpu", label: "DB CPU", unit: "%", decimals: 1, scale: false, shape: { base: 62, amp: 0.25, max: 100 }, threshold: { warn: 70, crit: 90 }, action: "Scale up instance tier or add read replica", resources: DB, perResource: true },
    { id: "io", label: "Disk IO", unit: "MB/s", decimals: 1, shape: { base: 140, amp: 0.3 }, resources: DB },
    { id: "lag", label: "Replication Lag", unit: "s", decimals: 2, scale: false, shape: { base: 0.8, noise: 0.5, spikes: 0.04 }, threshold: { warn: 2, crit: 5 }, action: "Check replica IO throughput and network egress", resources: DB.filter((d) => d.includes("replica") || d.includes("spanner")), perResource: true },
  ],
  cloud: [
    { id: "cpu", label: "CPU Utilization", unit: "%", decimals: 1, scale: false, shape: { base: 58, amp: 0.3, max: 100 }, threshold: { warn: 75, crit: 90 }, action: "Enable autoscaling on GKE node pool", resources: VMS, perResource: true },
    { id: "ram", label: "Memory Usage", unit: "%", decimals: 1, scale: false, shape: { base: 78, amp: 0.08, trend: 0.06, max: 100 }, threshold: { warn: 80, crit: 92 }, action: "Right-size machine type to highmem", resources: VMS, perResource: true },
    { id: "disk", label: "Disk Usage", unit: "%", decimals: 1, scale: false, shape: { base: 64, amp: 0.02, trend: 0.08, noise: 0.01 }, threshold: { warn: 75, crit: 90 }, action: "Increase persistent disk size", resources: VMS, perResource: true },
    { id: "cost", label: "Estimated Cost", unit: "$/day", decimals: 0, shape: { base: 3850, amp: 0.1, trend: 0.05 }, threshold: { warn: 4200, crit: 5000 }, action: "Apply committed use discounts / review idle VMs", resources: VMS },
    { id: "uptime", label: "Uptime", unit: "%", decimals: 3, scale: false, shape: { base: 99.97, amp: 0, noise: 0.0003, max: 100 }, threshold: { warn: 99.9, crit: 99.5, direction: "below" }, action: "Investigate restarted instances", resources: VMS, perResource: true },
  ],
  storage: [
    { id: "total", label: "Total Usage", unit: "TB", decimals: 2, shape: { base: 182, amp: 0, noise: 0.002, trend: 0.04 }, threshold: { warn: 190, crit: 200 }, action: "Increase storage capacity or apply lifecycle rules to Coldline", resources: BUCKETS },
    { id: "iops", label: "IOPS", unit: "", shape: { base: 12500, amp: 0.35 }, resources: BUCKETS },
    { id: "tput", label: "Throughput", unit: "MB/s", decimals: 1, shape: { base: 620, amp: 0.35 }, resources: BUCKETS },
    { id: "lat", label: "Latency p95", unit: "ms", decimals: 1, scale: false, shape: { base: 42, noise: 0.15, spikes: 0.03 }, threshold: { warn: 60, crit: 120 }, action: "Co-locate buckets with compute region", resources: BUCKETS, perResource: true },
  ],
  processing: [
    { id: "queued", label: "Queued Jobs", unit: "", shape: { base: 140, amp: 0.5, noise: 0.2 }, threshold: { warn: 150, crit: 300 }, action: "Add workers to the batch pool", resources: JOBS },
    { id: "running", label: "Running Jobs", unit: "", shape: { base: 64, amp: 0.3 }, resources: JOBS },
    { id: "ptime", label: "Avg Processing Time", unit: "s", decimals: 1, scale: false, shape: { base: 38, noise: 0.15 }, threshold: { warn: 45, crit: 90 }, action: "Parallelize Dataflow stages / tune worker machine type", resources: JOBS, perResource: true },
    { id: "fail", label: "Failures", unit: "/h", shape: { base: 3, noise: 0.6, spikes: 0.05 }, threshold: { warn: 5, crit: 12 }, action: "Inspect dead-letter queue and retry policy", resources: JOBS },
  ],
  tokens: [
    { id: "tpd", label: "Tokens / day", unit: "M", decimals: 1, shape: { base: 48, amp: 0.3, trend: 0.15 }, resources: MODELS },
    { id: "tcost", label: "Token Cost", unit: "$/day", shape: { base: 920, amp: 0.3, trend: 0.15 }, threshold: { warn: 1000, crit: 1400 }, action: "Route simple prompts to flash-lite model", resources: MODELS },
    { id: "err", label: "Error Rate", unit: "%", decimals: 2, scale: false, shape: { base: 0.8, noise: 0.5, spikes: 0.04 }, threshold: { warn: 1, crit: 3 }, action: "Add exponential backoff on 5xx responses", resources: MODELS, perResource: true },
    { id: "rl", label: "Rate Limit Hits", unit: "/h", shape: { base: 22, noise: 0.5, spikes: 0.05 }, threshold: { warn: 30, crit: 80 }, action: "Request quota increase or batch requests", resources: MODELS },
  ],
  sla: [
    { id: "avail", label: "Availability", unit: "%", decimals: 3, scale: false, shape: { base: 99.95, amp: 0, noise: 0.0004, max: 100 }, threshold: { warn: 99.9, crit: 99.5, direction: "below" }, action: "Review error budget burn and incident timeline", resources: ENDPOINTS, perResource: true },
    { id: "4xx", label: "4xx Errors", unit: "/min", shape: { base: 140, amp: 0.3, noise: 0.15 }, threshold: { warn: 200, crit: 400 }, action: "Audit client auth tokens & request validation", resources: ENDPOINTS },
    { id: "5xx", label: "5xx Errors", unit: "/min", shape: { base: 6, noise: 0.5, spikes: 0.05 }, threshold: { warn: 10, crit: 25 }, action: "Roll back latest deployment or scale backend", resources: ENDPOINTS },
    { id: "peak", label: "Peak Requests", unit: "rps", shape: { base: 9800, amp: 0.4 }, agg: "last", resources: ENDPOINTS },
    { id: "growth", label: "Growth Trend", unit: "%", decimals: 1, scale: false, shape: { base: 12, amp: 0.05, trend: 0.3, noise: 0.03 }, resources: ENDPOINTS, perResource: true },
  ],
};

function multi(seed: string, f: Filters, names: string[], shape: Shape): Series[] {
  const k = ENV_SCALE[f.environment];
  return names.map((name, i) => ({
    name,
    data: genSeries(seed + name, f, { ...shape, base: shape.base * k * (1 - i * 0.15) }),
  }));
}

export function generateSection(id: SectionId, f: Filters): SectionData {
  const metrics = SPECS[id].map((s) => buildMetric(id, s, f));
  const m = (mid: string) => metrics.find((x) => x.id === mid)!;
  const charts: SectionChart[] = (() => {
    switch (id) {
      case "database":
        return [
          { id: "qps", title: "Query throughput by instance", type: "area", stacked: true, unit: "qps", series: multi("dbq", f, DB.slice(0, 4), { base: 1100, amp: 0.35 }) },
          { id: "lat", title: "Response time vs replication lag", type: "line", unit: "", series: [{ name: "Response ms", data: m("rt").series[0].data }, { name: "Lag s ×10", data: m("lag").series[0].data.map(([t, v]) => [t, v * 10] as Point) }] },
        ];
      case "cloud":
        return [
          { id: "util", title: "Resource utilization", type: "line", unit: "%", series: [m("cpu").series[0], m("ram").series[0], m("disk").series[0]] },
          { id: "cost", title: "Cost by service", type: "bar", stacked: true, unit: "$", series: multi("cost", f, ["Compute Engine", "GKE", "Cloud SQL", "Cloud Run", "Networking"], { base: 900, amp: 0.1, noise: 0.05 }) },
        ];
      case "storage":
        return [
          { id: "bucket", title: "Usage per bucket (TB)", type: "area", stacked: true, unit: "TB", series: multi("bkt", f, BUCKETS, { base: 40, amp: 0, noise: 0.01, trend: 0.05 }) },
          { id: "io", title: "IOPS & throughput", type: "line", unit: "", series: [m("iops").series[0], { name: "Throughput ×10", data: m("tput").series[0].data.map(([t, v]) => [t, v * 10] as Point) }] },
        ];
      case "processing":
        return [
          { id: "jobs", title: "Job queue depth", type: "area", unit: "jobs", series: [m("queued").series[0], m("running").series[0]] },
          { id: "fail", title: "Failures by pipeline", type: "bar", stacked: true, unit: "", series: multi("fail", f, JOBS, { base: 1.2, noise: 0.6, spikes: 0.05 }) },
        ];
      case "tokens":
        return [
          { id: "model", title: "Tokens per model (M)", type: "bar", stacked: true, unit: "M", series: multi("tok", f, MODELS, { base: 14, amp: 0.3, trend: 0.15 }) },
          { id: "err", title: "Error rate vs rate limits", type: "line", unit: "", series: [m("err").series[0], m("rl").series[0]] },
        ];
      case "sla":
        return [
          { id: "err", title: "4xx / 5xx errors", type: "bar", stacked: true, unit: "/min", series: [m("4xx").series[0], m("5xx").series[0]] },
          { id: "growth", title: "Request volume & growth", type: "area", unit: "rps", series: [m("peak").series[0]] },
        ];
    }
  })();
  return { id, metrics, charts };
}

export const SECTIONS: { id: SectionId; label: string }[] = [
  { id: "database", label: "Database" },
  { id: "cloud", label: "Cloud" },
  { id: "storage", label: "Storage" },
  { id: "processing", label: "Processing" },
  { id: "tokens", label: "Token Usage" },
  { id: "sla", label: "General / SLA" },
];
