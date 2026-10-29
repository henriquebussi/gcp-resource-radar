import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/dashboard/Dashboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GCP Infrastructure & FinOps Dashboard" },
      { name: "description", content: "Database, cloud, storage, processing, token usage and SLA metrics with alerts and drill-downs." },
      { property: "og:title", content: "GCP Infrastructure & FinOps Dashboard" },
      { property: "og:description", content: "Monitor GCP infrastructure health and spend with threshold alerts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});
